import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { X, Play, Heart, Star, Clock, Calendar, Film } from "lucide-react-native";
import { Movie } from "../types";
import { useMovies } from "../context/MovieContext";
import { useLanguage } from "../context/LanguageContext";

const { width, height } = Dimensions.get("window");

interface MovieDetailModalProps {
  visible: boolean;
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

export default function MovieDetailModal({ visible, movie, onClose, onPlay }: MovieDetailModalProps) {
  const { isFavorite, toggleFavorite } = useMovies();
  const { t } = useLanguage();

  if (!movie) return null;

  const fav = isFavorite(movie.id);
  const year = movie.releaseYear || movie.year || "";
  const ratingNum = typeof movie.rating === "number" ? movie.rating : parseFloat(movie.rating) || 8.0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={18} color="#FFF" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Backdrop Banner */}
            <View style={styles.bannerWrap}>
              <Image
                source={{ uri: movie.backdropUrl || movie.posterUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <View style={styles.bannerOverlay}>
                <TouchableOpacity
                  style={styles.floatingPlayBtn}
                  onPress={() => {
                    onClose();
                    onPlay(movie);
                  }}
                  activeOpacity={0.85}
                >
                  <Play size={20} color="#000" fill="#000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Container */}
            <View style={styles.infoContent}>
              <Text style={styles.title}>{movie.title}</Text>

              {/* Meta Chips */}
              <View style={styles.metaRow}>
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{ratingNum.toFixed(1)}</Text>
                </View>
                {year ? (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{year}</Text>
                  </View>
                ) : null}
                {movie.quality ? (
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityBadgeText}>{movie.quality}</Text>
                  </View>
                ) : null}
                {movie.duration ? (
                  <View style={styles.metaBadge}>
                    <Clock size={10} color="#888" style={{ marginRight: 3 }} />
                    <Text style={styles.metaBadgeText}>{movie.duration}m</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.primaryPlayBtn}
                  onPress={() => {
                    onClose();
                    onPlay(movie);
                  }}
                  activeOpacity={0.85}
                >
                  <Play size={16} color="#000" fill="#000" />
                  <Text style={styles.primaryPlayText}>{t.watchNow}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.favActionBtn, fav && styles.favActionBtnActive]}
                  onPress={() => toggleFavorite(movie.id)}
                  activeOpacity={0.8}
                >
                  <Heart size={16} color={fav ? "#FF4444" : "#FFF"} fill={fav ? "#FF4444" : "transparent"} />
                </TouchableOpacity>
              </View>

              {/* Synopsis */}
              <Text style={styles.sectionHeader}>{t.synopsis}</Text>
              <Text style={styles.synopsisText}>{movie.description}</Text>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <View style={styles.genresRow}>
                  {movie.genres.map((g) => (
                    <View key={g} style={styles.genrePill}>
                      <Text style={styles.genrePillText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Cast & Directors */}
              {movie.cast && movie.cast.length > 0 && (
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>{t.cast}:</Text>
                  <Text style={styles.metaValue}>{movie.cast.join(", ")}</Text>
                </View>
              )}

              {movie.directors && movie.directors.length > 0 && (
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>{t.director}:</Text>
                  <Text style={styles.metaValue}>{movie.directors.join(", ")}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { height: height * 0.82, backgroundColor: "#111118", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  closeBtn: { position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", zIndex: 20 },
  bannerWrap: { width: "100%", height: 210, position: "relative" },
  bannerImage: { width: "100%", height: "100%" },
  bannerOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, top: 0, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  floatingPlayBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#00ADB5", justifyContent: "center", alignItems: "center" },
  infoContent: { padding: 18 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "900", letterSpacing: -0.3, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,215,0,0.15)", borderWidth: 1, borderColor: "rgba(255,215,0,0.3)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingText: { color: "#FFD700", fontSize: 11, fontWeight: "800" },
  metaBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#1C1C28", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaBadgeText: { color: "#AAA", fontSize: 11, fontWeight: "600" },
  qualityBadge: { backgroundColor: "rgba(0,173,181,0.15)", borderWidth: 1, borderColor: "rgba(0,173,181,0.35)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qualityBadgeText: { color: "#00ADB5", fontSize: 10, fontWeight: "800" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  primaryPlayBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#00ADB5", paddingVertical: 12, borderRadius: 14 },
  primaryPlayText: { color: "#000", fontWeight: "900", fontSize: 14 },
  favActionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#1C1C28", borderWidth: 1, borderColor: "#2A2A38", justifyContent: "center", alignItems: "center" },
  favActionBtnActive: { borderColor: "#FF4444", backgroundColor: "rgba(255,68,68,0.1)" },
  sectionHeader: { color: "#FFF", fontSize: 14, fontWeight: "800", marginBottom: 6 },
  synopsisText: { color: "#999", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  genresRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  genrePill: { backgroundColor: "#1C1C28", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#2A2A38" },
  genrePillText: { color: "#00ADB5", fontSize: 11, fontWeight: "600" },
  metaBlock: { flexDirection: "row", marginTop: 4, gap: 6 },
  metaLabel: { color: "#666", fontSize: 12, fontWeight: "700" },
  metaValue: { color: "#AAA", fontSize: 12, flex: 1 },
});