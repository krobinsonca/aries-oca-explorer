'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setBundleListUrl } from '@/app/lib/data';

export const BUNDLE_LIST_URL_PROD = "https://bcgov.github.io/aries-oca-bundles";
export const BUNDLE_LIST_URL_TEST = "https://bcgov.github.io/aries-oca-bundles-test";

export type BundleEnv = 'production' | 'test' | 'custom';

interface BundleUrlContextType {
  env: BundleEnv;
  bundleUrl: string;
  customUrl: string;
  isProduction: boolean;
  error: string | null;
  setEnv: (env: BundleEnv) => void;
  setCustomUrl: (url: string) => void;
  clearError: () => void;
}

const BundleUrlContext = createContext<BundleUrlContextType | undefined>(undefined);

const STORAGE_KEY = 'oca-explorer-bundle-env';
const CUSTOM_URL_KEY = 'oca-explorer-custom-url';

export function BundleUrlProvider({ children }: { children: ReactNode }) {
  const [env, setEnvState] = useState<BundleEnv>('production');
  const [customUrl, setCustomUrlState] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from sessionStorage on mount and sync with data.ts
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'test' || stored === 'custom') {
        setEnvState(stored);
      }
      const storedCustom = sessionStorage.getItem(CUSTOM_URL_KEY);
      if (storedCustom) {
        setCustomUrlState(storedCustom);
      }
    } catch (e) {
      // sessionStorage not available
    }
    setIsHydrated(true);
  }, []);

  const setEnv = useCallback((newEnv: BundleEnv) => {
    setEnvState(newEnv);
    setError(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, newEnv);
    } catch (e) {
      // sessionStorage not available
    }
  }, []);

  const setCustomUrl = useCallback((url: string) => {
    setCustomUrlState(url);
    setError(null);
    try {
      sessionStorage.setItem(CUSTOM_URL_KEY, url);
    } catch (e) {
      // sessionStorage not available
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const bundleUrl = env === 'production' 
    ? BUNDLE_LIST_URL_PROD 
    : env === 'test' 
      ? BUNDLE_LIST_URL_TEST 
      : customUrl || BUNDLE_LIST_URL_PROD;

  const isProduction = env === 'production';

  // Sync bundle URL to data.ts when it changes (client-side only)
  useEffect(() => {
    if (isHydrated) {
      setBundleListUrl(bundleUrl);
    }
  }, [bundleUrl, isHydrated]);

  return (
    <BundleUrlContext.Provider value={{ env, bundleUrl, customUrl, isProduction, error, setEnv, setCustomUrl, clearError }}>
      {children}
    </BundleUrlContext.Provider>
  );
}

export function useBundleUrl() {
  const context = useContext(BundleUrlContext);
  if (!context) {
    // Fallback for when context is not available (e.g., during SSR)
    return {
      env: 'production' as BundleEnv,
      bundleUrl: BUNDLE_LIST_URL_PROD,
      customUrl: '',
      isProduction: true,
      error: null,
      setEnv: () => {},
      setCustomUrl: () => {},
      clearError: () => {},
    };
  }
  return context;
}
