import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleanedMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
    if (cleanedMobile.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/user_login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanedMobile })
      });
      const res = await response.json();

      if (res.status === 'success') {
        const isRegistered = res.exists === true;
        if (isRegistered) {
          Alert.alert("Success", "OTP sent: " + res.otp);
          navigation.navigate('OTP', { mobile: cleanedMobile });
        } else {
          navigation.navigate('Register', { mobile: cleanedMobile });
        }
      } else {
        Alert.alert("Error", res.message || res.error || "An unknown error occurred.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Cannot reach the server to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Login</Text>
        <Text style={styles.topBarSub}>Enter your mobile number</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.inputContainer}>
          <Text style={{ color: '#aaa', fontSize: 16 }}>+91 </Text>
          <TextInput
            style={styles.input}
            placeholder="your Number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            maxLength={10}
          />
        </View>
        <Text style={styles.infoText}>OTP will be sent via Fast2SMS</Text>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30 }]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.btnRedText}>Send OTP</Text>}
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

export default LoginScreen;
