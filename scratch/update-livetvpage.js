const fs = require('fs');

let content = fs.readFileSync('src/components/LiveTvPage.tsx', 'utf8');

// 1. Update activeChannel sync useEffect
const oldSyncEffect = `  // Sync active channel when list changes (misalnya channel dihapus di Admin CMS)
  useEffect(() => {
    if (liveChannels.length > 0) {
      const stillExists = liveChannels.find(c => c.id === activeChannel?.id);
      if (!stillExists) {
        setActiveChannel(liveChannels[0]);
        setAltIndex(0);
      }
    }
  }, [channels, liveChannels, activeChannel?.id]);`;

const newSyncEffect = `  // Sync active channel when list changes or channel details are updated in Admin CMS
  useEffect(() => {
    if (liveChannels.length > 0) {
      const updated = liveChannels.find(c => c.id === activeChannel?.id);
      if (updated) {
        if (
          updated.videoUrl !== activeChannel?.videoUrl ||
          updated.description !== activeChannel?.description ||
          updated.title !== activeChannel?.title
        ) {
          setActiveChannel(updated);
        }
      } else {
        setActiveChannel(liveChannels[0]);
        setAltIndex(0);
      }
    }
  }, [channels, liveChannels, activeChannel?.id, activeChannel?.videoUrl, activeChannel?.description, activeChannel?.title]);`;

content = content.replace(oldSyncEffect, newSyncEffect);

// 2. Render description in activeChannel HUD
const oldTitleHud = `<h2 className="text-white text-xs sm:text-sm font-extrabold truncate max-w-[220px] sm:max-w-xs mt-1 drop-shadow-sm">
                  {activeChannel?.title || "Live TV"}
                </h2>`;

const newTitleHud = `<h2 className="text-white text-xs sm:text-sm font-extrabold truncate max-w-[220px] sm:max-w-xs mt-1 drop-shadow-sm">
                  {activeChannel?.title || t?.liveTv || "Live TV"}
                </h2>
                {activeChannel?.description && (
                  <p className="text-[10px] text-zinc-300/90 line-clamp-1 max-w-[220px] sm:max-w-xs mt-0.5 font-normal">
                    {activeChannel.description}
                  </p>
                )}`;

content = content.replace(oldTitleHud, newTitleHud);

// 3. Candidate categories & candidate regions
const oldCandidateCategories = `  const candidateCategories = useMemo(() => [
    { id: "All", label: t?.all || "Semua" },
    { id: "Local ID", label: "Nasional ID" },
    { id: "News", label: "Berita" },
    { id: "Entertainment", label: "Hiburan" },
    { id: "Sports", label: "Olahraga" },
    { id: "Documentary", label: "Dokumenter" },
    { id: "International", label: "Mancanegara" }
  ], [t]);`;

const newCandidateCategories = `  const candidateCategories = useMemo(() => [
    { id: "All", label: t?.all || "All" },
    { id: "Local ID", label: t?.catNational || "National ID" },
    { id: "News", label: t?.catNews || "News" },
    { id: "Entertainment", label: t?.catEntertainment || "Entertainment" },
    { id: "Sports", label: t?.catSports || "Sports" },
    { id: "Documentary", label: t?.catDocumentary || "Documentary" },
    { id: "International", label: t?.internationalRegion || "International" }
  ], [t]);`;

content = content.replace(oldCandidateCategories, newCandidateCategories);

const oldCandidateRegions = `  const candidateRegions = useMemo(() => [
    { id: "All", label: "Semua Wilayah" },
    { id: "Indonesia", label: "🇮🇩 Indonesia" },
    { id: "China", label: "🇨🇳 China" },
    { id: "Asia", label: "🌏 Asia" },
    { id: "Europe", label: "🇪🇺 Eropa" },
    { id: "Americas", label: "🌎 Amerika" },
    { id: "Middle East", label: "🕌 Timur Tengah" }
  ], []);`;

const newCandidateRegions = `  const candidateRegions = useMemo(() => [
    { id: "All", label: t?.allRegions || "All Regions" },
    { id: "Indonesia", label: "🇮🇩 Indonesia" },
    { id: "China", label: "🇨🇳 China" },
    { id: "Asia", label: \`🌏 \${t?.regAsia || "Asia"}\` },
    { id: "Europe", label: \`🇪🇺 \${t?.regEurope || "Europe"}\` },
    { id: "Americas", label: \`🌎 \${t?.regAmericas || "Americas"}\` },
    { id: "Middle East", label: \`🕌 \${t?.regMiddleEast || "Middle East"}\` }
  ], [t]);`;

content = content.replace(oldCandidateRegions, newCandidateRegions);

// 4. Labels & titles
content = content.replace('placeholder={t?.searchTvPlaceholder || "Cari nama saluran, genre, negara..."}', 'placeholder={t?.searchTvPlaceholder || "Search channel name, genre, country..."}');
content = content.replace('title="Hapus pencarian"', 'title={t?.clearSearch || "Clear search"}');
content = content.replace('title="Reset filter saluran"', 'title={t?.resetChannelFilter || "Reset channel filters"}');
content = content.replace('<p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kategori Saluran:</p>', '<p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.channelCategories || "Channel Categories:"}</p>');
content = content.replace('<span>Negara / Wilayah:</span>', '<span>{t?.countryRegion || "Country / Region:"}</span>');
content = content.replace('{t?.noMatchingTv || "Tidak ada saluran yang cocok dengan filter atau kata kunci saat ini."}', '{t?.noMatchingTv || "No channels match your current filter or query."}');
content = content.replace('<span>Reset Semua Filter</span>', '<span>{t?.resetAllFilters || "Reset All Filters"}</span>');

// Tooltips on player controls
content = content.replace('title="Saluran Sebelumnya (Tombol Kiri)"', 'title={t?.prevChannelTooltip || "Previous Channel"}');
content = content.replace('title="Saluran Berikutnya (Tombol Kanan)"', 'title={t?.nextChannelTooltip || "Next Channel"}');
content = content.replace('title="Putar / Jeda (Spasi)"', 'title={t?.playPauseTooltip || "Play / Pause"}');
content = content.replace('title="Bisukan Suara"', 'title={t?.muteUnmuteTooltip || "Mute / Unmute"}');
content = content.replace('title="Layar Penuh (F)"', 'title={t?.fullscreenTooltip || "Fullscreen Mode"}');

fs.writeFileSync('src/components/LiveTvPage.tsx', content, 'utf8');
console.log('Successfully updated src/components/LiveTvPage.tsx!');
