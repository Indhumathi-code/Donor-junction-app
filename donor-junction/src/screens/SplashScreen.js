import React, { useEffect } from 'react';
import { View, Text, Image, StatusBar, ActivityIndicator } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/theme';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    try {
      ExpoSplashScreen.hideAsync();
    } catch (e) {
      // Ignore if not on native environment
    }

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Image source={require('../assets/images/splash.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );
};

export default SplashScreen;
