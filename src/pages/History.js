import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '../api/api';

const fmt = (v, d = 2) =>
  v?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) || '0.00';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions()
      .then((res) => setTransactions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const totalBought = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + t.total, 0);
  const totalSold = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + t.total, 0);

  return (
    <div>
      <h1 className="page-title">Transaction History</h1>

      <div className="portfolio-stats" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{transactions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bought</div>
          <div className="stat-value negative">${fmt(totalBought)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sold</div>
          <div className="stat-value positive">${fmt(totalSold)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Flow</div>
          <div className={`stat-value ${totalSold - totalBought >= 0 ? 'positive' : 'negative'}`}>
            {totalSold - totalBought >= 0 ? '+' : ''}${fmt(totalSold - totalBought)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">All Transactions</div>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No transactions yet</div>
            <div className="empty-state-sub">Your trade history will appear here</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Asset</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <span className={t.type === 'BUY' ? 'badge-buy' : 'badge-sell'}>
                        {t.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{t.symbol}</div>
                      <div style={{ fontSize: 12, color: '#8b949e' }}>{t.name}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{t.quantity.toFixed(6)}</td>
                    <td>${fmt(t.price)}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span className={t.type === 'BUY' ? 'change-negative' : 'change-positive'}>
                        {t.type === 'BUY' ? '-' : '+'}${fmt(t.total)}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#8b949e' }}>
                      {new Date(t.createdAt).toLocaleString()}
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
