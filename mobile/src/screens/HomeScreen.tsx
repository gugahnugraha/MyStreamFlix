import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Film, Flame, Star, Tv, Clapperboard, Filter } from "lucide-react-native";
import { Movie } from "../types";
import { useMovies } from "../context/MovieContext";
import { useLanguage } from "../context/LanguageContext";
import HeroCarousel from "../components/HeroCarousel";
import { MovieRow, MovieCard } from "../components/MovieCard";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onPlayMovie: (movie: Movie) => void;
  onShowDetail: (movie: Movie) => void;
  searchQuery: string;
  selectedContentType: "all" | "movie" | "series";
}

export default function HomeScreen({
  onPlayMovie,
  onShowDetail,
  searchQuery,
  selectedContentType,
}: HomeScreenProps) {
  const { movies, loading, error, refresh } = useMovies();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const genres = [
    "All",
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Sci-Fi",
    "Horror",
    "Animation",
    "Romance",
    "Thriller",
  ];

  // Filter non-LiveTV
  const catalog = movies.filter((m) => m.contentType !== "livetv" && !m.id.startsWith("tv-"));

  // Apply search, content type & genre filters
  const filteredList = catalog.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;

    if (selectedContentType === "movie" && item.contentType !== "movie" && item.contentType) return false;
    if (selectedContentType === "series" && item.contentType !== "series") return false;

    if (selectedGenre !== "All" && !item.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) {
      return false;
    }
    return true;
  });

  const isFiltered = !!searchQuery || selectedGenre !== "All" || selectedContentType !== "all";

  // Section Rows for Default Home
  const trending = catalog.slice(0, 8);
  const popularMovies = catalog.filter((m) => m.contentType === "movie" || !m.contentType);
  const tvSeries = catalog.filter((m) => m.contentType === "series");
  const topRated = [...catalog].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 8);

  if (loading && !refreshing && movies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00ADB5" />
        <Text style={styles.loadingText}>Memuat katalog...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onPullRefresh}
          colors={["#00ADB5"]}
          tintColor="#00ADB5"
          progressBackgroundColor="#161622"
        />
      }
    >
      {/* 🎬 Hero Carousel (Only on default Home without filters) */}
      {!isFiltered && (
        <HeroCarousel
          movies={trending}
          onPlay={onPlayMovie}
          onMoreInfo={onShowDetail}
        />
      )}

      {/* 🏷️ Horizontal Genre Filter Bar */}
      <View style={styles.genreFilterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
          {genres.map((g) => {
            const isSel = selectedGenre === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.genrePill, isSel && styles.genrePillActive]}
                onPress={() => setSelectedGenre(g)}
                activeOpacity={0.8}
              >
                <Text style={[styles.genrePillText, isSel && styles.genrePillTextActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🔲 Filtered Grid View */}
      {isFiltered ? (
        <View style={styles.gridSection}>
          <Text style={styles.sectionHeader}>
            {searchQuery
              ? `${t.searchResultsFor} "${searchQuery}" (${filteredList.length})`
              : `${selectedGenre} (${filteredList.length})`}
          </Text>

          {filteredList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Film size={44} color="#333" />
              <Text style={styles.emptyText}>{t.noResults}</Text>
            </View>
          ) : (
            <View style={styles.gridWrap}>
              {filteredList.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <MovieCard
                    movie={item}
                    onPress={onShowDetail}
                    width={(width - 48) / 3}
                    height={((width - 48) / 3) * 1.5}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        /* 📱 Standard Netflix-style Movie Rows */
        <View style={styles.rowsContainer}>
          <MovieRow
            title={t.trendingNow}
            movies={trending}
            onMoviePress={onShowDetail}
            icon={Flame}
          />

          <MovieRow
            title={t.popularMovies}
            movies={popularMovies}
            onMoviePress={onShowDetail}
            icon={Film}
          />

          <MovieRow
            title={t.popularSeries}
            movies={tvSeries}
            onMoviePress={onShowDetail}
            icon={Tv}
          />

          <MovieRow
            title={t.topRated}
            movies={topRated}
            onMoviePress={onShowDetail}
            icon={Star}
          />
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0C",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  genreFilterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  genreList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  genrePill: {
    backgroundColor: "#161622",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  genrePillActive: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  genrePillText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
  },
  genrePillTextActive: {
    color: "#000",
    fontWeight: "800",
  },
  rowsContainer: {
    paddingBottom: 20,
  },
  gridSection: {
    padding: 16,
  },
  sectionHeader: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 16,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridItem: {
    marginBottom: 12,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "700",
  },
});