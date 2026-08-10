import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mystreamflix.app',
  appName: 'MyStreamFlix',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
