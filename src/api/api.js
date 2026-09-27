import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Market
export const fetchPrices = () => api.get('/market/prices');
export const fetchHistory = (coinId, days) => api.get(`/market/history/${coinId}?days=${days}`);
export const searchCoins = (q) => api.get(`/market/search?q=${q}`);

// Trade
export const executeTrade = (data) => api.post('/trade', data);

// Portfolio
export const fetchPortfolio = () => api.get('/portfolio');

// Watchlist
export const fetchWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (data) => api.post('/watchlist', data);
export const removeFromWatchlist = (cryptoId) => api.delete(`/watchlist/${cryptoId}`);

// Transactions
export const fetchTransactions = () => api.get('/transactions');

export default api;
