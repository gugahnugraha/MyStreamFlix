import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mystreamflix.app',
  appName: 'MyStreamFlix',
  webDir: 'public',
  server: {
    url: 'https://mystreamflix.biz.id',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#09090b'
  }
};

export default config;
