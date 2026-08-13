import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Info, Tv, Film, Clapperboard, Sparkles } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Movie, LiveChannel } from '../types';
import { fetchMovies, fetchLiveChannels } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'series' | 'livetv'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedMovies, fetchedChannels] = await Promise.all([
        fetchMovies(),
        fetchLiveChannels(),
      ]);
      setMovies(fetchedMovies);
      setLiveChannels(fetchedChannels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const heroMovie = movies.length > 0 ? movies[0] : null;
  const filteredMovies = activeTab === 'all' 
    ? movies 
    : movies.filter((m) => m.contentType === activeTab);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Detail', { movie: item })}
    >
      <Image source={{ uri: item.posterUrl }} style={styles.posterImage} />
      <Text style={styles.movieTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderChannelItem = ({ item }: { item: LiveChannel }) => (
    <TouchableOpacity
      style={styles.channelCard}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('Player', {
          title: item.name,
          videoUrl: item.streamUrl,
          isLive: true,
        })
      }
    >
      <View style={styles.channelBadgeContainer}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.channelLogo} />
        ) : (
          <Tv color="#E50914" size={24} />
        )}
      </View>
      <Text style={styles.channelName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Sparkles color="#E50914" size={24} style={{ marginRight: 6 }} />
          <Text style={styles.brandTitle}>MyStream<Text style={styles.brandTitleAccent}>Flix</Text></Text>
        </View>
        <TouchableOpacity
          style={styles.liveTvButton}
          onPress={() => navigation.navigate('LiveTV')}
        >
          <Tv color="#FFFFFF" size={18} style={{ marginRight: 4 }} />
          <Text style={styles.liveTvButtonText}>Live TV</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'movie', 'series'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'Semua' : tab === 'movie' ? 'Movies' : 'TV Series'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor="#E50914"
            />
          }
        >
          {/* Hero Banner */}
          {heroMovie && activeTab === 'all' && (
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: heroMovie.backdropUrl || heroMovie.posterUrl }}
                style={styles.heroImage}
              />
              <View style={styles.heroGradientOverlay}>
                <Text style={styles.heroTitle}>{heroMovie.title}</Text>
                <Text style={styles.heroDescription} numberOfLines={2}>
                  {heroMovie.description}
                </Text>
                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() =>
                      navigation.navigate('Player', {
                        title: heroMovie.title,
                        videoUrl: heroMovie.videoUrl,
                        posterUrl: heroMovie.posterUrl,
                      })
                    }
                  >
                    <Play color="#000000" size={20} fill="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.playButtonText}>Putar Sekarang</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => navigation.navigate('Detail', { movie: heroMovie })}
                  >
                    <Info color="#FFFFFF" size={20} style={{ marginRight: 6 }} />
                    <Text style={styles.infoButtonText}>Detail</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Section: Recommended Movies & Series */}
          <View style={styles.sectionHeader}>
            <Clapperboard color="#E50914" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>
              {activeTab === 'series' ? 'TV Series Populer' : 'Movies Terpopuler'}
            </Text>
          </View>
          <FlatList
            horizontal
            data={filteredMovies}
            keyExtractor={(item) => item.id}
            renderItem={renderMovieItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />

          {/* Section: Live TV Channels */}
          <View style={styles.sectionHeader}>
            <Tv color="#E50914" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Saluran Live TV</Text>
          </View>
          <FlatList
            horizontal
            data={liveChannels}
            keyExtractor={(item) => item.id}
            renderItem={renderChannelItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: '#E50914',
  },
  liveTvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveTvButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#18181b',
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: '#E50914',
  },
  tabText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    width: width,
    height: 380,
    position: 'relative',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroDescription: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  playButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 16,
  },
  movieCard: {
    width: 125,
    marginRight: 12,
  },
  posterImage: {
    width: 125,
    height: 185,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  movieTitle: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  channelCard: {
    width: 130,
    height: 90,
    backgroundColor: '#18181b',
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 8,
  },
  channelBadgeContainer: {
    marginBottom: 6,
  },
  channelLogo: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  channelName: {
    color: '#F4F4F5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
