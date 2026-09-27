import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TIMEFRAMES = [
  { label: '1H', days: 0.04 },
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
];

const formatDate = (timestamp) => {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPrice = (v) =>
  v >= 1000 ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `$${v.toFixed(4)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>
          {label ? new Date(label * 1000).toLocaleString() : ''}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#58a6ff' }}>
          {formatPrice(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

export default function PriceChart({ coin, historyData, selectedDays, onDaysChange, loading }) {
  const isPositive = coin?.change24h >= 0;
  const color = isPositive ? '#3fb950' : '#f85149';

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div>
          <div className="chart-coin-info">
            {coin?.image && <img src={coin.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
            <div>
              <div className="chart-coin-name">{coin?.name || 'Select a coin'} / USD</div>
              {coin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <div className="chart-coin-price">{formatPrice(coin.price)}</div>
                  <div className={`chart-coin-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(coin.change24h || 0).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="timeframe-buttons">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              className={`timeframe-btn ${selectedDays === tf.days ? 'active' : ''}`}
              onClick={() => onDaysChange(tf.days)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="chart-placeholder">Loading chart data...</div>
      ) : historyData.length === 0 ? (
        <div className="chart-placeholder">
          {coin ? 'Chart data unavailable' : 'Click on a coin to view its chart'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={historyData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              tick={{ fill: '#6e7681', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatPrice}
              tick={{ fill: '#6e7681', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
