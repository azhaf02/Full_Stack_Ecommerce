import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function NotificationCenter({ onClearBadge }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/notifications/user/1');
      setNotifications(res.data);
    } catch (err) {
      console.error("Could not fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAll = async () => {
    try {
      await axios.put('http://localhost:8000/api/notifications/user/1/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onClearBadge) onClearBadge();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      padding: '24px',
      border: '1px solid #e8e5de',
      boxShadow: '0 6px 20px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2f3e30' }}>Notifications</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6e776e' }}>Order alerts, deals, and delivery updates</p>
        </div>
        <button
          onClick={handleMarkAll}
          style={{
            padding: '8px 14px',
            backgroundColor: '#f7f5f0',
            color: '#3b4d3c',
            border: '1px solid #e0dcd3',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6e776e' }}>Loading alerts...</div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#8a948a' }}>No notifications found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: item.is_read ? '1px solid #f0ede6' : '1px solid #d4c8b8',
                backgroundColor: item.is_read ? '#faf9f6' : '#fffdf9',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: item.is_read ? '#e8e5de' : '#d4a373',
                color: item.is_read ? '#6e776e' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0
              }}>
                {item.title.toLowerCase().includes('shipped') ? '🚚' : '🏷️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e241e' }}>{item.title}</h4>
                  {!item.is_read && (
                    <span style={{ fontSize: '11px', color: '#b7791f', fontWeight: '700' }}>• New</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#455045', lineHeight: '1.4' }}>{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}