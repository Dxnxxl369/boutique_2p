'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: number; // From backend Notification model PK
  notification_type: 'new_order' | 'order_status_update' | 'generic'; // Matches backend field
  message: string;
  created_at: Date; // Matches backend field
  is_read: boolean; // Matches backend field
  data?: any; // Optional: for any extra data
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void; // ID is now a number
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const wsUrl = apiUrl.replace(/^http/, 'ws').replace('/api', '');
      const finalWsUrl = `${wsUrl}/ws/notifications/?token=${accessToken}`;

      const newSocket = new WebSocket(finalWsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected to notifications');
      };

      newSocket.onmessage = (event) => {
        const eventData = JSON.parse(event.data);
        
        if (eventData.type === 'notification') {
          const newNotification: Notification = {
            id: eventData.id,
            notification_type: eventData.notification_type,
            message: eventData.message,
            created_at: new Date(eventData.created_at),
            is_read: eventData.is_read,
            data: eventData,
          };

          setNotifications(prev => [newNotification, ...prev]);
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected, reason:', event.reason);
      };

      newSocket.onerror = (err) => {
        console.error('WebSocket error: ', err);
      };

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, accessToken]);

  const markAsRead = useCallback((id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
