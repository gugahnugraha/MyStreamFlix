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
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useIsFocused } from "@react-navigation/native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import {
  Radio,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Tv,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  Scaling,
  ListFilter,
  X,
  Globe,
  Wifi,
  Film,
  Zap,
} from "lucide-react-native";
import { Movie } from "../types";
import { fetchMovies } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

export default function LiveTvScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { t } = useLanguage();
  const [channels, setChannels] = useState<Movie[]>([]);
  const [activeChannel, setActiveChannel] = useState<Movie | null>(null);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [loading, setLoading] = useState(true);

  // Player controls state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"contain" | "cover" | "stretch">("contain");
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);

  const videoRef = useRef<Video>(null);
  const controlsTimerRef = useRef<any>(null);

  useEffect(() => {
    loadChannels();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, "fade");
      navigation.setOptions({
        tabBarStyle: {
          backgroundColor: "#0F0F12",
          borderTopColor: "#1A1A20",
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          display: "flex",
        },
      });
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
      }
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // 🛑 Synchronize Bottom Tab Bar visibility with Fullscreen state
  useEffect(() => {
    if (isFullscreen) {
      navigation.setOptions({ tabBarStyle: { display: "none" } });
    } else {
      navigation.setOptions({
        tabBarStyle: {
          backgroundColor: "#0F0F12",
          borderTopColor: "#1A1A20",
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          display: "flex",
        },
      });
    }
  }, [isFullscreen, navigation]);

  // 🛑 Stop playback immediately when leaving Live TV tab
  useEffect(() => {
    if (!isFocused) {
      if (isFullscreen) {
        exitFullscreen();
      }
      videoRef.current?.pauseAsync();
    }
  }, [isFocused]);

  const loadChannels = async () => {
    const data = await fetchMovies();
    const live = data.filter((m) => m.contentType === "livetv" || m.id.startsWith("tv-"));
    setChannels(live);
    if (live.length > 0 && !activeChannel) {
      setActiveChannel(live[0]);
    }
    setLoading(false);
  };

  const resetControlsTimer = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const enterFullscreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    StatusBar.setHidden(true, "fade");
    if (Platform.OS === "android") {
      try {
        await NavigationBar.setVisibilityAsync("hidden");
        await NavigationBar.setBehaviorAsync("overlay-swipe");
      } catch (e) {}
    }
    setIsFullscreen(true);
    resetControlsTimer();
  };

  const exitFullscreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    StatusBar.setHidden(false, "fade");
    if (Platform.OS === "android") {
      try {
        await NavigationBar.setVisibilityAsync("visible");
      } catch (e) {}
    }
    setShowChannelDrawer(false);
    setIsFullscreen(false);
    setShowControls(true);
  };

  const cycleAspectRatio = () => {
    setAspectRatio((prev) => {
      if (prev === "contain") return "cover";
      if (prev === "cover") return "stretch";
      return "contain";
    });
    resetControlsTimer();
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsBuffering(true);
      return;
    }

    if (status.isPlaying) {
      setIsBuffering(false);
    } else {
      setIsBuffering(status.isBuffering);
    }
  };

  const resizeModeProp =
    aspectRatio === "cover"
      ? ResizeMode.COVER
      : aspectRatio === "stretch"
      ? ResizeMode.STRETCH
      : ResizeMode.CONTAIN;

  const filtered = channels.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedGenre === "All") return true;
    return c.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
  });

  const genres = [
    "All",
    "News",
    "Sports",
    "Entertainment",
    "Movies",
    "Kids",
    "Music",
    "Documentary",
  ];

  return (
    <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0A0A0C"
        hidden={isFullscreen}
      />

      {/* 📺 Top Live TV ExoPlayer Viewport */}
      {activeChannel ? (
        <View style={[styles.playerContainer, isFullscreen && styles.playerContainerFullscreen]}>
          <Video
            ref={videoRef}
            source={{ uri: activeChannel.videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeModeProp}
            shouldPlay={isFocused && isPlaying}
            isMuted={isMuted}
            volume={volume}
            progressUpdateIntervalMillis={200}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {/* Tap Surface to Toggle Controls */}
          <TouchableWithoutFeedback
            onPress={() => {
              if (showControls) {
                setShowControls(false);
              } else {
                resetControlsTimer();
              }
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* Buffering Indicator */}
          {isBuffering && (
            <View style={styles.centerOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#00ADB5" />
              <Text style={styles.bufferingText}>Connecting Live IPTV Stream...</Text>
            </View>
          )}

          {/* 🪟 Live Player HUD Overlay */}
          {showControls && (
            <View
              style={[styles.playerHud, isFullscreen && styles.playerHudFullscreen]}
              pointerEvents="box-none"
            >
              {/* Top Row: Back Button, Title, Aspect Ratio & Channels */}
              <View style={styles.playerTopRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (isFullscreen) {
                      exitFullscreen();
                    } else if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      navigation.navigate("Catalog");
                    }
                  }}
                  style={styles.glassCircleBtn}
                >
                  <ChevronLeft size={18} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.liveBadge}>
                  <Radio size={10} color="#FFF" />
                  <Text style={styles.liveBadgeText}>LIVE STREAM</Text>
                </View>

                <Text style={styles.playerChannelTitle} numberOfLines={1}>
                  {activeChannel.title}
                </Text>

                {/* Aspect Ratio Toggle */}
                <TouchableOpacity onPress={cycleAspectRatio} style={styles.glassPillBtn}>
                  <Scaling size={12} color="#00ADB5" />
                  <Text style={styles.glassPillText}>{aspectRatio.toUpperCase()}</Text>
                </TouchableOpacity>

                {/* Channels Drawer Button (In Fullscreen) */}
                {isFullscreen && (
                  <TouchableOpacity
                    onPress={() => {
                      setShowChannelDrawer(!showChannelDrawer);
                      resetControlsTimer();
                    }}
                    style={[styles.glassPillBtn, showChannelDrawer && styles.glassPillBtnActive]}
                  >
                    <ListFilter size={12} color={showChannelDrawer ? "#00ADB5" : "#FFF"} />
                    <Text style={[styles.glassPillText, showChannelDrawer && { color: "#00ADB5" }]}>
                      Channels ({channels.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Center Play/Pause Button */}
              <View style={styles.centerControls} pointerEvents="box-none">
                <TouchableOpacity onPress={handlePlayPause} style={styles.glassPlayBtn}>
                  {isPlaying ? (
                    <Pause size={24} color="#FFF" />
                  ) : (
                    <Play size={24} color="#FFF" fill="#FFF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Bottom Row: Volume Slider, Quality & Fullscreen Toggle */}
              <View style={styles.playerBottomRow}>
                <View style={styles.modernVolumePill}>
                  <TouchableOpacity
                    onPress={() => {
                      const targetMute = !isMuted;
                      setIsMuted(targetMute);
                      videoRef.current?.setStatusAsync({ isMuted: targetMute });
                      resetControlsTimer();
                    }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={15} color="#E50914" />
                    ) : (
                      <Volume2 size={15} color="#00ADB5" />
                    )}
                  </TouchableOpacity>

                  <Slider
                    style={[styles.modernVolumeSlider, isFullscreen && { width: 130 }]}
                    minimumValue={0}
                    maximumValue={1}
                    value={isMuted ? 0 : volume}
                    onValueChange={(val) => {
                      setVolume(val);
                      setIsMuted(val === 0);
                      videoRef.current?.setStatusAsync({ volume: val, isMuted: val === 0 });
                      resetControlsTimer();
                    }}
                    minimumTrackTintColor="#00ADB5"
                    maximumTrackTintColor="rgba(255,255,255,0.2)"
                    thumbTintColor="#00ADB5"
                  />
                  <Text style={styles.volPercentText}>{Math.round(volume * 100)}%</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.qualityTag}>
                    <Text style={styles.qualityTagText}>{activeChannel.quality || "HD 1080p"}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={isFullscreen ? exitFullscreen : enterFullscreen}
                    style={styles.glassFullscreenBtn}
                  >
                    {isFullscreen ? <Minimize size={16} color="#FFF" /> : <Maximize size={16} color="#FFF" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* 🪟 Fullscreen Glassmorphic Channel Drawer Overlay */}
          {isFullscreen && showChannelDrawer && (
            <View style={styles.drawerSidebar}>
              <View style={styles.drawerHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Tv size={16} color="#00ADB5" />
                  <Text style={styles.drawerTitle}>Live Broadcasts</Text>
                </View>
                <TouchableOpacity onPress={() => setShowChannelDrawer(false)} style={styles.drawerCloseBtn}>
                  <X size={16} color="#AAA" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 10, gap: 6 }}
                renderItem={({ item }) => {
                  const isSelected = activeChannel?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.drawerItem, isSelected && styles.drawerItemActive]}
                      onPress={() => {
                        setActiveChannel(item);
                        setShowChannelDrawer(false);
                        resetControlsTimer();
                      }}
                    >
                      <Image
                        source={{ uri: item.posterUrl || item.backdropUrl }}
                        style={styles.drawerLogo}
                        resizeMode="contain"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.drawerChannelName, isSelected && { color: "#00ADB5", fontWeight: "bold" }]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.drawerChannelMeta}>
                          {item.genres?.[0] || "Live TV"} • {item.quality}
                        </Text>
                      </View>
                      {isSelected && <Play size={12} color="#00ADB5" fill="#00ADB5" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </View>
      ) : null}

      {/* 📋 Inline Channel Browser & Details Section */}
      {!isFullscreen && (
        <ScrollView style={styles.browserContainer} showsVerticalScrollIndicator={false}>
          {/* Active Channel Details Card */}
          {activeChannel && (
            <View style={styles.activeChannelInfoCard}>
              <View style={styles.activeChannelHeader}>
                <View style={styles.activeLogoWrap}>
                  <Image
                    source={{ uri: activeChannel.posterUrl || activeChannel.backdropUrl }}
                    style={styles.activeLogo}
                    resizeMode="contain"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.activeChannelTitle}>{activeChannel.title}</Text>
                  <View style={styles.activeMetaRow}>
                    <View style={styles.activeLivePill}>
                      <View style={styles.activeLiveDot} />
                      <Text style={styles.activeLivePillText}>{t.onlineStatus}</Text>
                    </View>
                    <Text style={styles.activeChannelMetaText}>
                      {t.hlsStream} • {activeChannel.quality || "1080p FHD"}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.activeChannelDesc} numberOfLines={2}>
                {activeChannel.description ||
                  "Live 24/7 broadcast streaming with native hardware acceleration on MyStreamFlix."}
              </Text>
            </View>
          )}

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#777" />
            <TextInput
              placeholder={t.searchChannels}
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={15} color="#AAA" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Filter Slider */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreScroll}
          >
            {genres.map((g) => {
              const isActive = selectedGenre === g;
              const label = (t as any)[g] || g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGenre(g)}
                  style={[styles.genrePill, isActive && styles.genrePillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genreText, isActive && styles.genreTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Channel Grid Section Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>{t.availableChannels}</Text>
            <Text style={styles.sectionHeaderCount}>{filtered.length} {t.channelsCount}</Text>
          </View>

          {/* Channel Cards Grid */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#00ADB5" />
            </View>
          ) : (
            <View style={styles.channelsGrid}>
              {filtered.map((item) => {
                const isSelected = activeChannel?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.channelGridCard, isSelected && styles.channelGridCardActive]}
                    onPress={() => {
                      setActiveChannel(item);
                      setIsPlaying(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gridLogoContainer}>
                      <Image
                        source={{ uri: item.posterUrl || item.backdropUrl }}
                        style={styles.gridLogo}
                        resizeMode="contain"
                      />
                      <View style={styles.gridLiveTag}>
                        <Text style={styles.gridLiveTagText}>LIVE</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.playingIndicatorBadge}>
                          <Play size={12} color="#000" fill="#000" />
                        </View>
                      )}
                    </View>

                    <View style={styles.gridCardInfo}>
                      <Text
                        style={[styles.gridChannelTitle, isSelected && { color: "#00ADB5" }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.gridChannelMeta} numberOfLines={1}>
                        {item.genres?.[0] || "Live Stream"} • {item.quality}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
    zIndex: 99999,
  },
  playerContainer: {
    width: "100%",
    height: 230,
    backgroundColor: "#000",
    position: "relative",
  },
  playerContainerFullscreen: {
    ...StyleSheet.absoluteFillObject,
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
    paddingTop: Platform.OS === "android" ? 10 : 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  playerHudFullscreen: {
    paddingTop: Platform.OS === "android" ? 18 : 24,
    paddingBottom: Platform.OS === "android" ? 18 : 24,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  playerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  centerControls: {
    justifyContent: "center",
    alignItems: "center",
  },
  glassPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,173,181,0.85)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  playerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  glassCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(20,20,28,0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  glassPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(20,20,28,0.75)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  glassPillBtnActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.2)",
  },
  glassPillText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E50914",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  liveBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  playerChannelTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    flex: 1,
  },
  modernVolumePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,20,28,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  modernVolumeSlider: {
    width: 90,
    height: 18,
  },
  volPercentText: {
    color: "#888",
    fontSize: 9,
    fontWeight: "bold",
    width: 28,
  },
  qualityTag: {
    backgroundColor: "rgba(0,173,181,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.5)",
  },
  qualityTagText: {
    color: "#00ADB5",
    fontSize: 10,
    fontWeight: "bold",
  },
  glassFullscreenBtn: {
    padding: 7,
    backgroundColor: "rgba(0,173,181,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00ADB5",
  },
  drawerSidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 270,
    backgroundColor: "rgba(14,14,20,0.95)",
    borderLeftWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    elevation: 20,
    zIndex: 9999,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  drawerTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  drawerItemActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.15)",
  },
  drawerLogo: {
    width: 40,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#000",
  },
  drawerChannelName: {
    color: "#DDD",
    fontSize: 11,
  },
  drawerChannelMeta: {
    color: "#777",
    fontSize: 9,
    marginTop: 1,
  },
  browserContainer: {
    flex: 1,
  },
  activeChannelInfoCard: {
    backgroundColor: "#121216",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E1E24",
  },
  activeChannelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  activeLogoWrap: {
    width: 48,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  activeLogo: {
    width: 40,
    height: 26,
  },
  activeChannelTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  activeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  activeLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activeLivePillText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "bold",
  },
  activeChannelMetaText: {
    color: "#777",
    fontSize: 11,
  },
  activeChannelDesc: {
    color: "#999",
    fontSize: 11,
    lineHeight: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    marginHorizontal: 16,
    marginBottom: 10,
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
    paddingBottom: 12,
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    color: "#666",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  sectionHeaderCount: {
    color: "#00ADB5",
    fontSize: 11,
    fontWeight: "bold",
  },
  channelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  channelGridCard: {
    width: (width - 40) / 2,
    backgroundColor: "#141418",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1E1E24",
    marginBottom: 4,
  },
  channelGridCardActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.08)",
  },
  gridLogoContainer: {
    width: "100%",
    height: 70,
    borderRadius: 10,
    backgroundColor: "#0A0A0C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
    borderWidth: 1,
    borderColor: "#1A1A20",
  },
  gridLogo: {
    width: "70%",
    height: "65%",
  },
  gridLiveTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#E50914",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridLiveTagText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  playingIndicatorBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#00ADB5",
    justifyContent: "center",
    alignItems: "center",
  },
  gridCardInfo: {
    gap: 2,
  },
  gridChannelTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  gridChannelMeta: {
    color: "#777",
    fontSize: 10,
  },
  center: {
    padding: 40,
    alignItems: "center",
  },
});
