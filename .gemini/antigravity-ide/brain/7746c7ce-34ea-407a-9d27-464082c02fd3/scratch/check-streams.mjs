import fs from 'fs';

async function check() {
  try {
    const r1 = await fetch('https://www.trans7.co.id/live-streaming', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html1 = await r1.text();
    const m1 = html1.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g);
    console.log('Trans7 matches:', m1);
    if (!m1) {
      // Look for iframes or script sources
      const iframes = html1.match(/<iframe[^>]+src="([^"]+)"/g);
      console.log('Trans7 iframes:', iframes);
    }
  } catch (e) {
    console.log('Trans7 err:', e);
  }

  try {
    const r2 = await fetch('https://www.transtv.co.id/live', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html2 = await r2.text();
    const m2 = html2.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g);
    console.log('TransTV matches:', m2);
    if (!m2) {
      const iframes2 = html2.match(/<iframe[^>]+src="([^"]+)"/g);
      console.log('TransTV iframes:', iframes2);
    }
  } catch (e) {
    console.log('TransTV err:', e);
  }
}

check();
