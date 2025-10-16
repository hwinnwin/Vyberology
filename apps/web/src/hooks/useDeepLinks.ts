import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Deep Link Handler Hook
 * Handles vyberology:// URL scheme for widget actions
 *
 * Supported deep links:
 * - vyberology://capture - Open Get Vybe page
 * - vyberology://pattern/[number] - Open Get Vybe with specific pattern
 * - vyberology://history - Open reading history
 * - vyberology://numerology - Open numerology reader
 */
export const useDeepLinks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only register deep link handler on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = (event: { url: string }) => {
      if (import.meta.env.DEV) {
        console.log('Deep link received:', event.url);
      }

      // Parse the deep link URL
      const url = new URL(event.url);
      const path = url.pathname; // e.g., "/capture" or "/pattern/11:11"

      // Route based on deep link path
      if (path.startsWith('/capture')) {
        // Open Get Vybe page for vybe capture
        navigate('/get-vybe');
      } else if (path.startsWith('/pattern/')) {
        // Extract pattern from path
        const pattern = path.replace('/pattern/', '');
        // Navigate to Get Vybe with pattern in state
        navigate('/get-vybe', { state: { pattern } });
      } else if (path.startsWith('/history')) {
        // Open reading history
        navigate('/history');
      } else if (path.startsWith('/numerology')) {
        // Open numerology reader
        navigate('/numerology');
      } else {
        // Default to home page
        navigate('/');
      }
    };

    // Register deep link listener
    CapacitorApp.addListener('appUrlOpen', handleDeepLink);

    // Check if app was opened with a deep link
    CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleDeepLink({ url: result.url });
      }
    });

    // Cleanup listener on unmount
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);
};
