import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

const SmallSupermanLoader = () => {
  const flyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flyAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flyAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const translateY = flyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5], // Small hover
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/blood_superman.png')}
        style={[styles.image, { transform: [{ translateY }] }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 28,
    height: 28,
  },
});

export default SmallSupermanLoader;
