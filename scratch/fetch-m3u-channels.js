async function fetchM3U(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split('\n');
    const channels = [];
    let currentName = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/tvg-name="([^"]+)"/) || line.match(/,(.*)$/);
        currentName = nameMatch ? (nameMatch[1] || nameMatch[0]).replace(/^,/, '').trim() : 'Unknown';
      } else if (line.startsWith('http')) {
        channels.push({ name: currentName, url: line });
      }
    }
    return channels;
  } catch (e) {
    return [];
  }
}

async function run() {
  const lists = [
    "https://iptv-org.github.io/iptv/countries/id.m3u",
    "https://raw.githubusercontent.com/dhasap/dhanytv/main/dhanytv.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/id.m3u"
  ];

  for (const listUrl of lists) {
    console.log(`\nFetching ${listUrl}...`);
    const channels = await fetchM3U(listUrl);
    console.log(`Found ${channels.length} channels`);
    const targets = ["kompas", "antv", "trans", "cna", "zee", "celestial", "berita satu", "btv"];
    for (const ch of channels) {
      const lower = ch.name.toLowerCase();
      if (targets.some(t => lower.includes(t))) {
        console.log(` - [${ch.name}]: ${ch.url}`);
      }
    }
  }
}

run();
