import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
import { Star, Heart, Lock } from "lucide-react-native";
import { Movie } from "../types";
import { useAuth } from "../context/AuthContext";
import { useMovies } from "../context/MovieContext";

interface MovieCardProps {
  movie: Movie;
  onPress: (movie: Movie) => void;
  width?: number;
  height?: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress, width = 120, height = 180 }) => {
  const { isLoggedIn } = useAuth();
  const { isFavorite, toggleFavorite } = useMovies();
  const fav = isFavorite(movie.id);

  const year = movie.releaseYear || movie.year || "";
  const ratingNum = typeof movie.rating === "number" ? movie.rating : parseFloat(movie.rating) || 8.0;

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={() => onPress(movie)}
      activeOpacity={0.8}
    >
      <View style={[styles.posterWrap, { width, height }]}>
        <Image
          source={{ uri: movie.posterUrl || movie.backdropUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Quality Badge */}
        {movie.quality && (
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>{movie.quality}</Text>
          </View>
        )}

        {/* Heart Favorite Button */}
        <TouchableOpacity
          style={styles.favBtn}
          onPress={(e) => {
            toggleFavorite(movie.id);
          }}
          activeOpacity={0.7}
        >
          <Heart size={13} color={fav ? "#FF4444" : "#FFF"} fill={fav ? "#FF4444" : "transparent"} />
        </TouchableOpacity>

        {/* Lock Icon for Guests */}
        {!isLoggedIn && (
          <View style={styles.lockOverlay}>
            <Lock size={12} color="#FFD700" />
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>{movie.title}</Text>
      
      <View style={styles.metaRow}>
        <View style={styles.ratingWrap}>
          <Star size={10} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingText}>{ratingNum.toFixed(1)}</Text>
        </View>
        {year ? <Text style={styles.yearText}>{year}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
  icon?: any;
}

export const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMoviePress, icon: Icon }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <View style={styles.rowSection}>
      <View style={styles.rowHeader}>
        {Icon && <Icon size={16} color="#00ADB5" style={{ marginRight: 6 }} />}
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCountBadge}>{movies.length}</Text>
      </View>

      <FlatList
        horizontal
        data={movies}
        renderItem={({ item }) => <MovieCard movie={item} onPress={onMoviePress} />}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
  },
  posterWrap: {
    borderRadius: 12,
    backgroundColor: "#161622",
    overflow: "hidden",
    position: "relative",
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  qualityBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.5)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: "#00ADB5",
    fontSize: 9,
    fontWeight: "800",
  },
  favBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 4,
    borderRadius: 6,
  },
  title: {
    color: "#EEE",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "700",
  },
  yearText: {
    color: "#777",
    fontSize: 10,
    fontWeight: "600",
  },
  rowSection: {
    marginTop: 24,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  rowTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
    letterSpacing: -0.3,
  },
  rowCountBadge: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#161622",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rowList: {
    paddingHorizontal: 16,
  },
});