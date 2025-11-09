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
  const { accessToken } = useAuth(); // Destructure accessToken
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null); // Corrected indentation
  
  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3'); // Assuming a sound file will be placed in /public/sounds
    audio.play().catch(e => console.error("Error playing sound:", e));
  };
  
  useEffect(() => {
    if (accessToken) { // Use accessToken
      // Correct WebSocket URL for notifications
      const wsUrl = `${process.env.NEXT_PUBLIC_API_WS_URL}/ws/notifications/`;
      // Append access token as a query parameter for WebSocket authentication
      const newSocket = new WebSocket(`${wsUrl}?token=${accessToken}`);
            newSocket.onopen = () => {
              console.log('WebSocket connected to notifications');
              // Authentication for Channels is typically handled via session cookies.
              // If using JWT, it might need to be sent as a query param or in a custom header.
              // For now, assuming session/cookie based auth is sufficient for the web admin.
            };
  
            newSocket.onmessage = (event) => {
              const eventData = JSON.parse(event.data);
              
              // Check if the message is a notification from our backend
              if (eventData.type === 'notification') { // Matches 'type': 'send_notification' in backend consumer
                  const newNotification: Notification = {
                      id: eventData.id, // Use ID from backend
                      notification_type: eventData.notification_type, // Use type from backend
                      message: eventData.message,
                      created_at: new Date(eventData.created_at), // Use created_at from backend
                      is_read: eventData.is_read, // Use is_read from backend
                      data: eventData, // Keep full event data for debugging/future use
                  };
  
                  setNotifications(prev => [newNotification, ...prev]);
                  playNotificationSound();
              }
            };
        newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        // Optional: implement reconnection logic
      };

      newSocket.onerror = (event: Event) => {
        // WebSocket onerror event typically provides a generic Event object.
        // If it's an ErrorEvent, it might have more details.
        if (event instanceof ErrorEvent) {
          console.error('WebSocket error:', event.message, event);
        } 
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [accessToken]); // Changed from token to accessToken

  const markAsRead = useCallback((id: number) => { // ID is now a number
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n)) // Use is_read
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length; // Use is_read

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
