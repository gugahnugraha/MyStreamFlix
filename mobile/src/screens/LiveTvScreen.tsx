import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Tv, Radio, RefreshCw } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, LiveChannel } from '../types';
import { fetchLiveChannels } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveTV'>;

export const LiveTvScreen: React.FC<Props> = ({ navigation }) => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const loadChannels = async () => {
    setLoading(true);
    const data = await fetchLiveChannels();
    setChannels(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const categories = ['All', ...Array.from(new Set(channels.map((c) => c.category || 'Lainnya')))];

  const filteredChannels =
    selectedCategory === 'All'
      ? channels
      : channels.filter((c) => (c.category || 'Lainnya') === selectedCategory);

  const renderChannel = ({ item }: { item: LiveChannel }) => (
    <TouchableOpacity
      style={styles.channelRow}
      onPress={() =>
        navigation.navigate('Player', {
          title: item.name,
          videoUrl: item.streamUrl,
          isLive: true,
        })
      }
    >
      <View style={styles.logoContainer}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.channelLogo} />
        ) : (
          <Tv color="#E50914" size={28} />
        )}
      </View>

      <View style={styles.channelMeta}>
        <Text style={styles.channelName}>{item.name}</Text>
        <Text style={styles.channelCategory}>{item.category || 'Umum'}</Text>
      </View>

      <View style={styles.liveIndicator}>
        <Radio color="#E50914" size={14} style={{ marginRight: 4 }} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saluran TV Langsung</Text>
        <TouchableOpacity onPress={loadChannels} style={styles.refreshBtn}>
          <RefreshCw color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === item && styles.activeCategoryPill,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === item && styles.activeCategoryPillText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Memuat Saluran TV...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          renderItem={renderChannel}
          contentContainerStyle={styles.listContent}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  refreshBtn: {
    padding: 6,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#18181b',
    marginRight: 8,
  },
  activeCategoryPill: {
    backgroundColor: '#E50914',
  },
  categoryPillText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryPillText: {
    color: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    marginTop: 10,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  channelLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  channelMeta: {
    flex: 1,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  channelCategory: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
  },
});
