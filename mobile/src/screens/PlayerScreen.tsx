import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { ExoVideoPlayer } from '../components/ExoVideoPlayer';
import { getStreamProxyUrl } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

export const PlayerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { title, videoUrl, isLive } = route.params;

  // Process stream URL through proxy if needed
  const finalStreamUrl = getStreamProxyUrl(videoUrl);

  return (
    <View style={styles.container}>
      <ExoVideoPlayer
        videoUrl={finalStreamUrl}
        title={title}
        isLive={isLive}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
