import React, { useState } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import { ModernDialogProvider } from "./src/context/ModernDialogContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { MovieProvider, useMovies } from "./src/context/MovieContext";

import Header from "./src/components/Header";
import MobileBottomNav from "./src/components/MobileBottomNav";
import HeroCarousel from "./src/components/HeroCarousel";
import MovieDetailModal from "./src/components/MovieDetailModal";
import AuthModal from "./src/components/AuthModal";
import ProfileModal from "./src/components/ProfileModal";
import MediaPlayer from "./src/components/MediaPlayer";

import HomeScreen from "./src/screens/HomeScreen";
import LiveTvScreen from "./src/screens/LiveTvScreen";
import MyListScreen from "./src/screens/MyListScreen";
import AdminScreen from "./src/screens/AdminScreen";
import { Movie } from "./src/types";

function MainContainer() {
  const { isLoggedIn, isAdmin } = useAuth();
  const { t } = useLanguage();

  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "movies" | "livetv" | "mylist">("home");
  const [selectedContentType, setSelectedContentType] = useState<"all" | "movie" | "series">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Overlay / Screen States
  const [activeMovieForPlayer, setActiveMovieForPlayer] = useState<Movie | null>(null);
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState<Movie | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReason, setAuthReason] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminScreen, setShowAdminScreen] = useState(false);

  // Intercept play action with auth check
  const handlePlayMovie = (movie: Movie) => {
    if (!isLoggedIn) {
      setAuthReason("Login diperlukan untuk memutar konten video.");
      setShowAuthModal(true);
      return;
    }
    setActiveMovieForPlayer(movie);
  };

  const handleOpenAuth = (reason: string = "") => {
    setAuthReason(reason);
    setShowAuthModal(true);
  };

  const handleTabChange = (tab: "home" | "movies" | "livetv" | "mylist") => {
    if (showAdminScreen) setShowAdminScreen(false);
    setActiveTab(tab);
    if (tab === "home") {
      setSelectedContentType("all");
    } else if (tab === "movies") {
      setSelectedContentType("movie");
    }
  };

  // If Fullscreen Native Player is active, render it exclusively
  if (activeMovieForPlayer) {
    return (
      <MediaPlayer
        movie={activeMovieForPlayer}
        onClose={() => setActiveMovieForPlayer(null)}
      />
    );
  }

  // If Admin Screen is active, render it
  if (showAdminScreen) {
    return <AdminScreen onBack={() => setShowAdminScreen(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0C" />

      {/* 🌟 Web 1:1 Responsive Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onOpenAuth={() => handleOpenAuth("Login untuk akses ribuan tayangan.")}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAdmin={() => setShowAdminScreen(true)}
      />

      {/* 📱 Main Tab Viewports */}
      <View style={styles.body}>
        {(activeTab === "home" || activeTab === "movies") && (
          <HomeScreen
            onPlayMovie={handlePlayMovie}
            onShowDetail={setSelectedMovieForDetail}
            searchQuery={searchQuery}
            selectedContentType={selectedContentType}
          />
        )}

        {activeTab === "livetv" && (
          <LiveTvScreen
            onRequireAuth={() => handleOpenAuth("Login diperlukan untuk menonton Live TV.")}
          />
        )}

        {activeTab === "mylist" && (
          <MyListScreen
            onPlayMovie={handlePlayMovie}
            onShowDetail={setSelectedMovieForDetail}
            onRequireAuth={() => handleOpenAuth("Login diperlukan untuk melihat Daftar Saya.")}
          />
        )}
      </View>

      {/* 🧭 Web 1:1 Responsive 5-Tab Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 🍿 Netflix-Style Movie Detail Modal */}
      <MovieDetailModal
        visible={!!selectedMovieForDetail}
        movie={selectedMovieForDetail}
        onClose={() => setSelectedMovieForDetail(null)}
        onPlay={handlePlayMovie}
      />

      {/* 🔐 Glassmorphic Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason={authReason}
        onAuthSuccess={() => setShowAuthModal(false)}
      />

      {/* 👤 Profile & Account Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenAdmin={() => {
          setShowProfileModal(false);
          setShowAdminScreen(true);
        }}
        onOpenFavorites={() => {
          setShowProfileModal(false);
          setActiveTab("mylist");
        }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ModernDialogProvider>
          <AuthProvider>
            <MovieProvider>
              <MainContainer />
            </MovieProvider>
          </AuthProvider>
        </ModernDialogProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  body: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
});