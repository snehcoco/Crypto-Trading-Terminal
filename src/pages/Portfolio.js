import React, { useEffect, useState } from 'react';
import { fetchPortfolio } from '../api/api';

const fmt = (v, digits = 2) =>
  v?.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) || '0.00';

export default function Portfolio() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchPortfolio()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const { holdings = [], totalHoldingsValue = 0, virtualBalance = 0, totalPortfolioValue = 0 } = data || {};
  const totalPL = holdings.reduce((s, h) => s + h.unrealizedPL, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Portfolio</h1>
        <button
          onClick={load}
          style={{ background: '#1c2128', border: '1px solid #30363d', color: '#8b949e', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="portfolio-stats">
        <div className="stat-card">
          <div className="stat-label">Total Portfolio Value</div>
          <div className="stat-value positive">${fmt(totalPortfolioValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Holdings Value</div>
          <div className="stat-value">${fmt(totalHoldingsValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Balance</div>
          <div className="stat-value positive">${fmt(virtualBalance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unrealized P&L</div>
          <div className={`stat-value ${totalPL >= 0 ? 'positive' : 'negative'}`}>
            {totalPL >= 0 ? '+' : ''}{fmt(totalPL)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Your Holdings</div>
        {holdings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No holdings yet</div>
            <div className="empty-state-sub">Go to Dashboard to make your first trade</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Quantity</th>
                  <th>Avg Buy Price</th>
                  <th>Current Price</th>
                  <th>Value</th>
                  <th>Unrealized P&L</th>
                  <th>P&L %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.cryptoId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700 }}>{h.symbol}</div>
                        <div style={{ fontSize: 12, color: '#8b949e' }}>{h.name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{h.quantity.toFixed(6)}</td>
                    <td>${fmt(h.avgPurchasePrice)}</td>
                    <td>${fmt(h.currentPrice)}</td>
                    <td style={{ fontWeight: 600 }}>${fmt(h.currentValue)}</td>
                    <td className={h.unrealizedPL >= 0 ? 'change-positive' : 'change-negative'}>
                      {h.unrealizedPL >= 0 ? '+' : ''}${fmt(h.unrealizedPL)}
                    </td>
                    <td className={h.plPercent >= 0 ? 'change-positive' : 'change-negative'}>
                      {h.plPercent >= 0 ? '+' : ''}{fmt(h.plPercent)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
