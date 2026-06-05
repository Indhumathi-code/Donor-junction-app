import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { COLORS } from '../constants/theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    try { ExpoSplashScreen.hideAsync(); } catch (e) {}
    const timer = setTimeout(() => navigation.replace('Welcome'), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={styles.logoContainer}>
        <Ionicons name="water" size={60} color="#fff" />
      </View>
      <Text style={styles.title}>Donor Junction</Text>
      <Text style={styles.subTitle}>Every drop counts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { width: 110, height: 110, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },
});
