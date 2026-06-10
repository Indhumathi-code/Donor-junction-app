import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import SmallSupermanLoader from '../components/SmallSupermanLoader';

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

const OTPScreen = ({ navigation, route }) => {
  const { mobile } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mobile) {
      navigation.replace('Login');
    }
  }, [mobile, navigation]);

  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert("Error", "Please enter 4-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/verify_otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otp.trim() })
      });
      const res = await response.json();

      if (res.status === 'success') {
        if (res.is_registered) {
          await AsyncStorage.setItem('user', JSON.stringify(res.user));
          navigation.replace('MainTabs', { user: res.user });
        } else {
          navigation.navigate('Register', { mobile });
        }
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Connection Error", "Cannot reach the server to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Verify OTP</Text>
        <Text style={styles.topBarSub}>Sent to +91 {mobile}</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Enter 4-digit OTP</Text>
        <TextInput
          style={styles.inputField}
          placeholder="OTP"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          maxLength={4}
          value={otp}
          onChangeText={setOtp}
        />
        <Text style={styles.resendText}>Resend OTP in 28s</Text>

        <View style={styles.blueInfoBox}>
          <Ionicons name="information-circle" size={16} color="#0C447C" />
          <Text style={styles.blueInfoText}>New user? Registration opens after verify.</Text>
        </View>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30 }]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? <SmallSupermanLoader /> : <Text style={styles.btnRedText}>Verify & Continue</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGray, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnGrayText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OTPScreen;
