import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
    getLaunchUrl: vi.fn(() => Promise.resolve({ url: null })),
  },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: {
    checkPermissions: vi.fn(() => Promise.resolve({
      camera: 'prompt',
      photos: 'prompt',
    })),
    requestPermissions: vi.fn(() => Promise.resolve({
      camera: 'granted',
      photos: 'granted',
    })),
    getPhoto: vi.fn(() => Promise.resolve({
      dataUrl: 'data:image/jpeg;base64,test',
      format: 'jpeg',
    })),
  },
}));

// Mock Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
  start: vi.fn(),
  stop: vi.fn(),
};

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: vi.fn(() => mockSpeechRecognition),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: vi.fn(() => mockSpeechRecognition),
});

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }],
    })),
  },
});
