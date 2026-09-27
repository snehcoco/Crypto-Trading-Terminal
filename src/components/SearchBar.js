import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCoins } from '../api/api';

export default function SearchBar({ onSelectCoin }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await searchCoins(q);
      setResults(res.data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 500);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (coin) => {
    onSelectCoin(coin);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="search-container" ref={containerRef}>
      <span className="search-icon">🔍</span>
      <input
        className="search-input"
        placeholder="Search coin or ticker symbol..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((coin) => (
            <div key={coin.id} className="search-result-item" onClick={() => handleSelect(coin)}>
              {coin.image && <img src={coin.image} alt={coin.name} />}
              <div>
                <div className="search-result-name">{coin.name}</div>
                <div className="search-result-symbol">{coin.symbol}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#8b949e' }}>
          Searching...
        </div>
      )}
    </div>
  );
}
