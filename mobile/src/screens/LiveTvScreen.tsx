import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Radio, Search, Tv, Play, Maximize, Minimize, Volume2, VolumeX, Sparkles, AlertCircle } from "lucide-react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { Movie } from "../types";
import { useMovies } from "../context/MovieContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

interface LiveTvScreenProps {
  onRequireAuth: () => void;
}

export default function LiveTvScreen({ onRequireAuth }: LiveTvScreenProps) {
  const { movies } = useMovies();
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();
  const videoRef = useRef<Video>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeChannel, setActiveChannel] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const liveChannels = movies.filter((m) => m.contentType === "livetv" || m.id.startsWith("tv-"));

  useEffect(() => {
    if (liveChannels.length > 0 && !activeChannel) {
      setActiveChannel(liveChannels[0]);
    }
  }, [liveChannels.length]);

  const categories = [
    { id: "All", label: t.allCategories },
    { id: "Nasional", label: t.national },
    { id: "News", label: t.news },
    { id: "Sports", label: t.sports },
    { id: "Entertainment", label: t.entertainment },
    { id: "Kids", label: t.kids },
    { id: "Music", label: t.music },
    { id: "Documentary", label: t.documentary },
  ];

  const filteredChannels = liveChannels.filter((ch) => {
    const matchSearch = ch.title.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedCategory === "All") return true;
    return ch.genres?.some((g) => g.toLowerCase() === selectedCategory.toLowerCase());
  });

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      setIsFullscreen(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  };

  const handleSelectChannel = (ch: Movie) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setActiveChannel(ch);
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} barStyle="light-content" backgroundColor="#000" />

      {/* 📺 Top Live TV Player Viewport */}
      {activeChannel ? (
        <View style={[styles.playerWrap, isFullscreen && styles.fullscreenPlayer]}>
          <Video
            ref={videoRef}
            source={{ uri: activeChannel.videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isMuted={isMuted}
            onPlaybackStatusUpdate={(st) => {
              if (st.isLoaded) {
                setIsBuffering(st.isBuffering);
                setIsPlaying(st.isPlaying);
              }
            }}
          />

          {/* Buffering Indicator */}
          {isBuffering && (
            <View style={styles.bufferingBox}>
              <ActivityIndicator size="large" color="#00ADB5" />
              <Text style={styles.bufferingText}>Memuat siaran langsung...</Text>
            </View>
          )}

          {/* Player Controls Bar */}
          <View style={styles.playerBar}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            <Text style={styles.activeTitle} numberOfLines={1}>
              {activeChannel.title}
            </Text>

            <View style={styles.playerActions}>
              <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.smallBtn}>
                {isMuted ? <VolumeX size={16} color="#FFF" /> : <Volume2 size={16} color="#FFF" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFullscreen} style={styles.smallBtn}>
                {isFullscreen ? <Minimize size={16} color="#FFF" /> : <Maximize size={16} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {!isFullscreen && (
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#777" />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="#666"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => {
              const isSel = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, isSel && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catChipText, isSel && styles.catChipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Channels Grid */}
          <View style={styles.channelsSection}>
            <View style={styles.channelsHeader}>
              <Radio size={16} color="#FF4444" />
              <Text style={styles.channelsTitle}>{t.liveChannels}</Text>
              <Text style={styles.channelsCount}>{filteredChannels.length}</Text>
            </View>

            {filteredChannels.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Tv size={40} color="#333" />
                <Text style={styles.emptyText}>{t.noResults}</Text>
              </View>
            ) : (
              <View style={styles.channelsGrid}>
                {filteredChannels.map((ch) => {
                  const isActive = activeChannel?.id === ch.id;

                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={[styles.channelCard, isActive && styles.channelCardActive]}
                      onPress={() => handleSelectChannel(ch)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: ch.posterUrl || ch.backdropUrl }}
                        style={styles.channelPoster}
                        resizeMode="cover"
                      />

                      <View style={styles.cardLiveTag}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveTagText}>LIVE</Text>
                      </View>

                      {isActive && (
                        <View style={styles.playingTag}>
                          <Play size={10} color="#000" fill="#000" />
                          <Text style={styles.playingTagText}>DIPUTAR</Text>
                        </View>
                      )}

                      <Text style={styles.channelName} numberOfLines={1}>{ch.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0C" },
  fullscreenContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  playerWrap: { width, height: (width * 9) / 16, backgroundColor: "#000", position: "relative" },
  fullscreenPlayer: { width: "100%", height: "100%" },
  bufferingBox: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.6)" },
  bufferingText: { color: "#00ADB5", fontSize: 12, fontWeight: "700" },
  playerBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.7)" },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,68,68,0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#FF4444" },
  liveText: { color: "#FF4444", fontSize: 9, fontWeight: "900" },
  activeTitle: { color: "#FFF", fontSize: 13, fontWeight: "800", flex: 1, marginHorizontal: 10 },
  playerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  smallBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  contentScroll: { flex: 1 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#14141E", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 12, margin: 16, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, color: "#FFF", fontSize: 13, marginLeft: 8 },
  categoryRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  catChip: { backgroundColor: "#161622", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  catChipActive: { backgroundColor: "#FF4444", borderColor: "#FF4444" },
  catChipText: { color: "#888", fontSize: 12, fontWeight: "700" },
  catChipTextActive: { color: "#FFF", fontWeight: "800" },
  channelsSection: { paddingHorizontal: 16 },
  channelsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  channelsTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", flex: 1 },
  channelsCount: { color: "#666", fontSize: 11, fontWeight: "700", backgroundColor: "#161622", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  channelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  channelCard: { width: (width - 42) / 2, backgroundColor: "#14141E", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 8, marginBottom: 6 },
  channelCardActive: { borderColor: "#00ADB5", backgroundColor: "rgba(0,173,181,0.08)" },
  channelPoster: { width: "100%", height: 95, borderRadius: 8, backgroundColor: "#0A0A0C" },
  cardLiveTag: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,68,68,0.85)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  liveTagText: { color: "#FFF", fontSize: 8, fontWeight: "900" },
  playingTag: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#00ADB5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  playingTagText: { color: "#000", fontSize: 8, fontWeight: "900" },
  channelName: { color: "#EEE", fontSize: 12, fontWeight: "700", marginTop: 8 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 10 },
  emptyText: { color: "#666", fontSize: 13, fontWeight: "700" },
});