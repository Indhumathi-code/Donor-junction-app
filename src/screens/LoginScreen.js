import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { COLORS, API_URL } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (mobile.length < 10) {
      Alert.alert("Error", "Please enter 10 digit number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      if (data.status === 'success') {
        Alert.alert("OTP Sent", "Your OTP is: " + data.otp);
        navigation.navigate('OTP', { mobile });
      }
    } catch (e) {
      Alert.alert("Error", "Server not responding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subTitle}>Enter your mobile number</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>+91 </Text>
          <TextInput 
            style={styles.input} 
            placeholder="98765 43210" 
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={setMobile}
          />
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
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
  inputContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 10 },
  prefix: { fontSize: 16, color: '#aaa' },
  input: { flex: 1, fontSize: 16 },
  btn: { backgroundColor: COLORS.PRIMARY, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
