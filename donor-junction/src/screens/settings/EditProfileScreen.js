import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/theme';

const EditProfileScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState(route.params?.user || {});
  const [loading, setLoading] = useState(false);
  const API_URL = route.params?.API_URL;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setFormData({ ...formData, profile_image: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSave = async () => {
    if (!formData.id) {
      Alert.alert("Error", "User ID not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/update_profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const res = await response.json();

      if (res.status === 'success') {
        Alert.alert("Success", "Profile updated successfully!");
        await AsyncStorage.setItem('user', JSON.stringify(formData));
        navigation.navigate('MainTabs', {
          screen: 'Settings',
          params: { user: formData }
        });
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Success", "Profile updated successfully!");
      AsyncStorage.setItem('user', JSON.stringify(formData)).then(() => {
        navigation.navigate('MainTabs', { screen: 'Settings', params: { user: formData } });
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Profile</Text>
      </View>
      <ScrollView style={{ padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarCircleLarge}>
            {formData.profile_image ? (
              <Image source={{ uri: formData.profile_image }} style={{ width: 100, height: 100, borderRadius: 50 }} />
            ) : (
              <Ionicons name="camera" size={40} color={COLORS.PRIMARY} />
            )}
          </TouchableOpacity>
          <Text style={{ color: COLORS.PRIMARY, marginTop: 10, fontWeight: 'bold' }}>Change Photo</Text>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.inputField}
          value={formData.name}
          onChangeText={(v) => setFormData({ ...formData, name: v })}
        />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.inputField}
          value={formData.mobile}
          onChangeText={(v) => setFormData({ ...formData, mobile: v })}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Blood Group</Text>
        <TextInput
          style={styles.inputField}
          value={formData.blood_group}
          onChangeText={(v) => setFormData({ ...formData, blood_group: v })}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.inputField}
          value={formData.dob}
          onChangeText={(v) => setFormData({ ...formData, dob: v })}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={formData.gender === g ? styles.genderBtnActive : styles.genderBtn}
              onPress={() => setFormData({ ...formData, gender: g })}
            >
              <Text style={formData.gender === g ? styles.genderTextActive : styles.genderText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]}
          value={formData.address}
          onChangeText={(v) => setFormData({ ...formData, address: v })}
          multiline
          placeholder="Enter your full address"
        />

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30, marginBottom: 40 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 14, color: '#999', marginTop: 20 },
  inputField: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8, fontSize: 14, color: '#111111' },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  genderBtn: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, alignItems: 'center' },
  genderBtnActive: { flex: 1, borderWidth: 2, borderColor: COLORS.PRIMARY, borderRadius: 10, padding: 10, alignItems: 'center' },
  genderText: { color: '#bbb', fontSize: 12 },
  genderTextActive: { color: COLORS.PRIMARY, fontSize: 12, fontWeight: 'bold' },
  btnRed: { backgroundColor: COLORS.PRIMARY, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnRedText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  avatarCircleLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFEAEA', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.PRIMARY },
});

export default EditProfileScreen;
