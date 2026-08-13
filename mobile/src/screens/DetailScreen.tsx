import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Star, Calendar, Clock, Film } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Episode } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export const DetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { movie } = route.params;
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);

  const isSeries = movie.contentType === 'series' && movie.seasons && movie.seasons.length > 0;
  const currentSeason = isSeries ? movie.seasons![selectedSeasonIndex] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movie.title}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Backdrop / Poster Cover */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: movie.backdropUrl || movie.posterUrl }}
            style={styles.backdropImage}
          />
          <View style={styles.backdropOverlay} />
        </View>

        {/* Info Block */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{movie.title}</Text>

          {/* Metadata Row */}
          <View style={styles.metaRow}>
            {movie.rating && (
              <View style={styles.metaBadge}>
                <Star color="#EAB308" size={14} fill="#EAB308" style={{ marginRight: 4 }} />
                <Text style={styles.metaBadgeText}>{movie.rating.toFixed(1)}</Text>
              </View>
            )}

            {movie.releaseYear && (
              <View style={styles.metaBadge}>
                <Calendar color="#A1A1AA" size={14} style={{ marginRight: 4 }} />
                <Text style={styles.metaBadgeText}>{movie.releaseYear}</Text>
              </View>
            )}

            {movie.genre && (
              <View style={styles.genreBadge}>
                <Text style={styles.genreText}>{movie.genre}</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{movie.description}</Text>

          {/* Primary Play Button for Movie */}
          {!isSeries && (
            <TouchableOpacity
              style={styles.primaryPlayBtn}
              onPress={() =>
                navigation.navigate('Player', {
                  title: movie.title,
                  videoUrl: movie.videoUrl,
                  posterUrl: movie.posterUrl,
                })
              }
            >
              <Play color="#FFFFFF" size={20} fill="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryPlayBtnText}>Putar Film</Text>
            </TouchableOpacity>
          )}

          {/* Series Season & Episode Picker */}
          {isSeries && (
            <View style={styles.episodesSection}>
              <Text style={styles.sectionTitle}>Daftar Episode</Text>

              {/* Season Selector Tabs */}
              {movie.seasons!.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonPicker}>
                  {movie.seasons!.map((s, idx) => (
                    <TouchableOpacity
                      key={s.seasonNumber}
                      style={[
                        styles.seasonTab,
                        selectedSeasonIndex === idx && styles.activeSeasonTab,
                      ]}
                      onPress={() => setSelectedSeasonIndex(idx)}
                    >
                      <Text
                        style={[
                          styles.seasonTabText,
                          selectedSeasonIndex === idx && styles.activeSeasonTabText,
                        ]}
                      >
                        Musim {s.seasonNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Episode List */}
              {currentSeason && currentSeason.episodes.map((ep: Episode) => (
                <TouchableOpacity
                  key={ep.id}
                  style={styles.episodeCard}
                  onPress={() =>
                    navigation.navigate('Player', {
                      title: `${movie.title} - E${ep.episodeNumber}: ${ep.title}`,
                      videoUrl: ep.videoUrl,
                      posterUrl: ep.thumbnailUrl || movie.posterUrl,
                    })
                  }
                >
                  <View style={styles.episodePlayIcon}>
                    <Play color="#E50914" size={16} fill="#E50914" />
                  </View>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle}>
                      Ep {ep.episodeNumber}: {ep.title}
                    </Text>
                    {ep.duration && <Text style={styles.episodeDuration}>{ep.duration}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
  backdropContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.4)',
  },
  infoContainer: {
    padding: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  metaBadgeText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
  },
  genreBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: '#D4D4D8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryPlayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  episodesSection: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  seasonPicker: {
    marginBottom: 14,
  },
  seasonTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#18181b',
    marginRight: 8,
  },
  activeSeasonTab: {
    backgroundColor: '#E50914',
  },
  seasonTabText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  activeSeasonTabText: {
    color: '#FFFFFF',
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  episodePlayIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  episodeDuration: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
});
