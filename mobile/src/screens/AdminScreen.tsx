import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  ShieldCheck,
  Film,
  Tv,
  Radio,
  Trash2,
  Eye,
  Plus,
  HardDrive,
  RefreshCw,
  ChevronLeft,
} from "lucide-react-native";
import { Movie } from "../types";
import { fetchMovies } from "../api/client";

export default function AdminScreen({ navigation }: any) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMovies();
    setMovies(data);
    setLoading(false);
  };

  const moviesCount = movies.filter((m) => m.contentType === "movie").length;
  const seriesCount = movies.filter((m) => m.contentType === "series").length;
  const liveCount = movies.filter((m) => m.contentType === "livetv").length;

  const handleDelete = (title: string) => {
    Alert.alert("Delete Item", `Are you sure you want to remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Success", "Item marked for deletion");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>MyStreamFlix Mobile Management</Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#00ADB5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Metric Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Film size={20} color="#00ADB5" />
            <Text style={styles.statNumber}>{moviesCount}</Text>
            <Text style={styles.statLabel}>Movies</Text>
          </View>

          <View style={styles.statCard}>
            <Tv size={20} color="#E50914" />
            <Text style={styles.statNumber}>{seriesCount}</Text>
            <Text style={styles.statLabel}>TV Series</Text>
          </View>

          <View style={styles.statCard}>
            <Radio size={20} color="#10B981" />
            <Text style={styles.statNumber}>{liveCount}</Text>
            <Text style={styles.statLabel}>Live TV</Text>
          </View>
        </View>

        {/* Google Drive & Storage Status */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive size={18} color="#00ADB5" />
            <Text style={styles.storageTitle}>Google Drive Streaming Proxy</Text>
          </View>
          <Text style={styles.storageDesc}>
            Service Account JWT Range-Seeking Streaming is Active (No 100MB virus scan limit).
          </Text>
        </View>

        {/* Catalog Table List */}
        <View style={styles.catalogSection}>
          <Text style={styles.sectionTitle}>CATALOG OVERVIEW ({movies.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#00ADB5" style={{ marginTop: 20 }} />
          ) : (
            movies.map((item) => (
              <View key={item.id} style={styles.catalogItem}>
                <Image
                  source={{ uri: item.posterUrl || item.backdropUrl }}
                  style={styles.itemPoster}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.contentType?.toUpperCase()} • {item.quality} • {item.year}
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate("Player", { movie: item })}
                  >
                    <Eye size={16} color="#00ADB5" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.title)}
                  >
                    <Trash2 size={16} color="#E50914" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#121216",
    borderBottomWidth: 1,
    borderColor: "#1E1E24",
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSub: {
    color: "#777",
    fontSize: 11,
  },
  refreshBtn: {
    padding: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#141418",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22222A",
    alignItems: "center",
  },
  statNumber: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
  },
  statLabel: {
    color: "#777",
    fontSize: 10,
    marginTop: 2,
  },
  storageCard: {
    backgroundColor: "#141418",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22222A",
    marginBottom: 20,
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  storageTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  storageDesc: {
    color: "#888",
    fontSize: 11,
    lineHeight: 16,
  },
  catalogSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  catalogItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E1E24",
    gap: 12,
  },
  itemPoster: {
    width: 44,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#222",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  itemMeta: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1E1E24",
  },
});
