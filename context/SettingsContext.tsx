/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Api } from '../services/api';
import { Settings } from '../types';

interface SettingsContextType {
  settings: Settings;
  dbReady: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  formatCurrency: (amount: number) => string;
  checkDbStatus: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>(null!);

// Mapping currencies to their specific locales to force correct symbol rendering
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  'NGN': 'en-NG',
  'USD': 'en-US',
  'EUR': 'fr-FR',
  'GBP': 'en-GB',
  'KES': 'en-KE',
  'GHS': 'en-GH',
  'INR': 'en-IN',
  'ZAR': 'en-ZA',
  'CAD': 'en-CA',
  'AUD': 'en-AU',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [dbReady, setDbReady] = useState(true);
  const [settings, setSettings] = useState<Settings>({ 
      businessId: '', 
      currency: 'USD', 
      currencySymbol: '$' 
  });

  const checkDbStatus = async () => {
    if (!user) return;
    try {
        const data = await Api.getSettings(user.businessId);
        setSettings(data);
        setDbReady(true);
    } catch (e: any) {
        if (e.message && (e.message.includes("initialized") || e.message.includes("table"))) {
            setDbReady(false);
        } else {
            setDbReady(true);
        }
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, [user]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
      if (!user) return;
      const updated = { ...settings, ...newSettings };
      await Api.saveSettings(updated);
      setSettings(updated);
  };

  const formatCurrency = (amount: number) => {
      try {
        const locale = CURRENCY_LOCALE_MAP[settings.currency] || 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: settings.currency,
            currencyDisplay: 'symbol' // Ensures ₦ instead of NGN
        }).format(amount);
      } catch (e) {
        // Fallback if Intl fails
        const symbol = settings.currencySymbol || settings.currency;
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
  };

  return (
    <SettingsContext.Provider value={{ settings, dbReady, updateSettings, formatCurrency, checkDbStatus }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);