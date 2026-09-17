import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [lastWeatherCheck, setLastWeatherCheck] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [livePings, setLivePings] = useState([]);
  const [liveGrievances, setLiveGrievances] = useState([]);

  useEffect(() => {
    // Connect to same host
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[SocketContext] Connected to real-time event stream');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('[SocketContext] Disconnected from stream');
    });

    s.on('ml:prediction-update', (data) => {
      console.log('[SocketContext] 5-minute ML Prediction received:', data);
      setLastPrediction(data);
    });

    s.on('weather:15min-check', (data) => {
      console.log('[SocketContext] 15-minute Rainfall Check received:', data);
      setLastWeatherCheck(data);
    });

    s.on('alert:broadcast', (newAlert) => {
      setLiveAlerts(prev => [newAlert, ...prev]);
    });

    s.on('authority:pinged', (auth) => {
      setLivePings(prev => [auth, ...prev.filter(a => a.id !== auth.id)]);
    });

    s.on('authority:acknowledged', (auth) => {
      setLivePings(prev => [auth, ...prev.filter(a => a.id !== auth.id)]);
    });

    s.on('grievance:new', (newGrv) => {
      setLiveGrievances(prev => [newGrv, ...prev]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      lastPrediction,
      lastWeatherCheck,
      liveAlerts,
      livePings,
      liveGrievances
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
