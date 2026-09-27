import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const s = io('http://localhost:5000', { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => console.log('Socket connected:', s.id));

    s.on('market_update', (data) => {
      setMarketData(data);
      setLastUpdated(new Date());
    });

    return () => s.disconnect();
  }, []);

  // Join user's room when authenticated (for trade confirmations)
  useEffect(() => {
    if (socket && user) {
      socket.emit('join_room', user._id);
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, marketData, lastUpdated }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
