import React, { useEffect, useState } from 'react';

interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}

interface NotificationCenterProps {
  onClearBadge?: () => void;
}

export default function NotificationCenter({ onClearBadge }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/account/notifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data);
      if (onClearBadge && data.filter((n: NotificationItem) => !n.is_read).length === 0) {
        onClearBadge();
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/account/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
        );
        if (onClearBadge) {
          const remainingUnread = notifications.filter((n) => n.id !== id && !n.is_read).length;
          if (remainingUnread === 0) onClearBadge();
        }
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/account/notifications/read-all', {
        method: 'PUT',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        if (onClearBadge) onClearBadge();
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case 'order_status':
        return { bg: '#EBF1EB', text: '#2B4A2D', border: '#D0DDD0', label: 'Order Update' };
      case 'payment_success':
        return { bg: '#F4EFE6', text: '#69512B', border: '#E2D5C0', label: 'Payment' };
      case 'return_update':
        return { bg: '#F9ECEB', text: '#7E342B', border: '#EAC8C4', label: 'Returns' };
      default:
        return { bg: '#F1F1F1', text: '#3E3E3E', border: '#D8D8D8', label: 'Notification' };
    }
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e0d6', padding: '36px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingBottom: '20px',
        borderBottom: '1px solid #e5e0d6',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7b8777', fontWeight: 600 }}>
            Communications
          </div>
          <h2 style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '24px',
            fontWeight: 700,
            color: '#1b241c',
            margin: '4px 0 0'
          }}>
            Notification Center
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #e5e0d6', padding: '2px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                border: 'none',
                background: filter === 'all' ? '#1b241c' : 'transparent',
                color: filter === 'all' ? '#ffffff' : '#4a5448',
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                border: 'none',
                background: filter === 'unread' ? '#1b241c' : 'transparent',
                color: filter === 'unread' ? '#ffffff' : '#4a5448',
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'none',
                border: '1px solid #1b241c',
                color: '#1b241c',
                padding: '7px 14px',
                fontSize: '11px',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#7b8777', fontSize: '13px' }}>
          Fetching account notices...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#889384' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>?</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1b241c' }}>No notifications found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredItems.map((item) => {
            const tag = getTagColor(item.type);
            return (
              <div
                key={item.id}
                onClick={() => !item.is_read && markAsRead(item.id)}
                style={{
                  border: item.is_read ? '1px solid #ede9e1' : '1px solid #1b241c',
                  backgroundColor: item.is_read ? '#fcfbf9' : '#ffffff',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: item.is_read ? 'default' : 'pointer',
                  position: 'relative'
                }}
              >
                {!item.is_read && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#1b241c'
                  }} />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      backgroundColor: tag.bg,
                      color: tag.text,
                      border: `1px solid ${tag.border}`,
                      fontSize: '9px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      fontWeight: 700,
                    }}>
                      {tag.label}
                    </span>
                    {!item.is_read && (
                      <span style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: '#A65B4E',
                        fontWeight: 700
                      }}>
                        • Unread
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: item.is_read ? '#556052' : '#111812',
                    fontWeight: item.is_read ? 400 : 600,
                    lineHeight: 1.4
                  }}>
                    {item.message}
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1b241c',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline'
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
