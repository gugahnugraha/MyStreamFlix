import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { Heart, Film, Play, Lock } from "lucide-react-native";
import { Movie } from "../types";
import { useMovies } from "../context/MovieContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { MovieCard } from "../components/MovieCard";

const { width } = Dimensions.get("window");

interface MyListScreenProps {
  onPlayMovie: (movie: Movie) => void;
  onShowDetail: (movie: Movie) => void;
  onRequireAuth: () => void;
}

export default function MyListScreen({ onPlayMovie, onShowDetail, onRequireAuth }: MyListScreenProps) {
  const { movies, favorites } = useMovies();
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();

  const favoriteMovies = movies.filter((m) => favorites.includes(m.id));

  if (!isLoggedIn) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.lockIconWrap}>
          <Lock size={32} color="#00ADB5" />
        </View>
        <Text style={styles.lockTitle}>{t.loginRequired}</Text>
        <Text style={styles.lockSub}>Silakan masuk ke akun Anda untuk melihat dan mengelola daftar film favorit.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={onRequireAuth} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>{t.signIn}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Heart size={20} color="#FF4444" fill="#FF4444" />
        <Text style={styles.headerTitle}>{t.myList}</Text>
        <Text style={styles.headerCount}>{favoriteMovies.length}</Text>
      </View>

      {favoriteMovies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Film size={48} color="#333" />
          <Text style={styles.emptyTitle}>Daftar Tontonan Kosong</Text>
          <Text style={styles.emptySub}>Tekan ikon hati pada film manapun untuk menyimpannya di sini.</Text>
        </View>
      ) : (
        <View style={styles.gridWrap}>
          {favoriteMovies.map((item) => (
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0C", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18, marginTop: 10 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "900", flex: 1 },
  headerCount: { color: "#666", fontSize: 12, fontWeight: "700", backgroundColor: "#161622", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: { marginBottom: 12 },
  centerContainer: { flex: 1, backgroundColor: "#0A0A0C", justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  lockIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,173,181,0.12)", borderWidth: 1, borderColor: "rgba(0,173,181,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  lockTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  lockSub: { color: "#777", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 12 },
  loginBtn: { backgroundColor: "#00ADB5", paddingVertical: 11, paddingHorizontal: 28, borderRadius: 20 },
  loginBtnText: { color: "#000", fontWeight: "900", fontSize: 13 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  emptySub: { color: "#666", fontSize: 12, textAlign: "center", maxWidth: 260 },
});