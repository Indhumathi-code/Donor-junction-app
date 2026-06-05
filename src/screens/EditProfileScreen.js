import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function EditProfileScreen({ navigation, route }) {
  const [formData, setFormData] = useState(route.params?.user || {});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/update_profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        Alert.alert("Success", "Profile updated!");
        navigation.navigate('MainTabs', { user: formData });
      }
    } catch (e) { Alert.alert("Error", "Update failed"); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.inputField} value={formData.name} onChangeText={(v) => setFormData({...formData, name: v})} />
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.inputField} value={formData.city} onChangeText={(v) => setFormData({...formData, city: v})} />
        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  label: { color: '#999', marginTop: 20 },
  inputField: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8 },
  btn: { backgroundColor: COLORS.PRIMARY, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
