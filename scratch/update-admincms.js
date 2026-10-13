const fs = require('fs');

let content = fs.readFileSync('src/components/AdminCMS.tsx', 'utf8');

// 1. Pass t to IPTVScanner
content = content.replace(
  '          <IPTVScanner\n            brandColor={brandColor}\n            onImportChannelsBulk=',
  '          <IPTVScanner\n            brandColor={brandColor}\n            t={t}\n            onImportChannelsBulk='
);

// 2. CORS Proxy toast messages
content = content.replace(
  'setSuccessMsg("✅ Domain berhasil ditambahkan ke Whitelist Proxy CORS!");',
  'setSuccessMsg(t?.cmsCorsSuccessAdd || "✅ Domain added to CORS Proxy Whitelist!");'
);
content = content.replace(
  'setSuccessMsg(`🗑️ Domain "${domain}" dihapus dari Whitelist Proxy.`);',
  'setSuccessMsg(`🗑️ Domain "${domain}" removed from Proxy Whitelist.`);'
);
content = content.replace(
  'setSuccessMsg("🔄 Whitelist domain proxy dikembalikan ke pengaturan default.");',
  'setSuccessMsg(t?.cmsCorsReset || "🔄 Proxy domain whitelist reverted to defaults.");'
);

// 3. Channel form save messages & alerts
content = content.replace(
  "showAlert('Nama channel dan stream URL wajib diisi.');",
  "showAlert(t?.cmsChannelNameUrlRequired || 'Channel name and stream URL are required.');"
);
content = content.replace(
  "throw new Error(errData.error || 'Gagal menyimpan channel.');",
  "throw new Error(errData.error || t?.cmsChannelSaveFailed || 'Failed to save channel.');"
);
content = content.replace(
  "setSuccessMsg(channelFormMode === 'create' ? 'Channel berhasil ditambahkan! âœ…' : 'Channel berhasil diperbarui! âœ…');",
  "setSuccessMsg(channelFormMode === 'create' ? (t?.cmsChannelSuccessCreate || 'Channel successfully added! ✅') : (t?.cmsChannelSuccessUpdate || 'Channel successfully updated! ✅'));"
);
content = content.replace(
  "setSuccessMsg(channelFormMode === 'create' ? 'Channel berhasil ditambahkan! ✅' : 'Channel berhasil diperbarui! ✅');",
  "setSuccessMsg(channelFormMode === 'create' ? (t?.cmsChannelSuccessCreate || 'Channel successfully added! ✅') : (t?.cmsChannelSuccessUpdate || 'Channel successfully updated! ✅'));"
);
content = content.replace(
  "showAlert(err.message || 'Gagal menyimpan channel.');",
  "showAlert(err.message || t?.cmsChannelSaveFailed || 'Failed to save channel.');"
);

// 4. Subtitle auto-fetch messages
content = content.replace(
  'throw new Error(data.error || "Gagal mencari subtitle otomatis.");',
  'throw new Error(data.error || t?.cmsAutoSubsFailed || "Failed to search subtitles automatically.");'
);
content = content.replace(
  'setSuccessMsg(`Berhasil menambahkan ${addedCount} subtitle (Prioritas: Indonesia & English)! ✨`);',
  'setSuccessMsg(t?.cmsAutoSubsSuccess || `Successfully added ${addedCount} subtitles! ✨`);'
);
content = content.replace(
  'showAlert("Subtitle untuk bahasa yang ditemukan sudah ada di daftar.");',
  'showAlert(t?.cmsAutoSubsAlreadyExist || "Subtitles for the detected languages already exist in the list.");'
);
content = content.replace(
  'showAlert(err.message || "Gagal mencari subtitle otomatis.");',
  'showAlert(err.message || t?.cmsAutoSubsFailed || "Failed to search subtitles automatically.");'
);

// 5. Live TV tab header & buttons
content = content.replace(
  'Live TV Channels Management',
  '{t?.cmsLiveTvManagement || "Live TV Channels Management"}'
);
content = content.replace(
  'Manage HLS (.m3u8) & DASH (.mpd) live streams, station logos, categories, and stream URLs.',
  '{t?.cmsLiveTvSubtitle || "Manage HLS, DASH, and M3U8 broadcast streams in your platform catalog."}'
);
content = content.replace(
  '<span>{healthCheckRunning ? (t?.buffering || "Checking...") : (t?.healthCheckBtn || "Check All Status")}</span>',
  '<span>{healthCheckRunning ? (t?.cmsStreamChecking || "Checking...") : (t?.cmsCheckHealthBtn || "Check All Streams Health")}</span>'
);
content = content.replace(
  '<span>{t?.addChannelBtn || "Add Channel"}</span>',
  '<span>{t?.cmsAddNewChannelBtn || "+ Add New TV Channel"}</span>'
);

// 6. CORS whitelist section
content = content.replace(
  'Pengaturan Proxy CORS & Whitelist Domain Live TV',
  '{t?.cmsCorsSettingsTitle || "CORS Proxy & Live TV Whitelist Settings"}'
);
content = content.replace(
  '<span>Reset Default</span>',
  '<span>{t?.cmsResetDefaultDomains || "Reset to Defaults"}</span>'
);
content = content.replace(
  'placeholder="Masukkan nama domain (contoh: visionplus.id, vidio.com, trans7.co.id)"',
  'placeholder={t?.cmsAddDomainPlaceholder || "Enter domain name (e.g. visionplus.id, cnnindonesia.com)..."}'
);
content = content.replace(
  'title="Reset Whitelist Domain ke Default"',
  'title={t?.cmsResetDefaultDomains || "Reset to Defaults"}'
);

