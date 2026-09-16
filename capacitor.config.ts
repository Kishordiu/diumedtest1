import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diumed.app',
  appName: 'DiuMed',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    // Use local server for development; remove for production
    cleartext: false,
  },
};

export default config;
