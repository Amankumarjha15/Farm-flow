import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { receiveRealtimeNotification } from '../features/notifications/notificationsSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function useSocket() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join', user._id);

    socket.on('notification', (notification) => {
      dispatch(receiveRealtimeNotification(notification));
      toast(notification.title, { icon: '🔔' });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, dispatch]);

  return socketRef.current;
}
