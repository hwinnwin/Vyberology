import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eebd950946e542d89b5f15154caa7b65',
  appName: 'vyberology',
  webDir: 'dist',
  server: {
    url: 'https://eebd9509-46e5-42d8-9b5f-15154caa7b65.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
