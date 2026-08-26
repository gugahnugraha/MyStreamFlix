import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Radio, Search, Play } from "lucide-react-native";
import { Movie } from "../types";
import { fetchMovies } from "../api/client";

export default function LiveTvScreen({ navigation }: any) {
  const [channels, setChannels] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    const data = await fetchMovies();
    const live = data.filter((m) => m.contentType === "livetv" || m.id.startsWith("tv-"));
    setChannels(live);
    setLoading(false);
  };

  const filtered = channels.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Radio size={22} color="#E50914" />
          <Text style={styles.title}>Live IPTV Channels</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={18} color="#666" />
          <TextInput
            placeholder="Search channels..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00ADB5" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.channelCard}
              onPress={() => navigation.navigate("Player", { movie: item })}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.posterUrl || item.backdropUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.info}>
                <Text style={styles.channelName}>{item.title}</Text>
                <Text style={styles.channelMeta}>
                  {item.genres?.join(", ") || "Live Stream"} • {item.quality}
                </Text>
              </View>
              <View style={styles.playBadge}>
                <Play size={14} color="#00ADB5" fill="#00ADB5" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  header: {
    padding: 20,
    backgroundColor: "#121216",
    borderBottomWidth: 1,
    borderColor: "#1E1E24",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E24",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22222A",
    gap: 12,
  },
  logo: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  info: {
    flex: 1,
  },
  channelName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  channelMeta: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  playBadge: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,173,181,0.12)",
  },
});
