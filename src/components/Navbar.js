import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const balanceStr = user?.virtualBalance?.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) || '10,000.00';

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="navbar-brand-icon">₿</div>
        CryptoTerminal
      </div>

      {/* Nav links — pill style */}
      <div className="navbar-nav">
        {[
          { to: '/', label: 'Dashboard', end: true },
          { to: '/watchlist', label: 'Watchlist' },
          { to: '/portfolio', label: 'Portfolio' },
          { to: '/history', label: 'History' },
        ].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side */}
      <div className="navbar-right">
        <div className="balance-badge">
          <span>💰</span>
          <strong>${balanceStr}</strong>
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <div className="user-avatar" onClick={() => setMenuOpen((p) => !p)}>
            {initials}
          </div>
          {menuOpen && (
            <div className="user-menu">
              <div className="user-menu-info">{user?.name || 'User'}</div>
              <button className="logout" onClick={handleLogout}>
                <span>🚪</span> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
