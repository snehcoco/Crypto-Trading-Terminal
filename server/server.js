require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { createServer } = require('node:http');
const { randomBytes } = require('node:crypto');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const MARKET_CACHE_MS = 30_000;

if (!MONGODB_URI) throw new Error('MONGODB_URI is required. Set it in server/.env.');
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

const holdingSchema = new mongoose.Schema({
  cryptoId: { type: String, required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  avgPurchasePrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const watchlistItemSchema = new mongoose.Schema({
  cryptoId: { type: String, required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  isDemo: { type: Boolean, default: false },
  virtualBalance: { type: Number, default: 10_000, min: 0 },
  holdings: { type: [holdingSchema], default: [] },
  watchlist: { type: [watchlistItemSchema], default: [] },
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cryptoId: { type: String, required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: FRONTEND_URL } });
const marketCache = new Map();

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: '32kb' }));

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    virtualBalance: user.virtualBalance,
  };
}

function createToken(user) {
  return jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
}

function sendAuthResponse(res, user, status = 200) {
  return res.status(status).json({ ...publicUser(user), token: createToken(user) });
}

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid authentication token' });
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }
    return next(error);
  }
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function cached(key, ttlMs, load) {
  const entry = marketCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.pending || entry.value;
  }

  const pending = load();
  marketCache.set(key, { expiresAt: Date.now() + ttlMs, value: null, pending });
  try {
    const value = await pending;
    marketCache.set(key, { expiresAt: Date.now() + ttlMs, value, pending: null });
    return value;
  } catch (error) {
    marketCache.delete(key);
    throw error;
  }
}

