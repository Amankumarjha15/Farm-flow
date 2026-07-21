import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationRead, markAllRead } from '../features/notifications/notificationsSlice';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-furrow-100"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-clay text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-furrow-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-furrow-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={() => dispatch(markAllRead())} className="text-xs text-furrow-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-soil/40">You're all caught up.</p>
            ) : (
              items.slice(0, 15).map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.isRead && dispatch(markNotificationRead(n._id))}
                  className={`block w-full border-b border-furrow-50 px-4 py-3 text-left text-sm hover:bg-furrow-50 ${
                    !n.isRead ? 'bg-wheat-100/40' : ''
                  }`}
                >
                  <p className="font-medium text-soil">{n.title}</p>
                  <p className="mt-0.5 text-xs text-soil/50">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
