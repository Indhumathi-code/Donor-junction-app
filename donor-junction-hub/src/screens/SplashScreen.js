import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    const checkSessionAndRedirect = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const mobile = await AsyncStorage.getItem('loggedInMobile');

        if (isLoggedIn === 'true' && mobile) {
          const cleaned = mobile.replace(/[\s\-_]/g, '');
          const status = cleaned === '9840012345' ? 'approved' : (await AsyncStorage.getItem(`orgStatus_${cleaned}`) || 'approved');

          if (status === 'approved') {
            navigation.replace('MainTabs');
          } else if (status === 'pending') {
            navigation.replace('Pending');
          } else {
            // declined
            await AsyncStorage.setItem('isLoggedIn', 'false');
            Alert.alert(
              'Access Denied',
              'Your organization registration request has been declined by the Super Admin.',
              [{ text: 'OK' }]
            );
            navigation.replace('Welcome');
          }
        } else {
          navigation.replace('Welcome');
        }
      } catch (error) {
        navigation.replace('Welcome');
      }
    };

    const timer = setTimeout(() => {
      checkSessionAndRedirect();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image 
          source={require('../../assets/images/donor_logo.png')} 
          style={styles.logo} 
        />
        <Text style={styles.title}>Donor Junction Hub</Text>
        <Text style={styles.subtitle}>For Hospitals & NGOs</Text>

        {/* Progress line indicator */}
        <View style={styles.loader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
    borderRadius: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 6,
    textAlign: 'center',
  },
  loader: {
    marginTop: 40,
    width: 32,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
  },
});
