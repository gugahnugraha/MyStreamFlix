import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Play, Info, Flame, Star } from "lucide-react-native";
import { Movie } from "../types";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 400;

interface HeroCarouselProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
}

export default function HeroCarousel({ movies, onPlay, onMoreInfo }: HeroCarouselProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const heroMovies = movies.filter((m) => m.backdropUrl || m.posterUrl).slice(0, 6);

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % heroMovies.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [heroMovies.length]);

  if (heroMovies.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={heroMovies}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => {
          const year = item.releaseYear || item.year || "";
          const ratingNum = typeof item.rating === "number" ? item.rating : parseFloat(item.rating) || 8.5;

          return (
            <View style={styles.slide}>
              <Image
                source={{ uri: item.backdropUrl || item.posterUrl }}
                style={styles.backdropImage}
                resizeMode="cover"
              />

              {/* Dark Gradient Overlay */}
              <View style={styles.gradientOverlay}>
                {/* Badges */}
                <View style={styles.badgeRow}>
                  <View style={styles.trendingBadge}>
                    <Flame size={12} color="#FF4444" />
                    <Text style={styles.trendingText}>TRENDING</Text>
                  </View>
                  {item.quality ? (
                    <View style={styles.qualityBadge}>
                      <Text style={styles.qualityText}>{item.quality}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                {/* Meta info */}
                <View style={styles.metaRow}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{ratingNum.toFixed(1)}</Text>
                  {year ? (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.yearText}>{year}</Text>
                    </>
                  ) : null}
                  {item.genres && item.genres.length > 0 ? (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.genreText}>{item.genres[0]}</Text>
                    </>
                  ) : null}
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>

                {/* Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => onPlay(item)}
                    activeOpacity={0.85}
                  >
                    <Play size={16} color="#000" fill="#000" />
                    <Text style={styles.playBtnText}>{t.watchNow}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.infoBtn}
                    onPress={() => onMoreInfo(item)}
                    activeOpacity={0.85}
                  >
                    <Info size={16} color="#FFF" />
                    <Text style={styles.infoBtnText}>{t.moreInfo}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Indicator Dots */}
      {heroMovies.length > 1 && (
        <View style={styles.dotsRow}>
          {heroMovies.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dotItem,
                activeIndex === idx && styles.dotItemActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height: HERO_HEIGHT,
    position: "relative",
  },
  slide: {
    width,
    height: HERO_HEIGHT,
    position: "relative",
  },
  backdropImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 26,
    paddingTop: 80,
    backgroundColor: "rgba(10,10,12,0.85)",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendingText: {
    color: "#FF4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  qualityBadge: {
    backgroundColor: "rgba(0,173,181,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualityText: {
    color: "#00ADB5",
    fontSize: 10,
    fontWeight: "800",
  },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "700",
  },
  dot: {
    color: "#555",
    fontSize: 12,
  },
  yearText: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "600",
  },
  genreText: {
    color: "#00ADB5",
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    color: "#888",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#00ADB5",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  playBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "900",
  },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  infoBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  dotsRow: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dotItem: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotItemActive: {
    width: 18,
    backgroundColor: "#00ADB5",
  },
});