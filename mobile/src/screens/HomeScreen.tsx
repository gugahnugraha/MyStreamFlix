import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Play, Info, Flame, Film, Tv, Radio } from "lucide-react-native";
import Header from "../components/Header";
import { Movie } from "../types";
import { fetchMovies } from "../api/client";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMovies();
    setMovies(data);
    setLoading(false);
  };

  // Filter movies by search query and category
  const filteredMovies = movies.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === "All") return true;
    if (selectedCategory === "Movies") return item.contentType === "movie";
    if (selectedCategory === "TV Series") return item.contentType === "series";
    if (selectedCategory === "Live TV") return item.contentType === "livetv";

    return item.genres?.some(
      (g) => g.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  const featured = movies[0];
  const moviesList = filteredMovies.filter((m) => m.contentType === "movie");
  const seriesList = filteredMovies.filter((m) => m.contentType === "series");
  const liveTvList = filteredMovies.filter((m) => m.contentType === "livetv");

  const renderMovieCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Player", { movie: item })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.posterUrl || item.backdropUrl }}
        style={styles.cardPoster}
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardMeta}>
          {item.year || "2024"} • {item.quality}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0C" />

      {/* Top Header with Search & Category Slider */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onProfilePress={() => navigation.navigate("Profile")}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ADB5" />
          <Text style={styles.loadingText}>Loading MyStreamFlix...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Featured Hero Banner (Only shown when not searching) */}
          {!searchQuery && selectedCategory === "All" && featured && (
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: featured.backdropUrl || featured.posterUrl }}
                style={styles.heroImage}
              />
              <View style={styles.heroGradient}>
                <View style={styles.heroBadge}>
                  <Flame size={14} color="#E50914" />
                  <Text style={styles.heroBadgeText}>FEATURED TODAY</Text>
                </View>
                <Text style={styles.heroTitle}>{featured.title}</Text>
                <Text style={styles.heroDesc} numberOfLines={2}>
                  {featured.description}
                </Text>

                {/* Hero Actions */}
                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => navigation.navigate("Player", { movie: featured })}
                  >
                    <Play size={18} color="#000" fill="#000" />
                    <Text style={styles.playButtonText}>Watch Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Search Result Grid View when searching */}
          {searchQuery ? (
            <View style={styles.searchGridSection}>
              <Text style={styles.searchGridTitle}>
                Search Results for "{searchQuery}" ({filteredMovies.length})
              </Text>
              <View style={styles.gridContainer}>
                {filteredMovies.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridCard}
                    onPress={() => navigation.navigate("Player", { movie: item })}
                  >
                    <Image
                      source={{ uri: item.posterUrl || item.backdropUrl }}
                      style={styles.gridPoster}
                      resizeMode="cover"
                    />
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {/* Movies Row */}
              {moviesList.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Film size={18} color="#00ADB5" />
                    <Text style={styles.sectionTitle}>Trending Movies</Text>
                  </View>
                  <FlatList
                    horizontal
                    data={moviesList}
                    renderItem={renderMovieCard}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}

              {/* Series Row */}
              {seriesList.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Tv size={18} color="#E50914" />
                    <Text style={styles.sectionTitle}>Popular TV Series</Text>
                  </View>
                  <FlatList
                    horizontal
                    data={seriesList}
                    renderItem={renderMovieCard}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}

              {/* Live TV Channels Row */}
              {liveTvList.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Radio size={18} color="#10B981" />
                    <Text style={styles.sectionTitle}>Live Broadcasts</Text>
                  </View>
                  <FlatList
                    horizontal
                    data={liveTvList}
                    renderItem={renderMovieCard}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
            </>
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
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0A0A0C",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "bold",
  },
  heroContainer: {
    height: 380,
    width: width,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(10,10,12,0.85)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroDesc: {
    color: "#AAA",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00ADB5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  playButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 130,
  },
  cardPoster: {
    width: 130,
    height: 190,
    borderRadius: 12,
    backgroundColor: "#1E1E22",
  },
  cardInfo: {
    marginTop: 6,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardMeta: {
    color: "#777",
    fontSize: 10,
    marginTop: 2,
  },
  searchGridSection: {
    padding: 16,
  },
  searchGridTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  gridCard: {
    width: (width - 44) / 3,
    marginBottom: 12,
  },
  gridPoster: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    backgroundColor: "#1E1E22",
  },
});
