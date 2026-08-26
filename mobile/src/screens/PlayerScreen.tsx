import React from "react";
import { View, StyleSheet } from "react-native";
import NativeExoPlayer from "../components/NativeExoPlayer";
import { Movie } from "../types";

interface PlayerScreenProps {
  route: {
    params: {
      movie: Movie;
      initialProgress?: number;
      backendUrl?: string;
    };
  };
  navigation: any;
}

export default function PlayerScreen({ route, navigation }: PlayerScreenProps) {
  const { movie, initialProgress = 0, backendUrl } = route.params;

  return (
    <View style={styles.container}>
      <NativeExoPlayer
        movie={movie}
        initialProgress={initialProgress}
        onClose={() => navigation.goBack()}
        backendUrl={backendUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
