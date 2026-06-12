import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, StatusBar, Image, Alert, Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmallSupermanLoader from '../../components/SmallSupermanLoader';

const AddCertificateScreen = ({ navigation, route }) => {
  const [title, setTitle] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [date, setDate] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const { API_URL } = route.params || {};

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!title || !issuedBy || !date) {
      Alert.alert("Error", "Please fill in all the details.");
      return;
    }

    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user || !user.mobile) {
        Alert.alert("Error", "User session not found.");
        setLoading(false);
        return;
      }

      const payload = {
        mobile: user.mobile,
        title,
        issued_by: issuedBy,
        date,
        image_base64: imageBase64
      };

      const response = await fetch(`${API_URL}/add_certificate.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      if (res.status === 'success') {
        Alert.alert("Success", "Certificate added successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", res.message || "Failed to add certificate.");
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed. Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={{ flex: 1, backgroundColor: '#EAEAEA' }}>
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Add Certificate</Text>
          </View>
        </View>

        <KeyboardAwareScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={20}
        >
          <Text style={styles.label}>Certificate Title</Text>
          <TextInput
            style={styles.inputField}
            placeholder="e.g., Star Donor Award"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Issued By</Text>
          <TextInput
            style={styles.inputField}
            placeholder="e.g., Red Cross Society"
            value={issuedBy}
            onChangeText={setIssuedBy}
          />

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.inputField}
            placeholder="e.g., June 2026"
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.label}>Certificate Image (Optional)</Text>
          <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.PRIMARY} />
                <Text style={{ color: COLORS.PRIMARY, marginTop: 10 }}>Tap to upload image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnRed, { marginTop: 30, marginBottom: 40 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <SmallSupermanLoader /> : <Text style={styles.btnRedText}>Save Certificate</Text>}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.PRIMARY },
  topBar: { 
    backgroundColor: COLORS.PRIMARY, 
    padding: 15, 
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 14, color: '#999', marginTop: 20, fontWeight: 'bold' },
  inputField: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8, fontSize: 14 },
  imagePickerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginTop: 8,
    minHeight: 120,
    overflow: 'hidden',
    borderStyle: 'dashed'
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  btnRed: { backgroundColor: COLORS.PRIMARY, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnRedText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AddCertificateScreen;
