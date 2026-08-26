import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  Radio,
  Search,
  Play,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Tv,
  CheckCircle,
  Sparkles,
} from "lucide-react-native";
import { Movie } from "../types";
import { fetchMovies } from "../api/client";

const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: "#0F0F12",
  borderTopColor: "#1A1A20",
  height: 64,
  paddingBottom: 8,
  paddingTop: 6,
  display: "flex",
};

export default function LiveTvScreen({ navigation }: any) {
  const [channels, setChannels] = useState<Movie[]>([]);
  const [activeChannel, setActiveChannel] = useState<Movie | null>(null);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [loading, setLoading] = useState(true);

  // Player controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    loadChannels();

    return () => {
      // Restore orientation and bottom tab on screen exit
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, "fade");
      navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
    };
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    const data = await fetchMovies();
    const live = data.filter((m) => m.contentType === "livetv" || m.id.startsWith("tv-"));
    setChannels(live);
    if (live.length > 0) {
      setActiveChannel(live[0]);
    }
    setLoading(false);
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      // Exit fullscreen -> Portrait and restore bottom navigation bar
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, "fade");
      navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
      setIsFullscreen(false);
    } else {
      // Enter fullscreen -> Landscape and HIDE bottom navigation bar completely
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      StatusBar.setHidden(true, "fade");
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      setIsFullscreen(true);
    }
  };

  const filtered = channels.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedGenre === "All") return true;
    return c.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
  });

  const genres = ["All", "News", "Sports", "Entertainment", "Movies", "Kids", "Music"];

  return (
    <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
      {/* 📺 Top Live TV ExoPlayer Viewport */}
      {activeChannel ? (
        <View style={[styles.playerContainer, isFullscreen && styles.playerFullscreen]}>
          <Video
            ref={videoRef}
            source={{ uri: activeChannel.videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            isMuted={isMuted}
            progressUpdateIntervalMillis={200}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setIsBuffering(status.isBuffering);
              }
            }}
          />

          {/* Buffering Indicator */}
          {isBuffering && (
            <View style={styles.centerOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#00ADB5" />
              <Text style={styles.bufferingText}>Connecting Live IPTV Stream...</Text>
            </View>
          )}

          {/* Live Player HUD Overlay */}
          <View style={styles.playerHud}>
            {/* Top Row: Live Badge & Channel Info */}
            <View style={styles.playerTopRow}>
              <View style={styles.liveBadge}>
                <Radio size={12} color="#FFF" />
                <Text style={styles.liveBadgeText}>LIVE STREAM</Text>
              </View>
              <Text style={styles.playerChannelTitle} numberOfLines={1}>
                {activeChannel.title}
              </Text>
            </View>

            {/* Bottom Row: Controls */}
            <View style={styles.playerBottomRow}>
              <TouchableOpacity
                onPress={() => {
                  const targetMute = !isMuted;
                  setIsMuted(targetMute);
                  videoRef.current?.setStatusAsync({ isMuted: targetMute });
                }}
                style={styles.hudBtn}
              >
                {isMuted ? <VolumeX size={18} color="#E50914" /> : <Volume2 size={18} color="#FFF" />}
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.qualityTag}>
                  <Text style={styles.qualityTagText}>{activeChannel.quality || "HD 1080p"}</Text>
                </View>

                {/* Fullscreen Toggle Button */}
                <TouchableOpacity onPress={toggleFullscreen} style={styles.hudBtn}>
                  {isFullscreen ? <Minimize size={18} color="#FFF" /> : <Maximize size={18} color="#FFF" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Channel Browser & List (Hidden completely in Fullscreen mode) */}
      {!isFullscreen && (
        <View style={styles.browserContainer}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#777" />
            <TextInput
              placeholder="Search Live IPTV Channels..."
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* Genres Category Slider */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreScroll}
          >
            {genres.map((g) => {
              const isActive = selectedGenre === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGenre(g)}
                  style={[styles.genrePill, isActive && styles.genrePillActive]}
                >
                  <Text style={[styles.genreText, isActive && styles.genreTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Channels Grid / List */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#00ADB5" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const isSelected = activeChannel?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.channelCard, isSelected && styles.channelCardActive]}
                    onPress={() => setActiveChannel(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.posterUrl || item.backdropUrl }}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                    <View style={styles.info}>
                      <Text style={[styles.channelName, isSelected && { color: "#00ADB5" }]}>
                        {item.title}
                      </Text>
                      <Text style={styles.channelMeta}>
                        {item.genres?.join(", ") || "Live Stream"} • {item.quality}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.activePlayBadge}>
                        <Play size={14} color="#000" fill="#000" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  containerFullscreen: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  playerContainer: {
    width: "100%",
    height: 230,
    backgroundColor: "#000",
    position: "relative",
  },
  playerFullscreen: {
    width: "100%",
    height: "100%",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bufferingText: {
    color: "#FFF",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  playerHud: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  playerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E50914",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  playerChannelTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
  },
  playerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hudBtn: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  qualityTag: {
    backgroundColor: "rgba(0,173,181,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00ADB5",
  },
  qualityTagText: {
    color: "#00ADB5",
    fontSize: 10,
    fontWeight: "bold",
  },
  browserContainer: {
    flex: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#22222A",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
  },
  genreScroll: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "#22222A",
  },
  genrePillActive: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  genreText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  genreTextActive: {
    color: "#000",
    fontWeight: "900",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E1E24",
    gap: 12,
  },
  channelCardActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.08)",
  },
  logo: {
    width: 52,
    height: 38,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  info: {
    flex: 1,
  },
  channelName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  channelMeta: {
    color: "#777",
    fontSize: 10,
    marginTop: 2,
  },
  activePlayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00ADB5",
    justifyContent: "center",
    alignItems: "center",
  },
});
