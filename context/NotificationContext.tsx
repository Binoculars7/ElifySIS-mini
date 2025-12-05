/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Api } from '../services/api';
import { useAuth } from './AuthContext';
import { Notification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: Notification[]; // Persistent list for the header
  toasts: Notification[]; // Transient list for popup toasts
  notify: (message: string, type?: NotificationType, title?: string) => void;
  removeNotification: (id: string) => void; // Removes toast
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>(null!);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
      if(user) {
          Api.getNotifications(user.businessId).then(list => {
              setNotifications(list.sort((a,b) => b.timestamp - a.timestamp));
          });
      } else {
          setNotifications([]);
      }
  }, [user]);

  const notify = useCallback(async (message: string, type: NotificationType = 'info', title: string = 'System Notification') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: Notification = {
        id,
        businessId: user?.businessId || '',
        title,
        message,
        type,
        read: false,
        timestamp: Date.now()
    };

    // Add to toasts (transient)
    setToasts(prev => [...prev, newNotif]);
    setTimeout(() => {
        setToasts(prev => prev.filter(n => n.id !== id));
    }, 5000);

    // Save to persistent storage if logged in
    if (user) {
        setNotifications(prev => [newNotif, ...prev]);
        await Api.saveNotification(newNotif);
    }
  }, [user]);

  const removeNotification = (id: string) => {
      setToasts(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      if(user) await Api.markNotificationRead(id);
  };

  const markAllRead = async () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // In a real app, batch API call
      notifications.forEach(n => {
          if(!n.read && user) Api.markNotificationRead(n.id);
      });
  };

  return (
    <NotificationContext.Provider value={{ notifications, toasts, notify, removeNotification, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
