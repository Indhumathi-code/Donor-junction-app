import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import SmallSupermanLoader from '../components/SmallSupermanLoader';
import * as Location from 'expo-location';

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

const RegisterScreen = ({ navigation, route }) => {
  const { mobile } = route.params || {};
  const [formData, setFormData] = useState({
    name: '',
    blood_group: 'B+',
    dob: '',
    gender: 'Male',
    last_donation_date: '',
    address: '',
    city: '',
    pincode: ''
  });

  useEffect(() => {
    if (!mobile) {
      navigation.replace('Login');
    }
  }, [mobile, navigation]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      
      // Attempt reverse geocoding to auto-fill fields
      try {
        let geocode = await Location.reverseGeocodeAsync(loc.coords);
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setFormData({ 
            ...formData, 
            address: place.street || place.name || formData.address,
            city: place.city || place.subregion || formData.city,
            pincode: place.postalCode || formData.pincode
          });
          return;
        }
      } catch (e) {
        console.log('Reverse geocoding failed:', e);
      }
      
      setFormData({ ...formData, city: `Salem (My Location)` });
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.city) {
      Alert.alert("Error", "Please fill name and city");
      return;
    }

    setLoading(true);
    let finalLat = location?.latitude;
    let finalLon = location?.longitude;
    
    // Fallback geocoding if GPS location wasn't captured
    if (!finalLat || !finalLon) {
      try {
        const query = `${formData.address || ''}, ${formData.city}, ${formData.pincode || ''}`;
        let geocodeResult = await Location.geocodeAsync(query);
        if (geocodeResult && geocodeResult.length > 0) {
          finalLat = geocodeResult[0].latitude;
          finalLon = geocodeResult[0].longitude;
        } else {
          // Fallback to nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'DonorJunctionApp/1.0' } });
          const data = await res.json();
          if (data && data.length > 0) {
            finalLat = parseFloat(data[0].lat);
            finalLon = parseFloat(data[0].lon);
          }
        }
      } catch (e) {
        console.log('Geocoding fallback failed:', e);
      }
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mobile, latitude: finalLat, longitude: finalLon })
      });
      const res = await response.json();

      if (res.status === 'success') {
        Alert.alert("Success", "Account created!");
        const newUser = res.user ? {
          ...res.user,
          latitude: res.user.latitude ?? finalLat,
          longitude: res.user.longitude ?? finalLon
        } : { ...formData, id: res.user_id, mobile, latitude: finalLat, longitude: finalLon };
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        navigation.replace('MainTabs', { user: newUser });
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to register account. Please try again.");
      console.error('RegisterScreen error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Create profile</Text>
        <Text style={styles.topBarSub}>One-time registration</Text>
      </View>
      <KeyboardAwareScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Your Name"
          placeholderTextColor="#888"
          onChangeText={(v) => setFormData({ ...formData, name: v })}
        />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={[styles.inputField, { backgroundColor: '#eee', color: '#888' }]}
          value={'+91 ' + mobile}
          editable={false}
        />

        <Text style={styles.label}>Blood group</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Your Blood Group"
          placeholderTextColor="#888"
          onChangeText={(v) => setFormData({ ...formData, blood_group: v })}
        />

        <Text style={styles.label}>Date of birth</Text>
        <TextInput
          style={styles.inputField}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
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
          style={styles.inputField}
          placeholder="Your Area/Street Address"
          placeholderTextColor="#888"
          value={formData.address}
          onChangeText={(v) => setFormData({ ...formData, address: v })}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Your City"
          placeholderTextColor="#888"
          value={formData.city}
          onChangeText={(v) => setFormData({ ...formData, city: v })}
        />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Your Pincode"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          value={formData.pincode}
          onChangeText={(v) => setFormData({ ...formData, pincode: v })}
        />

        <TouchableOpacity
          style={[styles.btnGray, { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={getLocation}
        >
          <Ionicons name="location" size={16} color="#333" style={{ marginRight: 5 }} />
          <Text style={styles.btnGrayText}>{location ? "Location Captured!" : "Get Accurate Location"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30, marginBottom: 40 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <SmallSupermanLoader /> : <Text style={styles.btnRedText}>Complete Registration</Text>}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
