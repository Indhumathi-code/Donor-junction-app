import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AnimatedBloodLoader({ visible, onFinish }) {
  const flyX = useRef(new Animated.Value(-300)).current;
  const flyY = useRef(new Animated.Value(height + 200)).current;

  useEffect(() => {
    if (visible) {
      // Reset the values so it starts from the right place
      flyX.setValue(-600);
      flyY.setValue(height + 200);

      // Loop the animation so it keeps flying if loading takes a while
      const animation = Animated.loop(
        Animated.parallel([
          Animated.timing(flyX, {
            toValue: width + 300,
            duration: 1500, // Faster loop
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(flyY, {
            toValue: -600,
            duration: 1500, // Faster loop
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      // Cleanup when it hides
      return () => {
        animation.stop();
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.Image
        source={require('../assets/images/blood_superman.png')}
        style={[
          styles.image,
          {
            transform: [
              { translateX: flyX },
              { translateY: flyY },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
    elevation: 99999,
  },

  image: {
    width: 680,
    height: 680,
    position: 'absolute',
  },
});