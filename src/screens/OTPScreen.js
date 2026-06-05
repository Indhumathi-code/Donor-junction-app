import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { COLORS, API_URL } from '../constants/theme';

export default function OTPScreen({ navigation, route }) {
  const { mobile } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert("Error", "Enter 4 digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify_otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otp.trim() })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.is_registered) {
          navigation.replace('MainTabs', { user: data.user });
        } else {
          navigation.navigate('Register', { mobile });
        }
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (e) {
      Alert.alert("Error", "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subTitle}>Sent to +91 {mobile}</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Enter 4-digit OTP</Text>
        <TextInput 
          style={styles.inputField} 
          placeholder="X X X X" 
          keyboardType="number-pad" 
          maxLength={4}
          onChangeText={setOtp}
        />
        <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 40 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  label: { color: '#999', marginTop: 20 },
  inputField: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8 },
  btn: { backgroundColor: COLORS.PRIMARY, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
