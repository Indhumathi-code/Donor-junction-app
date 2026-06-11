import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLoading } from '../../contexts/LoadingContext';

export const GlobalLoader = () => {
  const { isLoading } = useLoading();
  
  const player = useVideoPlayer(require('../../assets/videos/loader.mp4'), player => {
    player.loop = true;
  });

  React.useEffect(() => {
    if (isLoading && player) {
      player.currentTime = 0;
      player.play();
    }
  }, [isLoading, player]);

  if (!isLoading) return null;

  return (
    <Modal transparent={true} visible={isLoading} animationType="fade">
      <View style={styles.overlay}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#ffffff', // changed to solid white or whatever background matches the video
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
