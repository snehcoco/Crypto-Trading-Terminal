import React, { useState } from 'react';
import { executeTrade } from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const formatPrice = (v) => {
  if (!v) return '$0.00';
  if (v >= 1) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(6)}`;
};

export default function TradePanel({ coin, onTradeSuccess }) {
  const { user, updateBalance } = useAuth();
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const estimatedCost = quantity && coin ? (parseFloat(quantity) * coin.price) : 0;

  const handleTrade = async (type) => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    if (!coin) { toast.error('Please select a coin first'); return; }

    setLoading(true);
    try {
      const res = await executeTrade({
        cryptoId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        type,
        quantity: qty,
      });

      updateBalance(res.data.newBalance);
      toast.success(`✅ ${type} order for ${qty} ${coin.symbol} executed!`);
      setQuantity('');
      if (onTradeSuccess) onTradeSuccess(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trade-panel">
      <div className="trade-panel-header">
        <div className="trade-panel-title">
          Simulated Trade Panel
        </div>
        <div className="trade-panel-subtitle">
          Asset: {coin ? `${coin.name} (${coin.symbol})` : 'No coin selected'}
        </div>
        {coin && (
          <div className="trade-current-price">
            Current: {formatPrice(coin.price)}
          </div>
        )}
      </div>

      <div className="trade-form">
        <div className="trade-input-group">
          <label className="trade-label">Quantity {coin ? `(${coin.symbol})` : ''}</label>
          <input
            className="trade-input"
            type="number"
            min="0"
            step="any"
            placeholder={coin ? `Enter ${coin.symbol} amount...` : 'Select a coin first'}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!coin}
          />
        </div>

        <div className="trade-input-group">
          <label className="trade-label">Estimated Cost (USD)</label>
          <input
            className="trade-input"
            type="text"
            value={estimatedCost ? `$${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
            readOnly
          />
        </div>

        <div className="trade-buttons">
          <button className="btn-buy" onClick={() => handleTrade('BUY')} disabled={!coin || loading}>
            {loading ? '...' : `Buy ${coin?.symbol || ''}`}
          </button>
          <button className="btn-sell" onClick={() => handleTrade('SELL')} disabled={!coin || loading}>
            {loading ? '...' : `Sell ${coin?.symbol || ''}`}
          </button>
        </div>

        {user && (
          <div style={{ fontSize: 12, color: '#6e7681', textAlign: 'center', marginTop: 4 }}>
            Available: <span style={{ color: '#3fb950', fontWeight: 600 }}>
              ${user.virtualBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