// 7. Bulk selection bar
content = content.replace(
  '{selectedChannelIds.size} saluran dipilih',
  '{selectedChannelIds.size} {t?.cmsSelectedChannels || "channels selected"}'
);
content = content.replace(
  '>Batal Pilih</button>',
  '>{t?.cmsDeselectAll || "Deselect"}</button>'
);
content = content.replace(
  '`Hapus ${ids.length} saluran yang dipilih? Tindakan ini tidak bisa dibatalkan.`',
  't?.cmsDeleteSelectedConfirm || `Delete ${ids.length} selected channels? This action cannot be undone.`'
);
content = content.replace(
  'title="Pilih semua saluran"',
  'title={t?.cmsSelectAllChannels || "Select all channels"}'
);

// 8. Live TV table headers
content = content.replace(
  '<th className="py-3.5 px-4">URL Stream (HLS/DASH)</th>',
  '<th className="py-3.5 px-4">{t?.cmsChannelStreamUrl || "Stream URL (HLS/DASH)"}</th>'
);
content = content.replace(
  '<th className="py-3.5 px-4">Format</th>',
  '<th className="py-3.5 px-4">{t?.cmsStreamFormat || "Format"}</th>'
);
content = content.replace(
  '<th className="py-3.5 px-4">Status</th>',
  '<th className="py-3.5 px-4">{t?.cmsStreamStatus || "Status"}</th>'
);

// Status badges
content = content.replace(
  '<span className="text-[10px] text-zinc-600 italic">Not checked</span>',
  '<span className="text-[10px] text-zinc-600 italic">{t?.cmsStreamNotChecked || "Not checked"}</span>'
);
content = content.replace(
  '<span className="text-[10px] text-amber-400 font-bold">Checking...</span>',
  '<span className="text-[10px] text-amber-400 font-bold">{t?.cmsStreamChecking || "Checking..."}</span>'
);
content = content.replace(
  '<span className="text-[10px] text-emerald-400 font-bold">Online</span>',
  '<span className="text-[10px] text-emerald-400 font-bold">{t?.cmsStreamOnline || "Online"}</span>'
);
content = content.replace(
  '<span className="text-[10px] text-red-400 font-bold">Offline</span>',
  '<span className="text-[10px] text-red-400 font-bold">{t?.cmsStreamOffline || "Offline"}</span>'
);
content = content.replace(
  '<span className="text-[10px] text-zinc-500 font-bold">Error</span>',
  '<span className="text-[10px] text-zinc-500 font-bold">{t?.cmsStreamError || "Error"}</span>'
);

// Table Action Tooltips
content = content.replace(
  'title="Test Stream Play"',
  'title={t?.cmsTestPlay || "Test Stream Play"}'
);
content = content.replace(
  'title="Edit Saluran"',
  'title={t?.cmsEditChannel || "Edit Channel"}'
);
content = content.replace(
  'title="Hapus Saluran"',
  'title={t?.cmsDeleteChannel || "Delete Channel"}'
);

// 9. Add/Edit Channel Modal Form
content = content.replace(
  "{channelFormMode === 'create' ? '+ Tambah Channel TV Baru' : 'Edit Channel TV'}",
  "{channelFormMode === 'create' ? (t?.cmsModalAddChannel || '+ Add New TV Channel') : (t?.cmsModalEditChannel || 'Edit TV Channel')}"
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nama Channel <span className="text-red-500">*</span></label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelNameLabel || "Channel Name"} <span className="text-red-500">*</span></label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stream URL (M3U8 / DASH / MP4) <span className="text-red-500">*</span></label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelUrlLabel || "Stream URL (M3U8 / DASH / MP4)"} <span className="text-red-500">*</span></label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">URL Logo / Thumbnail</label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelLogoLabel || "Logo / Thumbnail URL"}</label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deskripsi</label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelDescLabel || "Description"}</label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Negara</label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelCountryLabel || "Country"}</label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bahasa</label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelLangLabel || "Language"}</label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kualitas Stream</label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelQualityLabel || "Stream Quality"}</label>'
);
content = content.replace(
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kategori Channel</label>',
  '<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.cmsChannelCategoryLabel || "Channel Category"}</label>'
);
content = content.replace(
  '<p className="text-[10px] text-amber-400">Pilih minimal 1 kategori</p>',
  '<p className="text-[10px] text-amber-400">{t?.cmsChannelCategoryMin || "Select at least 1 category"}</p>'
);
content = content.replace(
  '>Batal</button>',
  '>{t?.cancel || "Cancel"}</button>'
);
content = content.replace(
  "{channelSaving ? 'Menyimpan...' : channelFormMode === 'create' ? 'Simpan Channel' : 'Update Channel'}",
  "{channelSaving ? (t?.cmsSavingChannel || 'Saving...') : channelFormMode === 'create' ? (t?.cmsSaveChannelBtn || 'Save Channel') : (t?.cmsUpdateChannelBtn || 'Update Channel')}"
);

fs.writeFileSync('src/components/AdminCMS.tsx', content, 'utf8');
console.log('Successfully updated src/components/AdminCMS.tsx!');
