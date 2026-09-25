import React from 'react';

export default function NotificationCenter({ notifications, onMarkAllRead, onToggleRead }) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0">
          <i className="bi bi-bell-fill text-primary me-2"></i>Notifications
          {unreadCount > 0 && <span className="badge bg-danger ms-2">{unreadCount} New</span>}
        </h5>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted">No notifications right now.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${!n.isRead ? 'bg-light' : ''}`}
                onClick={() => onToggleRead(n.id)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <div className="fw-bold text-dark">{n.title}</div>
                  <div className="small text-muted">{n.message}</div>
                  <span className="small text-secondary">{n.time}</span>
                </div>
                {!n.isRead && <span className="badge bg-primary rounded-pill">Unread</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}