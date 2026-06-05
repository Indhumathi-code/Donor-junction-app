import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Image, Alert, ActivityIndicator, Switch, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#DA0037';

export const CertificatesScreen = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
};

export const NotificationsScreen = ({ navigation }) => {
  const [newRequests, setNewRequests] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [chatMessages, setChatMessages] = useState(true);
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const nr = await AsyncStorage.getItem('newRequests');
      const ua = await AsyncStorage.getItem('urgentAlerts');
      const cm = await AsyncStorage.getItem('chatMessages');
      const rm = await AsyncStorage.getItem('reminders');
      if (nr !== null) setNewRequests(JSON.parse(nr));
      if (ua !== null) setUrgentAlerts(JSON.parse(ua));
      if (cm !== null) setChatMessages(JSON.parse(cm));
      if (rm !== null) setReminders(JSON.parse(rm));
    } catch (e) { }
  };

  const saveSetting = async (key, value, setter) => {
    setter(value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Notifications</Text>
      </View>
      <View style={{ padding: 20 }}>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>New requests near you</Text>
          <Switch
            value={newRequests}
            onValueChange={(v) => saveSetting('newRequests', v, setNewRequests)}
            trackColor={{ false: "#eee", true: PRIMARY_COLOR }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Urgent alerts</Text>
          <Switch
            value={urgentAlerts}
            onValueChange={(v) => saveSetting('urgentAlerts', v, setUrgentAlerts)}
            trackColor={{ false: "#eee", true: PRIMARY_COLOR }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Chat messages</Text>
          <Switch
            value={chatMessages}
            onValueChange={(v) => saveSetting('chatMessages', v, setChatMessages)}
            trackColor={{ false: "#eee", true: PRIMARY_COLOR }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Donation reminders</Text>
          <Switch
            value={reminders}
            onValueChange={(v) => saveSetting('reminders', v, setReminders)}
            trackColor={{ false: "#eee", true: PRIMARY_COLOR }}
          />
        </View>
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
        // Pass the updated user object back to the Settings screen
        navigation.navigate('MainTabs', {
          screen: 'Settings',
          params: { user: formData }
        });
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed. Make sure XAMPP is running.");
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export const SettingsScreen = ({ navigation, route }) => {
  const user = route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' };
  const API_URL = route.params?.API_URL;
  const [postCount, setPostCount] = useState(0);
  const [donationCount, setDonationCount] = useState(0);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  useEffect(() => {
    if (user.mobile && API_URL) {
      // Dynamic count of user posts
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

      {/* Curved Header Background */}
      <View style={styles.newHeader}>
        <View style={styles.archBackground} />

        {/* Profile Avatar overlapping the arch boundary */}
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
            <Ionicons name="pencil" size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 20, alignItems: 'center', backgroundColor: '#F5F5F5' }}
      >
        <Text style={styles.userNameText}>{user.name}</Text>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.cornerDecorator, { bottom: -15, left: -15 }]} />
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>Post</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.cornerDecorator, { top: -15, right: -15 }]} />
            <Text style={styles.statNumber}>{donationCount}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>
        </View>

        {/* Card Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Posts')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="paper-plane-outline" size={20} color={PRIMARY_COLOR} />
              </View>
              <Text style={styles.menuText}>Post</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Certificates')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="ribbon-outline" size={20} color={PRIMARY_COLOR} />
              </View>
              <Text style={styles.menuText}>Certification</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Chat')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="chatbubbles-outline" size={20} color={PRIMARY_COLOR} />
              </View>
              <Text style={styles.menuText}>Chat</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('LocationSettings')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="location-outline" size={20} color={PRIMARY_COLOR} />
              </View>
              <Text style={styles.menuText}>Location settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="notifications-outline" size={20} color={PRIMARY_COLOR} />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, { marginBottom: 30 }]} onPress={() => navigation.replace('Welcome')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="log-out-outline" size={20} color={PRIMARY_COLOR} />
              </View>
              <Text style={[styles.menuText, { color: PRIMARY_COLOR }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topBar: { backgroundColor: PRIMARY_COLOR, padding: 20, paddingTop: 30 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  topBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  //   newHeader: {
  //     height: 180,
  //     backgroundColor: PRIMARY_COLOR,
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //     position: 'relative',
  //     zIndex: 10,
  //     elevation: 5,
  //   },
  //   archBackground: {
  //   position: 'absolute',
  //   bottom: -60,
  //   left: '-50%',
  //   width: '200%',
  //   height: 120,
  //   borderTopLeftRadius: 200,
  //   borderTopRightRadius: 200,
  //   backgroundColor: '#F5F5F5',
  // },


  newHeader: {
    height: 160,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  archBackground: {
    position: 'absolute',
    bottom: -520,
    width: 600,
    height: 600,
    borderRadius: 300,
    alignSelf: 'center',
    backgroundColor: '#F5F5F5',
  },

  avatarWrapper: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  avatarCircleGreen: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF0F0',
    borderWidth: 3,
    borderColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: PRIMARY_COLOR,
    fontSize: 28,
    fontWeight: 'bold',
  },
  editPencil: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#fff',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    zIndex: 12,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: 'bold',
  },
  cornerDecorator: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(218, 0, 55, 0.15)',
  },
  menuContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },

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















