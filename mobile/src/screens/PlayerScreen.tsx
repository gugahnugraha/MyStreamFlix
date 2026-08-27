import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import NativeExoPlayer from "../components/NativeExoPlayer";
import { Movie } from "../types";
import { useAuth } from "../context/AuthContext";
import AuthGateModal from "../components/AuthGateModal";
import { Lock, ChevronLeft } from "lucide-react-native";

interface PlayerScreenProps {
  route: {
    params: {
      movie: Movie;
      initialProgress?: number;
      backendUrl?: string;
      language?: "en" | "id";
    };
  };
  navigation: any;
}

export default function PlayerScreen({ route, navigation }: PlayerScreenProps) {
  const { movie, initialProgress = 0, backendUrl, language = "id" } = route.params;
  const { isLoggedIn } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(!isLoggedIn);

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.lockIconWrap}>
            <Lock size={36} color="#00ADB5" />
          </View>
          <Text style={styles.lockTitle}>Konten Terproteksi</Text>
          <Text style={styles.lockSub}>
            Anda harus masuk ke akun untuk dapat memutar "{movie?.title || "video"}".
          </Text>
          <TouchableOpacity
            style={styles.loginActionBtn}
            onPress={() => setShowAuthGate(true)}
          >
            <Text style={styles.loginActionText}>Masuk ke Akun</Text>
          </TouchableOpacity>
        </View>

        <AuthGateModal
          visible={showAuthGate}
          onClose={() => {
            setShowAuthGate(false);
            if (!isLoggedIn) navigation.goBack();
          }}
          reason="Login diperlukan untuk menonton film dan serial."
          onAuthSuccess={() => setShowAuthGate(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NativeExoPlayer
        movie={movie}
        initialProgress={initialProgress}
        onClose={() => navigation.goBack()}
        backendUrl={backendUrl}
        language={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    backgroundColor: "#080810",
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,173,181,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  lockTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  lockSub: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  loginActionBtn: {
    backgroundColor: "#00ADB5",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  loginActionText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
  },
});