async function coinGecko(path) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3${path}`, {
      headers: { accept: 'application/json', 'user-agent': 'CryptoTradingTerminal/1.0' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      throw Object.assign(new Error(`Market data provider returned HTTP ${response.status}`), { status: 502 });
    }
    return await response.json();
  } catch (error) {
    if (!error.status) error.status = 502;
    throw error;
  }
}

async function getMarketPrices() {
  return cached('market-prices', MARKET_CACHE_MS, async () => {
    const coins = await coinGecko('/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
    return coins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h ?? 0,
      volume24h: coin.total_volume ?? 0,
      rank: coin.market_cap_rank,
    }));
  });
}

async function getCoinPrice(cryptoId) {
  const marketPrices = await getMarketPrices();
  const coin = marketPrices.find((item) => item.id === cryptoId);
  if (coin) return coin.price;

  const result = await coinGecko(`/simple/price?ids=${encodeURIComponent(cryptoId)}&vs_currencies=usd`);
  const price = result[cryptoId]?.usd;
  if (!Number.isFinite(price) || price <= 0) throw new Error('Could not find a current price for that asset');
  return price;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
    return res.status(400).json({ message: 'Name, valid email, and a password of at least 6 characters are required' });
  }
  if (email === 'demo@cryptoterminal.io') {
    return res.status(409).json({ message: 'This email is reserved for the demo account' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ name, email, passwordHash });
    return sendAuthResponse(res, user, 201);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' });
    throw error;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  return sendAuthResponse(res, user);
}));

app.post('/api/auth/demo', asyncRoute(async (req, res) => {
  const email = 'demo@cryptoterminal.io';
  let user = await User.findOne({ isDemo: true });
  if (!user) {
    try {
      user = await User.create({
        name: 'Demo Trader',
        email,
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
        isDemo: true,
        virtualBalance: 100_000,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      user = await User.findOne({ isDemo: true });
      if (!user) return res.status(409).json({ message: 'The demo account email is already in use' });
    }
  }
  return sendAuthResponse(res, user);
}));

app.get('/api/auth/me', authenticate, (req, res) => res.json(publicUser(req.user)));

app.get('/api/market/prices', asyncRoute(async (req, res) => {
  res.json(await getMarketPrices());
}));

app.get('/api/market/history/:coinId', asyncRoute(async (req, res) => {
  const days = Number(req.query.days || 7);
  if (!Number.isFinite(days) || days <= 0 || days > 365) {
    return res.status(400).json({ message: 'days must be a number greater than 0 and no more than 365' });
  }
  const period = days < 1 ? '1' : String(Math.round(days));
  const chart = await cached(`history:${req.params.coinId}:${period}`, 60_000, () =>
    coinGecko(`/coins/${encodeURIComponent(req.params.coinId)}/market_chart?vs_currency=usd&days=${period}`));
  res.json((chart.prices || []).map(([time, value]) => ({ time: Math.floor(time / 1000), value })));
}));

app.get('/api/market/search', asyncRoute(async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return res.json([]);
  const results = await cached(`search:${query.toLowerCase()}`, 60_000, () =>
    coinGecko(`/search?query=${encodeURIComponent(query)}`));
  res.json((results.coins || []).slice(0, 10).map((coin) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.large || coin.thumb,
    rank: coin.market_cap_rank,
  })));
}));

app.post('/api/trade', authenticate, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const { cryptoId, symbol, name, type } = body;
  const quantity = Number(body.quantity);
  if (![cryptoId, symbol, name].every((value) => typeof value === 'string' && value.trim()) ||
      !['BUY', 'SELL'].includes(type) || !Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid order amount or asset details' });
  }

  let price;
  try {
    price = await getCoinPrice(cryptoId);
  } catch (error) {
    return res.status(502).json({ message: 'Unable to retrieve a current market price. Try again shortly.' });
  }
  const total = quantity * price;
  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ message: 'Invalid order amount' });
  }

  const session = await mongoose.startSession();
  let updatedUser;
  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.user._id).session(session);
      if (!user) throw Object.assign(new Error('User account not found'), { status: 404 });

      const holding = user.holdings.find((item) => item.cryptoId === cryptoId);
      if (type === 'BUY') {
        if (total > user.virtualBalance) {
          throw Object.assign(new Error('Insufficient virtual balance'), { status: 400 });
        }
        user.virtualBalance -= total;
        if (holding) {
          const previousCost = holding.quantity * holding.avgPurchasePrice;
          holding.quantity += quantity;
          holding.avgPurchasePrice = (previousCost + total) / holding.quantity;
        } else {
          user.holdings.push({ cryptoId, symbol, name, quantity, avgPurchasePrice: price });
        }
      } else {
        if (!holding || holding.quantity < quantity) {
          throw Object.assign(new Error('Insufficient holdings to sell'), { status: 400 });
        }
        user.virtualBalance += total;
        holding.quantity -= quantity;
        if (holding.quantity === 0) user.holdings = user.holdings.filter((item) => item.cryptoId !== cryptoId);
      }

      await user.save({ session });
      await Transaction.create([{
        userId: user._id,
        cryptoId,
        symbol: symbol.toUpperCase(),
        name,
        type,
        quantity,
        price,
        total,
      }], { session });
      updatedUser = user;
    });
  } finally {
    await session.endSession();
  }
  return res.json({ message: `${type} order executed`, newBalance: updatedUser.virtualBalance });
}));

app.get('/api/portfolio', authenticate, asyncRoute(async (req, res) => {
  const marketPrices = await getMarketPrices();
  const byId = new Map(marketPrices.map((coin) => [coin.id, coin.price]));
  const holdings = req.user.holdings.map((holding) => {
    const currentPrice = byId.get(holding.cryptoId) ?? holding.avgPurchasePrice;
    const currentValue = holding.quantity * currentPrice;
    const costBasis = holding.quantity * holding.avgPurchasePrice;
    return {
      cryptoId: holding.cryptoId,
      symbol: holding.symbol,
      name: holding.name,
      quantity: holding.quantity,
      avgPurchasePrice: holding.avgPurchasePrice,
      currentPrice,
      currentValue,
      unrealizedPL: currentValue - costBasis,
      plPercent: costBasis ? ((currentValue - costBasis) / costBasis) * 100 : 0,
    };
  });
  const totalHoldingsValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  res.json({
    holdings,
    totalHoldingsValue,
    virtualBalance: req.user.virtualBalance,
    totalPortfolioValue: req.user.virtualBalance + totalHoldingsValue,
  });
}));

app.get('/api/watchlist', authenticate, (req, res) => res.json(req.user.watchlist));

app.post('/api/watchlist', authenticate, asyncRoute(async (req, res) => {
  const { cryptoId, symbol, name } = req.body || {};
  if (![cryptoId, symbol, name].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ message: 'Crypto ID, symbol, and name are required' });
  }
  if (req.user.watchlist.some((item) => item.cryptoId === cryptoId)) {
    return res.status(409).json({ message: 'Asset is already in your watchlist' });
  }
  req.user.watchlist.push({ cryptoId, symbol, name });
  await req.user.save();
  res.status(201).json(req.user.watchlist);
}));

app.delete('/api/watchlist/:cryptoId', authenticate, asyncRoute(async (req, res) => {
  req.user.watchlist = req.user.watchlist.filter((item) => item.cryptoId !== req.params.cryptoId);
  await req.user.save();
  res.json(req.user.watchlist);
}));

app.get('/api/transactions', authenticate, asyncRoute(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(500).lean();
  res.json(transactions);
}));

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.status) return res.status(error.status).json({ message: error.message });
  res.status(500).json({ message: 'Internal server error' });
});

async function broadcastMarketPrices() {
  try {
    io.emit('market_update', await getMarketPrices());
  } catch (error) {
    console.error(`Market data update failed: ${error.message}`);
  }
}

async function start() {
  await mongoose.connect(MONGODB_URI);
  await Promise.all([User.init(), Transaction.init()]);
  console.log('Connected to MongoDB');
  httpServer.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
  broadcastMarketPrices();
  setInterval(broadcastMarketPrices, MARKET_CACHE_MS);
}

start().catch((error) => {
  console.error(`Failed to start API server (${error.name}). Check MONGODB_URI, Atlas network access, and database credentials.`);
  process.exitCode = 1;
});
