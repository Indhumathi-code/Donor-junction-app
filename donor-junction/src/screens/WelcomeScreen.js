import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/theme';

const WelcomeScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLogin = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        navigation.replace('MainTabs', { user: JSON.parse(storedUser) });
      }
    };
    checkLogin();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      <View style={styles.welcomeTop}>
        <View style={styles.welcomeLogo}>
          <Image source={require('../assets/images/donor_junction_logo.jpeg')} style={{ width: 100, height: 100, borderRadius: 25 }} resizeMode="cover" />
        </View>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubTitle}>Save lives. Donate blood.</Text>
      </View>

      <View style={styles.welcomeBottom}>
        <TouchableOpacity
          style={styles.btnRed}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnRedText}>Login / Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutlineWelcome}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="eye-outline" size={20} color={COLORS.PRIMARY} style={{ marginRight: 8 }} />
          <Text style={styles.btnOutlineTextWelcome}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.guestNoteWelcome}>Guest: browse only. OTP needed to donate.</Text>
      </View>
    </View>
  );
};

export default WelcomeScreen;
