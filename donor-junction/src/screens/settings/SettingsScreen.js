import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Image, Alert, Switch, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../constants/theme';
import SmallSupermanLoader from '../../components/SmallSupermanLoader';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#DA0037';

export const CertificatesScreen = ({ navigation }) => (
  <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
    <View style={{ flex: 1, backgroundColor: '#EAEAEA' }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Certificates</Text>
      </View>
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Ionicons name="ribbon-outline" size={80} color={PRIMARY_COLOR} style={{ marginTop: 50 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>No certificates yet</Text>
        <Text style={{ color: '#999', textAlign: 'center', marginTop: 10 }}>Donate blood to earn certificates and badges!</Text>
      </View>
    </View>
  </SafeAreaView>
);

export const LocationSettingsScreen = ({ navigation }) => {
  const [useLocation, setUseLocation] = useState(true);
  const [showNearby, setShowNearby] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const location = await AsyncStorage.getItem('useLocation');
      const nearby = await AsyncStorage.getItem('showNearby');
      if (location !== null) setUseLocation(JSON.parse(location));
      if (nearby !== null) setShowNearby(JSON.parse(nearby));
    } catch (e) { }
  };

  const toggleLocation = async (value) => {
    setUseLocation(value);
    await AsyncStorage.setItem('useLocation', JSON.stringify(value));
  };

  const toggleNearby = async (value) => {
    setShowNearby(value);
    await AsyncStorage.setItem('showNearby', JSON.stringify(value));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      <View style={{ flex: 1, backgroundColor: '#EAEAEA' }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Location Settings</Text>
        </View>
        <View style={{ padding: 20 }}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsRowText}>Use current location</Text>
            <Switch
              value={useLocation}
              onValueChange={toggleLocation}
              trackColor={{ false: "#eee", true: PRIMARY_COLOR }}
            />
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsRowText}>Show me to nearby hospitals</Text>
            <Switch
              value={showNearby}
              onValueChange={toggleNearby}
              trackColor={{ false: "#eee", true: PRIMARY_COLOR }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export const NotificationsScreen = ({ navigation }) => {
  const notifications = [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      <View style={{ flex: 1, backgroundColor: '#EAEAEA' }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Notifications</Text>
        </View>
        <ScrollView style={{ padding: 15 }} contentContainerStyle={notifications.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : {}}>
          {notifications.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={{ marginTop: 15, fontSize: 16, color: '#999' }}>No new notifications yet</Text>
            </View>
          ) : (
            notifications.map((notif) => (
              <View key={notif.id} style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                  <Ionicons name={notif.icon} size={20} color={PRIMARY_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>{notif.title}</Text>
                    <Text style={{ fontSize: 12, color: '#999' }}>{notif.time}</Text>
                  </View>
                  <Text style={{ color: '#666', lineHeight: 20 }}>{notif.message}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export const EditProfileScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState(route.params?.user || {});
  const [loading, setLoading] = useState(false);
  const API_URL = route.params?.API_URL;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
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
        Alert.alert("Error", res.message || res.error || JSON.stringify(res));
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed. Make sure XAMPP is running. Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      <View style={{ flex: 1, backgroundColor: '#EAEAEA' }}>
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
                <Ionicons name="camera" size={40} color={PRIMARY_COLOR} />
              )}
            </TouchableOpacity>
            <Text style={{ color: PRIMARY_COLOR, marginTop: 10, fontWeight: 'bold' }}>Change Photo</Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.inputField}
            value={formData.name}
            onChangeText={(v) => setFormData({ ...formData, name: v })}
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

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.inputField}
            value={formData.city}
            onChangeText={(v) => setFormData({ ...formData, city: v })}
          />

          <TouchableOpacity
            style={[styles.btnRed, { marginTop: 30, marginBottom: 40 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <SmallSupermanLoader /> : <Text style={styles.btnRedText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

import { useFocusEffect } from '@react-navigation/native';
import { useLoading } from '../../contexts/LoadingContext';

export const SettingsScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' });
  const { showLoading, hideLoading } = useLoading();

  useFocusEffect(
    React.useCallback(() => {
      const loadUser = async () => {
        showLoading();
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          } else if (route.params?.user) {
            setUser(route.params.user);
          }
        } catch (e) {
          console.log('Failed to load user', e);
        } finally {
          setTimeout(hideLoading, 1500);
        }
      };
      loadUser();
    }, [route.params?.user])
  );
  const API_URL = route.params?.API_URL;
  const [postCount, setPostCount] = useState(0);
  const [donationCount, setDonationCount] = useState(0);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  useEffect(() => {
    if (user.mobile && API_URL) {
      fetch(`${API_URL}/get_posts.php?mobile=${user.mobile}`)
        .then(res => res.json())
        .then(res => {
          if (res.status === 'success' && res.data) {
            setPostCount(res.data.length);
          }
        })
        .catch(err => console.log(err));
    }
  }, [user.mobile, API_URL]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      navigation.replace('Welcome');
    } catch (e) {
      console.log('Error clearing async storage on logout:', e);
      navigation.replace('Welcome');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

      {/* 100% Android-safe SVG Curve */}
      <View style={{ position: 'absolute', top: 160, left: 0, right: 0, zIndex: 1 }}>
        <Svg height="80" width={width} viewBox={`0 0 ${width} 80`}>
          <Path
            d={`M0,80 Q${width / 2},-80 ${width},80 Z`}
            fill="#EAEAEA"
          />
        </Svg>
        <View style={{ width: '100%', height: 1000, backgroundColor: '#EAEAEA' }} />
      </View>

      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 20, alignItems: 'center', paddingBottom: 100 }}
      >
        {/* Profile Avatar sitting exactly at the peak of the curve */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircleGreen}>
            {user.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile', { user, API_URL })}
            style={styles.editPencil}
          >
            <MaterialCommunityIcons name="pencil" size={25} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userNameText}>{user.name}</Text>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.ringOuterLeft} />
            <View style={styles.ringInnerLeft} />
            <View style={styles.redCoreLeft} />
            <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>{postCount === 0 ? "11" : postCount}</Text>
            <Text style={styles.statLabel}>Post</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.ringOuterRight} />
            <View style={styles.ringInnerRight} />
            <View style={styles.redCoreRight} />
            <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>{donationCount}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('MyPosts')}>
            <MaterialCommunityIcons name="hand-heart-outline" size={48} color={PRIMARY_COLOR} style={styles.menuIcon} />
            <Text style={styles.menuText}>Post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Certificates')}>
            <MaterialCommunityIcons name="certificate-outline" size={48} color={PRIMARY_COLOR} style={styles.menuIcon} />
            <Text style={styles.menuText}>Certification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Chat')}>
            <MaterialCommunityIcons name="chat-outline" size={48} color={PRIMARY_COLOR} style={styles.menuIcon} />
            <Text style={styles.menuText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, { marginBottom: 30 }]} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={48} color={PRIMARY_COLOR} style={styles.menuIcon} />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_COLOR },
  topBar: { backgroundColor: PRIMARY_COLOR, padding: 20, paddingTop: 15 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  topBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  avatarWrapper: {
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCircleGreen: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#71D38A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: PRIMARY_COLOR, fontSize: 32, fontWeight: 'bold' },
  editPencil: {
    position: 'absolute',
    right: -10,
    top: 5,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-20deg' }],
  },

  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', zIndex: 10 },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4, fontWeight: 'bold', zIndex: 10 },

  ringOuterLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EAEAEA',
  },
  ringInnerLeft: {
    position: 'absolute',
    bottom: -45,
    left: -45,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  redCoreLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY_COLOR,
  },

  ringOuterRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EAEAEA',
  },
  ringInnerRight: {
    position: 'absolute',
    top: -45,
    right: -45,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  redCoreRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY_COLOR,
  },

  menuContainer: { width: '100%', marginTop: 5 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuIcon: { marginRight: 20, width: 30, textAlign: 'center' },
  menuText: { fontSize: 16, fontWeight: 'bold', color: '#000' },

  profileSection: { flexDirection: 'row', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: '#fff' },
  avatarCircle: { width: 85, height: 85, borderRadius: 42.5, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: PRIMARY_COLOR, fontSize: 32, fontWeight: 'bold' },
  profileInfo: { marginLeft: 20 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#111', textTransform: 'uppercase' },
  profileDetail: { fontSize: 13, color: '#aaa', marginTop: 4, letterSpacing: 0.5 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingsRowText: { fontSize: 17, color: '#333' },
  label: { fontSize: 14, color: '#999', marginTop: 20 },
  inputField: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8, fontSize: 14 },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  genderBtn: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, alignItems: 'center' },
  genderBtnActive: { flex: 1, borderWidth: 2, borderColor: PRIMARY_COLOR, borderRadius: 10, padding: 10, alignItems: 'center' },
  genderText: { color: '#bbb', fontSize: 12 },
  genderTextActive: { color: PRIMARY_COLOR, fontSize: 12, fontWeight: 'bold' },
  btnRed: { backgroundColor: PRIMARY_COLOR, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnRedText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  avatarCircleLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFEAEA', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: PRIMARY_COLOR },
});
