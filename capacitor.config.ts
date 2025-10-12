import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eebd950946e542d89b5f15154caa7b65',
  appName: 'vyberology',
  webDir: 'dist',
  // Comment out server config to use local built files
  // Uncomment below to use local dev server with hot reload:
  // server: {
  //   url: 'http://192.168.0.24:8080',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
