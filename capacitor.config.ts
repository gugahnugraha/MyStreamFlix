import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mystreamflix.app',
  appName: 'MyStreamFlix',
  webDir: 'public',
  server: {
    url: 'https://mystreamflix.biz.id',
    cleartext: true,
    allowNavigation: [
      'mystreamflix.biz.id',
      '*.mystreamflix.biz.id',
      '*.akamaized.net',
      '*.cnnindonesia.com',
      '*.cnbcindonesia.com',
      '*.detik.com',
      '*.medcom.id',
      '*.tvri.go.id',
      '*.googleapis.com',
      '*.wurl.tv',
      '*.unsplash.com',
      '*.wikimedia.org',
      '*.imgur.com'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#09090b',
    buildOptions: {
      signingType: 'apk'
    }
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
