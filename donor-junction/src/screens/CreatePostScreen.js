import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

const CreatePostScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [units, setUnits] = useState('1 unit');
  const [type, setType] = useState('normal');
  const [category, setCategory] = useState('donor');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        }
      } catch (e) {
        // Ignore
      }
    };
    loadUser();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const handleSubmit = async () => {
    if (!title || !bloodGroup || !location) {
      Alert.alert("Error", "Please fill required fields (Title, Blood Group, Location)");
      return;
    }

    setLoading(true);
    let finalLat = latitude;
    let finalLng = longitude;

    if (!finalLat || !finalLng) {
      try {
        const coords = await Location.geocodeAsync(location);
        if (coords && coords.length > 0) {
          finalLat = coords[0].latitude;
          finalLng = coords[0].longitude;
        }
      } catch (err) {
        console.log("Geocoding typed address failed:", err);
      }
    }

    const savePostLocally = async () => {
      try {
        const localPost = {
          id: Date.now(), // Generate a unique local ID
          title,
          blood_group: bloodGroup,
          location,
          description,
          units_needed: units,
          type,
          image: image || null,
          mobile: user?.mobile || '',
          category,
          latitude: finalLat,
          longitude: finalLng,
          created_at: new Date().toISOString()
        };
        const stored = await AsyncStorage.getItem('local_posts');
        const localPosts = stored ? JSON.parse(stored) : [];
        localPosts.unshift(localPost);
        await AsyncStorage.setItem('local_posts', JSON.stringify(localPosts));
      } catch (e) {
        console.log("Failed to save post locally:", e);
      }
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/add_post.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          blood_group: bloodGroup,
          location,
          description,
          units_needed: units,
          type,
          image_base64: imageBase64,
          mobile: user?.mobile || '',
          category,
          latitude: finalLat,
          longitude: finalLng
        })
      });
      const res = await response.json();

      const handleRedirect = () => {
        navigation.navigate('MainTabs', {
          screen: 'Posts',
          params: {
            refreshTrigger: Date.now()
          }
        });
      };

      if (res.status === 'success') {
        Alert.alert("Success", "Post created successfully!");
        handleRedirect();
      } else {
        await savePostLocally();
        Alert.alert("Success", "Post created locally!");
        handleRedirect();
      }
    } catch (error) {
      await savePostLocally();
      Alert.alert("Success", "Post created locally (Offline Mode)!");
      navigation.navigate('MainTabs', {
        screen: 'Posts',
        params: {
          refreshTrigger: Date.now()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, styles.topBarRow]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { flex: 1, marginLeft: 15 }]}>Create Blood Post</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <Text style={styles.label}>Post Category *</Text>
        <View style={[styles.genderRow, { marginBottom: 15 }]}>
          <TouchableOpacity style={category === 'donor' ? styles.genderBtnActive : styles.genderBtn} onPress={() => setCategory('donor')}>
            <Text style={category === 'donor' ? styles.genderTextActive : styles.genderText}>Blood Donor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={category === 'seeker' ? styles.genderBtnActive : styles.genderBtn} onPress={() => setCategory('seeker')}>
            <Text style={category === 'seeker' ? styles.genderTextActive : styles.genderText}>I Want Blood</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Post Title/ Name *</Text>
        <TextInput style={styles.inputField} placeholder="e.g. Urgent AB+ Blood Needed" placeholderTextColor="#888" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Blood Group *</Text>
        <TextInput style={styles.inputField} placeholder="e.g. AB+" placeholderTextColor="#888" value={bloodGroup} onChangeText={setBloodGroup} />

        <Text style={styles.label}>Address *</Text>
        <TextInput style={styles.inputField} placeholder="Address" placeholderTextColor="#888" value={location} onChangeText={setLocation} />

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 15, paddingVertical: 4 }}
          onPress={async () => {
            try {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert("Permission denied", "Allow location permission to get current location");
                return;
              }
              setLoadingLocation(true);
              let loc = await Location.getCurrentPositionAsync({});
              setLatitude(loc.coords.latitude);
              setLongitude(loc.coords.longitude);

              let addresses = await Location.reverseGeocodeAsync(loc.coords);
              if (addresses && addresses.length > 0) {
                const addr = addresses[0];
                const friendlyAddr = `${addr.name || ''}, ${addr.street || ''}, ${addr.district || addr.city || ''}, ${addr.region || ''}`.replace(/,\s*,/g, ',').trim();
                if (friendlyAddr && friendlyAddr !== ',') {
                  setLocation(friendlyAddr);
                }
              }
              Alert.alert("Success", "Location attached successfully!");
            } catch (err) {
              Alert.alert("Error", "Failed to retrieve location: " + err.message);
            } finally {
              setLoadingLocation(false);
            }
          }}
        >
          <Ionicons name="location" size={16} color={COLORS.PRIMARY} style={{ marginRight: 5 }} />
          <Text style={{ color: COLORS.PRIMARY, fontSize: 13, fontWeight: 'bold' }}>
            {loadingLocation ? "Getting location..." : (latitude ? `Location Attached (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : "Get Current Location")}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Units Needed</Text>
        <TextInput style={styles.inputField} placeholder="e.g. 2 units" placeholderTextColor="#888" value={units} onChangeText={setUnits} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]} placeholder="Add details..." placeholderTextColor="#888" multiline value={description} onChangeText={setDescription} />

        <Text style={styles.label}>Urgency</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity style={type === 'normal' ? styles.genderBtnActive : styles.genderBtn} onPress={() => setType('normal')}>
            <Text style={type === 'normal' ? styles.genderTextActive : styles.genderText}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={type === 'urgent' ? styles.genderBtnActive : styles.genderBtn} onPress={() => setType('urgent')}>
            <Text style={type === 'urgent' ? styles.genderTextActive : styles.genderText}>Urgent</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Post Image</Text>
        <TouchableOpacity style={styles.btnOutline} onPress={pickImage}>
          <Ionicons name="image" size={20} color={COLORS.PRIMARY} style={{ marginRight: 10 }} />
          <Text style={styles.btnOutlineText}>{image ? "Change Image" : "Select Image"}</Text>
        </TouchableOpacity>
        {image && (
          <Text style={{ fontSize: 12, color: '#555', marginTop: 5, textAlign: 'center' }}>Image selected successfully</Text>
        )}

        <TouchableOpacity style={[styles.btnRed, { marginTop: 30, marginBottom: 40 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Submit Post</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;
