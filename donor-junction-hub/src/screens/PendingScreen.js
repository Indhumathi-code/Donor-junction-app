import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../constants/theme';

export default function PendingScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const loadMobile = async () => {
      const storedMobile = await AsyncStorage.getItem('loggedInMobile');
      if (storedMobile) {
        setMobile(storedMobile.replace(/[\s\-_]/g, ''));
      }
    };
    loadMobile();
  }, []);

  const handleCheckStatus = async () => {
    if (!mobile) {
      return Alert.alert('Error', 'Unable to retrieve your registration phone number.');
    }
    setChecking(true);
    try {
      // Premium loading delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await fetch(`${API_URL}/get_profile.php?mobile=${mobile}`);
      const resData = await response.json();

      let status = null;
      if (resData.status === 'success') {
        status = resData.organization?.status || 'pending';
      } else {
        status = await AsyncStorage.getItem(`orgStatus_${mobile}`);
      }

      if (status === 'approved') {
        await AsyncStorage.setItem(`orgStatus_${mobile}`, 'approved');
        Alert.alert(
          'Approved!',
          'Your organization registration has been approved by the Super Admin. Welcome to Donor Junction Hub!',
          [{ text: 'Enter Dashboard', onPress: () => navigation.replace('MainTabs') }]
        );
      } else if (status === 'declined') {
        await AsyncStorage.setItem('isLoggedIn', 'false');
        await AsyncStorage.setItem(`orgStatus_${mobile}`, 'declined');
        Alert.alert(
          'Registration Declined',
          'Your registration request has been declined by the Super Admin.',
          [{ text: 'OK', onPress: () => navigation.replace('Welcome') }]
        );
      } else {
        await AsyncStorage.setItem(`orgStatus_${mobile}`, 'pending');
        Alert.alert(
          'Still Pending',
          'Your request is still in the queue for Super Admin review. Please check back shortly.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      console.log('PendingScreen status check error:', e);
      Alert.alert('Network Error', 'Unable to check verification status. Please try again later.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.setItem('isLoggedIn', 'false');
    navigation.replace('Welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.clockIconContainer}>
          <Ionicons name="time" size={36} color={COLORS.AMBER_TEXT} />
        </View>

        <Text style={styles.title}>Under review</Text>
        <Text style={styles.description}>
          Your documents have been submitted.{"\n"}
          Verification takes 24–48 hours.
        </Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Progress</Text>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressStatus}>
            Documents received — Admin review pending
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCheckStatus}
          disabled={checking}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {checking ? 'Checking Status...' : 'Check Verification Status'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Cancel & Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  clockIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.AMBER_BG,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 20,
    backgroundColor: COLORS.AMBER_BG,
    borderRadius: 10,
    padding: 14,
    width: '100%',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.AMBER_TEXT,
    textAlign: 'center',
  },
  progressBarBg: {
    marginTop: 8,
    height: 6,
    backgroundColor: '#F5DBB0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '40%',
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  progressStatus: {
    fontSize: 10,
    color: '#854F0B',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 48,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    elevation: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  logoutButtonText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
  },
});
