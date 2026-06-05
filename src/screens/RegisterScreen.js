import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { COLORS, API_URL } from '../constants/theme';

export default function RegisterScreen({ navigation, route }) {
  const { mobile } = route.params;
  const [formData, setFormData] = useState({ name: '', blood_group: 'B+', city: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.city) {
      Alert.alert("Error", "Fill name and city");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mobile })
      });
      const data = await res.json();
      if (data.status === 'success') {
        navigation.replace('MainTabs', { user: { ...formData, id: data.user_id, mobile } });
      }
    } catch (e) {
      Alert.alert("Error", "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}><Text style={styles.title}>Create profile</Text></View>
      <ScrollView style={{ padding: 20 }}>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.inputField} placeholder="Your Name" onChangeText={(v) => setFormData({...formData, name: v})} />
        <Text style={styles.label}>Blood group</Text>
        <TextInput style={styles.inputField} placeholder="Your Blood Group" onChangeText={(v) => setFormData({...formData, blood_group: v})} />
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.inputField} placeholder="Your City" onChangeText={(v) => setFormData({...formData, city: v})} />
        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Registration</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 40 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  label: { color: '#999', marginTop: 20 },
  inputField: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8 },
  btn: { backgroundColor: COLORS.PRIMARY, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
