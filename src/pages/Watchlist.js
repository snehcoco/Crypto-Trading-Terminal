import React, { useEffect, useState } from 'react';
import { fetchWatchlist, removeFromWatchlist, fetchPrices } from '../api/api';
import toast from 'react-hot-toast';

const formatPrice = (v) => {
  if (!v) return '$0.00';
  if (v >= 1) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(6)}`;
};

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchWatchlist(), fetchPrices()])
      .then(([wlRes, priceRes]) => {
        setItems(wlRes.data);
        const priceMap = {};
        if (Array.isArray(priceRes.data)) {
          priceRes.data.forEach((c) => { priceMap[c.id] = c; });
        }
        setPrices(priceMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (cryptoId, name) => {
    try {
      const res = await removeFromWatchlist(cryptoId);
      setItems(res.data);
      toast.success(`${name} removed from watchlist`);
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="page-title">Watchlist</h1>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⭐</div>
            <div className="empty-state-text">Your watchlist is empty</div>
            <div className="empty-state-sub">Click "+ Add" on any coin in the Dashboard to add it here</div>
          </div>
        </div>
      ) : (
        <div className="watchlist-grid">
          {items.map((item) => {
            const coinData = prices[item.cryptoId];
            const change = coinData?.change24h;
            return (
              <div key={item.cryptoId} className="watchlist-card">
                <div className="watchlist-card-header">
                  <div className="watchlist-coin-info">
                    {coinData?.image && <img src={coinData.image} alt={item.name} />}
                    <div>
                      <div className="watchlist-coin-name">{item.name}</div>
                      <div className="watchlist-coin-symbol">{item.symbol}</div>
                    </div>
                  </div>
                  <button
                    className="remove-watch-btn"
                    onClick={() => handleRemove(item.cryptoId, item.name)}
                    title="Remove from watchlist"
                  >
                    ×
                  </button>
                </div>

                <div className="watchlist-price">
                  {coinData ? formatPrice(coinData.price) : '—'}
                </div>

                {change !== undefined && (
                  <div style={{ marginTop: 8 }}>
                    <span className={change >= 0 ? 'change-positive' : 'change-negative'}>
                      {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% (24h)
                    </span>
                  </div>
                )}

                {coinData?.volume24h && (
                  <div style={{ fontSize: 12, color: '#6e7681', marginTop: 6 }}>
                    Vol: ${(coinData.volume24h / 1e9).toFixed(2)}B
                  </div>
                )}

                <div style={{ fontSize: 11, color: '#6e7681', marginTop: 8 }}>
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
