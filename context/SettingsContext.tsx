/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Api } from '../services/api';
import { Settings } from '../types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType>(null!);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({ 
      businessId: '', 
      currency: 'USD', 
      currencySymbol: '$' 
  });

  useEffect(() => {
    if (user) {
        Api.getSettings(user.businessId).then(setSettings);
    }
  }, [user]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
      if (!user) return;
      const updated = { ...settings, ...newSettings };
      await Api.saveSettings(updated);
      setSettings(updated);
  };

  const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currency,
        }).format(amount);
      } catch (e) {
        return `${settings.currency} ${amount.toFixed(2)}`;
      }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
