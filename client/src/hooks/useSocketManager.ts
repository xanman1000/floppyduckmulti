import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../state/appStore';

export function useSocketManager() {
  const token = useAppStore((state) => state.token);
  const setSocket = useAppStore((state) => state.setSocket);
  const setConnectionState = useAppStore((state) => state.setConnectionState);
  const socket = useAppStore((state) => state.socket);

  useEffect(() => {
    if (!token && socket) {
      socket.disconnect();
      setSocket(null);
      setConnectionState('disconnected');
    }
  }, [token, socket, setSocket, setConnectionState]);

  useEffect(() => {
    if (!token) return;

    const url = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';
    setConnectionState('connecting');

    const instance = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token }
    });

    const handleConnect = () => setConnectionState('connected');
    const handleDisconnect = () => setConnectionState('disconnected');
    const handleError = () => setConnectionState('error');

    instance.on('connect', handleConnect);
    instance.on('disconnect', handleDisconnect);
    instance.on('connect_error', handleError);

    setSocket(instance);

    return () => {
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
      instance.off('connect_error', handleError);
      instance.disconnect();
      setSocket(null);
      setConnectionState('disconnected');
    };
  }, [token, setSocket, setConnectionState]);
}
