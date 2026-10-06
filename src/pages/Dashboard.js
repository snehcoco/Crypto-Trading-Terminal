import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { fetchPrices, fetchHistory, addToWatchlist, fetchWatchlist } from '../api/api';
import SearchBar from '../components/SearchBar';
import PriceChart from '../components/PriceChart';
import TradePanel from '../components/TradePanel';
import toast from 'react-hot-toast';

const formatPrice = (v) => {
  if (!v && v !== 0) return '$0.00';
  if (v >= 1) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(6)}`;
};

const formatVolume = (v) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
};

export default function Dashboard() {
  const { marketData, lastUpdated } = useSocket();
  const [prices, setPrices] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedDays, setSelectedDays] = useState(7);
  const [chartLoading, setChartLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [tradeKey, setTradeKey] = useState(0);

  // Load initial prices and watchlist (runs once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {  // eslint-disable-line react-hooks/exhaustive-deps
    fetchPrices().then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setPrices(data);
      if (data.length > 0 && !selectedCoin) {
        setSelectedCoin(data[0]);
      }
    }).catch(() => {});

    fetchWatchlist().then((res) => {
      const wl = Array.isArray(res.data) ? res.data : [];
      setWatchlistIds(new Set(wl.map((i) => i.cryptoId)));
    }).catch(() => {});
  }, []);

  // Sync with WebSocket market data
  useEffect(() => {
    if (Array.isArray(marketData) && marketData.length > 0) {
      setPrices(marketData);
      // Update selected coin price
      if (selectedCoin) {
        const updated = marketData.find((c) => c.id === selectedCoin.id);
        if (updated) setSelectedCoin((prev) => ({ ...prev, ...updated }));
      }
    }
  }, [marketData, selectedCoin]);

  // Load chart data when coin or timeframe changes
  const loadHistory = useCallback(async (coinId, days) => {
    if (!coinId) return;
    setChartLoading(true);
    try {
      const res = await fetchHistory(coinId, days);
      setHistoryData(res.data);
    } catch {
      setHistoryData([]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // selectedCoin?.id is used intentionally as the dep key to avoid re-fetching on reference changes
  useEffect(() => {  // eslint-disable-line react-hooks/exhaustive-deps
    if (selectedCoin) loadHistory(selectedCoin.id, selectedDays);
  }, [selectedCoin?.id, selectedDays, loadHistory]);

  const handleCoinSelect = (coin) => {
    // Map search result to market data format if needed
    const marketCoin = prices.find((p) => p.id === coin.id);
    if (marketCoin) {
      setSelectedCoin(marketCoin);
    } else {
      setSelectedCoin({ ...coin, price: 0, change24h: 0, volume24h: 0 });
    }
  };

  const handleRowClick = (coin) => setSelectedCoin(coin);

  const handleAddWatchlist = async (e, coin) => {
    e.stopPropagation();
    if (watchlistIds.has(coin.id)) {
      toast('Already in watchlist', { icon: '⭐' });
      return;
    }
    try {
      await addToWatchlist({ cryptoId: coin.id, symbol: coin.symbol, name: coin.name });
      setWatchlistIds((prev) => new Set([...prev, coin.id]));
      toast.success(`${coin.name} added to watchlist`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <SearchBar onSelectCoin={handleCoinSelect} />
      </div>

      <div className="dashboard-grid">
        {/* LEFT: Market Table */}
        <div className="dashboard-left">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="card-header" style={{ marginBottom: 0 }}>Live Market Prices</div>
              <div className="live-indicator">
                <div className="live-dot" />
                {lastUpdated
                  ? `Updated ${Math.round((new Date() - lastUpdated) / 1000)}s ago`
                  : 'Auto-refreshing every 30s'}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="market-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Asset</th>
                    <th>Price</th>
                    <th>24h %</th>
                    <th>Volume</th>
                    <th>Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <div className="spinner" style={{ width: 32, height: 32 }} />
                          <span className="loading-text">Fetching live market data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    prices.map((coin) => (
                      <tr
                        key={coin.id}
                        onClick={() => handleRowClick(coin)}
                        className={selectedCoin?.id === coin.id ? 'selected' : ''}
                      >
                        <td className="coin-rank">{coin.rank}</td>
                        <td>
                          <div className="coin-info">
                            {coin.image && <img src={coin.image} alt={coin.name} />}
                            <div>
                              <div className="coin-name">{coin.name}</div>
                              <div className="coin-symbol">{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="price">{formatPrice(coin.price)}</td>
                        <td>
                          <span className={coin.change24h >= 0 ? 'change-positive' : 'change-negative'}>
                            {coin.change24h >= 0 ? '+' : ''}{coin.change24h?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="volume-text">{formatVolume(coin.volume24h)}</td>
                        <td>
                          <button
                            className={`watch-btn ${watchlistIds.has(coin.id) ? 'watching' : ''}`}
                            onClick={(e) => handleAddWatchlist(e, coin)}
                          >
                            {watchlistIds.has(coin.id) ? '★' : '+ Add'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Chart + Trade Panel */}
        <div className="dashboard-right">
          <PriceChart
            coin={selectedCoin}
            historyData={historyData}
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
            loading={chartLoading}
          />
          <TradePanel
            key={tradeKey}
            coin={selectedCoin}
            onTradeSuccess={() => setTradeKey((k) => k + 1)}
          />
        </div>
      </div>
    </div>
  );
}
