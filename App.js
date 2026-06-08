import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import MapView, { Marker, PROVIDER_GOOGLE } from './components/MapModule';
import * as Location from 'expo-location';
import { COLORS, API_URL } from './src/constants/theme';
import {
  SettingsScreen,
  EditProfileScreen,
  CertificatesScreen,
  NotificationsScreen,
  LocationSettingsScreen
} from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

// Web alert polyfill
if (Platform.OS === 'web') {
  Alert.alert = (title, message) => {
    alert(title + "\n\n" + message);
  };
}



// Constants
const PRIMARY_COLOR = '#DA0037';
const SECONDARY_COLOR = '#111111';
const BACKGROUND_COLOR = '#FFFFFF';
const { width, height } = Dimensions.get('window');

// API URL is now imported from theme.js

// --- SHARED COMPONENTS ---

const Badge = ({ children, color = '#ffeaea', textColor = '#A32D2D' }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={[styles.badgeText, { color: textColor }]}>{children}</Text>
  </View>
);

const Card = ({ children, style, onPress }) => (
  <TouchableOpacity
    style={[styles.card, style]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    {children}
  </TouchableOpacity>
);

// --- SCREENS ---

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    try {
      ExpoSplashScreen.hideAsync();
    } catch (e) {
      // Ignore if not on native environment
    }

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      <View style={styles.splashLogoContainer}>
        <Ionicons name="water" size={70} color="#fff" />
      </View>
      <Text style={styles.splashTitle}>Donor Junction</Text>
      <Text style={styles.splashSubTitle}>Every drop counts</Text>
      <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 40 }} />
    </View>
  );
};

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

      {/* Top Half: Crimson Red Background */}
      <View style={styles.welcomeTop}>
        <View style={styles.welcomeLogo}>
          <Ionicons name="water" size={55} color="#fff" />
        </View>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubTitle}>Save lives. Donate blood.</Text>
      </View>

      {/* Bottom Half: Action Buttons */}
      <View style={styles.welcomeBottom}>
        <TouchableOpacity
          style={styles.btnRed}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnRedText}>Login / Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutlineWelcome}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="eye-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 8 }} />
          <Text style={styles.btnOutlineTextWelcome}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.guestNoteWelcome}>Guest: browse only. OTP needed to donate.</Text>
      </View>
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    console.log("Attempting to send OTP to:", mobile);
    console.log("Using API_URL:", API_URL);

    if (mobile.length < 10) {
      Alert.alert("Error", "Please enter a valid mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const res = await response.json();

      if (res.status === 'success') {
        Alert.alert("Success", "OTP sent: " + res.otp); // Show mock OTP for testing
        navigation.navigate('OTP', { mobile });
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Connection Error", "Check if XAMPP is running and IP is correct");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Login</Text>
        <Text style={styles.topBarSub}>Enter your mobile number</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.inputContainer}>
          <Text style={{ color: '#aaa', fontSize: 16 }}>+91 </Text>
          <TextInput
            style={styles.input}
            placeholder="your Number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            maxLength={10}
          />
        </View>
        <Text style={styles.infoText}>OTP will be sent via Fast2SMS</Text>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30 }]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Send OTP</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGray, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnGrayText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const OTPScreen = ({ navigation, route }) => {
  const { mobile } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert("Error", "Please enter 4-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/verify_otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otp.trim() })
      });
      const res = await response.json();

      if (res.status === 'success') {
        if (res.is_registered) {
          navigation.replace('MainTabs', { user: res.user });
        } else {
          navigation.navigate('Register', { mobile });
        }
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Verify OTP</Text>
        <Text style={styles.topBarSub}>Sent to +91 {mobile}</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>Enter 4-digit OTP</Text>
        <TextInput
          style={styles.inputField}
          placeholder="OTPS"
          keyboardType="number-pad"
          maxLength={4}
          value={otp}
          onChangeText={setOtp}
        />
        <Text style={styles.resendText}>Resend OTP in 28s</Text>

        <View style={styles.blueInfoBox}>
          <Ionicons name="information-circle" size={16} color="#0C447C" />
          <Text style={styles.blueInfoText}>New user? Registration opens after verify.</Text>
        </View>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30 }]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Verify & Continue</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGray, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnGrayText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const RegisterScreen = ({ navigation, route }) => {
  const { mobile } = route.params;
  const [formData, setFormData] = useState({
    name: '',
    blood_group: 'B+',
    dob: '',
    gender: 'Male',
    last_donation_date: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.city) {
      Alert.alert("Error", "Please fill name and city");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mobile })
      });
      const res = await response.json();

      if (res.status === 'success') {
        Alert.alert("Success", "Account created!");
        navigation.replace('MainTabs', { user: { ...formData, id: res.user_id, mobile } });
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Create profile</Text>
        <Text style={styles.topBarSub}>One-time registration</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Your Name"
          onChangeText={(v) => setFormData({ ...formData, name: v })}
        />

        <Text style={styles.label}>Blood group</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Your Blood Group"
          onChangeText={(v) => setFormData({ ...formData, blood_group: v })}
        />

        <Text style={styles.label}>Date of birth</Text>
        <TextInput
          style={styles.inputField}
          placeholder="YYYY-MM-DD"
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
          placeholder="Your City"
          onChangeText={(v) => setFormData({ ...formData, city: v })}
        />

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30, marginBottom: 40 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Complete Registration</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const HomeScreen = ({ navigation, route }) => {
  const user = route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, styles.topBarRow]}>
        <View>
          <Text style={styles.topBarTitle}>Hello, {user.name} <Badge color="rgba(255,255,255,.2)" textColor="#fff">{user.blood_group}</Badge></Text>
          <Text style={styles.topBarSub}>Eligible to donate • {user.city}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
          <View style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {/* Notification Badge Dot */}
            <View style={{
              position: 'absolute',
              right: -2,
              top: -2,
              backgroundColor: '#FFEB3B', // Yellow for high visibility or Red
              width: 10,
              height: 10,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: PRIMARY_COLOR
            }} />
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.shortcutGrid}>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Map')}>
            <Ionicons name="location" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.shortcutText}>Find donors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Posts')}>
            <Ionicons name="document-text" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.shortcutText}>Blood posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.shortcutText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Tips')}>
            <Ionicons name="heart" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.shortcutText}>Health tips</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Urgent near you</Text>
        <Card style={{ marginHorizontal: 15 }} onPress={() => navigation.navigate('Posts')}>
          <Text style={styles.cardTitle}>A+ blood needed</Text>
          <Text style={styles.cardSub}>Apollo Hospital, Chennai • 2.1 km</Text>
          <Badge color="#ffeaea" textColor="#A32D2D">Urgent</Badge>
        </Card>

        <Text style={styles.sectionTitle}>Your stats</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#ffeaea' }]}>
            <Text style={[styles.statValue, { color: '#A32D2D' }]}>3</Text>
            <Text style={[styles.statLabel, { color: '#A32D2D' }]}>donations</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#eaf3de' }]}>
            <Text style={[styles.statValue, { color: '#27500A' }]}>152</Text>
            <Text style={[styles.statLabel, { color: '#27500A' }]}>days since last</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const PostsScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/get_posts.php`);
      const res = await response.json();
      if (res.status === 'success') {
        setPosts(res.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, styles.topBarRow]}>
        <View>
          <Text style={styles.topBarTitle}>Blood posts</Text>
          <Text style={styles.topBarSub}>Community requests</Text>
        </View>
        <TouchableOpacity onPress={loadPosts}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={{ marginHorizontal: 15, marginTop: 10 }} onPress={() => navigation.navigate('Schedule', { post: item })}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Badge color={item.type === 'urgent' ? '#ffeaea' : '#eaf3de'} textColor={item.type === 'urgent' ? '#A32D2D' : '#27500A'}>
                  {item.type.toUpperCase()}
                </Badge>
              </View>
              <Text style={styles.cardSub}>{item.location} • {item.distance}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Badge color="#e6f1fb" textColor="#0C447C">{item.blood_group}</Badge>
                {item.units_needed && <Badge color="#faeeda" textColor="#633806">{item.units_needed}</Badge>}
              </View>
            </Card>
          )}
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
};

const ScheduleScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('2025-06-15');
  const [time, setTime] = useState('9:00 AM');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/schedule_donation.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, // HARDCODED for demo, should come from global state
          post_id: post.id,
          scheduled_date: date,
          scheduled_time: time
        })
      });
      const res = await response.json();
      if (res.status === 'success') {
        navigation.navigate('Confirmation', { date, time, location: post.location });
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Schedule donation</Text>
        <Text style={styles.topBarSub}>{post.location}</Text>
      </View>
      <View style={{ padding: 20 }}>
        <View style={styles.urgentAlert}>
          <Text style={styles.urgentAlertTitle}>{post.title}</Text>
          <Text style={styles.urgentAlertSub}>{post.units_needed} needed</Text>
        </View>

        <Text style={styles.label}>Select date</Text>
        <TextInput style={styles.inputField} value={date} onChangeText={setDate} />

        <Text style={styles.label}>Select time</Text>
        <View style={styles.timeRow}>
          {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'].map((t) => (
            <TouchableOpacity
              key={t}
              style={time === t ? styles.timeBtnActive : styles.timeBtn}
              onPress={() => setTime(t)}
            >
              <Text style={time === t ? styles.timeTextActive : styles.timeText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRedText}>Confirm Donation</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGray, { marginTop: 10, zIndex: 10 }]}
          onPress={() => navigation.navigate('Posts')}
          activeOpacity={0.7}
        >
          <Text style={styles.btnGrayText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- REST OF SCREENS (STYLING ONLY FOR DEMO) ---

const TN_ZONES = [
  { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { name: 'Madurai Zone', lat: 9.9252, lng: 78.1198 },
  { name: 'Coimbatore West', lat: 11.0168, lng: 76.9558 },
  { name: 'Trichy North', lat: 10.7905, lng: 78.7047 },
  { name: 'Salem East', lat: 11.6643, lng: 78.1460 },
];

const MapScreen = () => {
  const [currentZone] = useState(() => TN_ZONES[Math.floor(Math.random() * TN_ZONES.length)]);
  const [region] = useState({
    latitude: currentZone.lat,
    longitude: currentZone.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [markers] = useState(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      title: i % 2 === 0 ? `Donor #${i + 100}` : `Hospital #${i + 50}`,
      blood: i % 2 === 0 ? ['A+', 'B+', 'O+', 'AB-'][i % 4] : 'Emergency Center',
      lat: currentZone.lat + (Math.random() - 0.5) * 0.04,
      lng: currentZone.lng + (Math.random() - 0.5) * 0.04,
      type: i % 2 === 0 ? 'donor' : 'hospital'
    }));
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, styles.topBarRow]}>
        <View>
          <Text style={styles.topBarTitle}>{currentZone.name}</Text>
          <Text style={styles.topBarSub}>Live tracking in TN</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsUserLocation={true}
        >
          {markers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              title={marker.title}
              description={`Type: ${marker.blood}`}
            >
              <View style={[styles.customPin, { backgroundColor: marker.type === 'donor' ? PRIMARY_COLOR : '#378ADD' }]}>
                <Ionicons name={marker.type === 'donor' ? "water" : "business"} size={16} color="#fff" />
              </View>
              <View style={styles.pinArrow} />
            </Marker>
          ))}
        </MapView>

        <View style={styles.mapLegend}>
          <View style={styles.liveDot} />
          <Text style={{ fontSize: 12, marginLeft: 5, fontWeight: 'bold' }}>
            {markers.length} Active in this zone
          </Text>
        </View>
      </View>

      <View style={styles.mapFilters}>
        <TouchableOpacity style={styles.chip}>
          <Ionicons name="water" size={14} color="#A32D2D" />
          <Text style={styles.chipText}>Donors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, { backgroundColor: '#e6f1fb' }]}>
          <Ionicons name="business" size={14} color="#0C447C" />
          <Text style={[styles.chipText, { color: '#0C447C' }]}>Hospitals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const ConfirmationScreen = ({ route, navigation }) => (
  <View style={styles.confirmContainer}>
    <View style={styles.successCircle}><Ionicons name="checkmark" size={40} color="#27500A" /></View>
    <Text style={styles.confirmTitle}>Donation confirmed!</Text>
    <Text style={styles.confirmSub}>{route.params.date} • {route.params.time}{"\n"}{route.params.location}</Text>
    <View style={{ width: '80%', marginTop: 30, zIndex: 10 }}>
      <TouchableOpacity
        style={styles.btnRed}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        activeOpacity={0.7}
      >
        <Text style={styles.btnRedText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const globalChatMessages = {
  '1': [
    { id: '1', text: 'Hello! Welcome to Apollo Hospital. How can we assist you with blood donation today?', sender: 'hospital' }
  ],
  '2': [
    { id: '1', text: 'Hello! Welcome to Vadamalayan Hospital. How can we assist you with blood donation today?', sender: 'hospital' }
  ],
  '3': [
    { id: '1', text: 'Hello! Welcome to Meenakshi Mission. How can we assist you with blood donation today?', sender: 'hospital' }
  ]
};

const ChatScreen = ({ navigation, route }) => {
  const user = route.params?.user || { name: 'Donor' };

  const chatThreads = [
    { id: '1', name: 'Apollo Hospital', lastMessage: 'Hello! Welcome to Apollo Hospital. How can we assist you with blood donation today?', time: '9:49 AM', unread: 0, online: true },
    { id: '2', name: 'Vadamalayan Hospital', lastMessage: 'Hello! Welcome to Vadamalayan Hospital. How can we assist you with blood donation today?', time: 'Yesterday', unread: 0, online: false },
    { id: '3', name: 'Meenakshi Mission', lastMessage: 'Hello! Welcome to Meenakshi Mission. How can we assist you with blood donation today?', time: 'Monday', unread: 0, online: true },
  ];
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.topBarTitle}>Chats</Text>
        <Ionicons name="search" size={20} color="#fff" />
      </View>
      <FlatList
        data={chatThreads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatListItem}
            onPress={() => navigation.navigate('ChatRoom', { hospitalName: item.name, online: item.online, threadId: item.id, user })}
          >
            <View style={styles.chatListAvatar}>
              <Text style={styles.chatListAvatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
              <View style={[styles.listStatusDot, { backgroundColor: item.online ? '#4CD964' : '#999' }]} />
            </View>
            <View style={styles.chatListContent}>
              <View style={styles.chatListHeader}>
                <Text style={styles.chatListName}>{item.name}</Text>
                <Text style={item.unread > 0 ? styles.chatListTimeUnread : styles.chatListTime}>{item.time}</Text>
              </View>
              <View style={styles.chatListHeader}>
                <Text style={styles.chatListMessage} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const ChatRoomScreen = ({ route, navigation }) => {
  const { hospitalName = "Apollo Hospital", online = true, threadId = '1' } = route.params || {};
  const flatListRef = useRef(null);

  const user = route.params?.user || { name: 'Donor' };

  // Load messages from global dictionary
  const [messages, setMessagesState] = useState(() => {
    let threadMsgs = globalChatMessages[threadId] || [];
    // Replace placeholder with actual name
    return threadMsgs.map(m => ({
      ...m,
      text: m.text.replace('Arjun', user.name)
    }));
  });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Automatically scroll to bottom when messages list or typing status changes
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages, isTyping]);

  const sendMessage = () => {
    const userText = inputText.trim();
    if (!userText) return;

    // 1. Send user's message immediately and fast
    const newUserMessage = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessagesState(prev => [...prev, newUserMessage]);
    globalChatMessages[threadId] = [...(globalChatMessages[threadId] || []), newUserMessage];

    setInputText('');
    setIsTyping(true);

    // 2. Reply after simulated typing delay (reduced to 800ms for faster, snappier replies!)
    setTimeout(() => {
      let botResponse = "Thank you for your message! Our coordinator will review it and get back to you shortly.";
      const lowerText = userText.toLowerCase();

      if (lowerText.includes('hi') || lowerText.includes('hello')) {
        botResponse = `Hello there! Thank you for contacting ${hospitalName}. How can we help you with your blood donation or request today?`;
      } else if (lowerText.includes('donate') || lowerText.includes('available') || lowerText.includes('schedule')) {
        botResponse = "Excellent! We have multiple blood donation slots available this week. Please let us know your blood group and preferred time.";
      } else if (lowerText.includes('blood') || lowerText.includes('group') || lowerText.includes('a+') || lowerText.includes('b+') || lowerText.includes('o+') || lowerText.includes('ab+')) {
        botResponse = "We have high demand for blood donors right now. You can schedule an appointment by clicking 'Blood posts' or replying with your preferred date!";
      } else if (lowerText.includes('thank') || lowerText.includes('thanks')) {
        botResponse = "You're very welcome! Together we save lives. ❤️";
      }

      const newBotMessage = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'hospital' };
      setMessagesState(prev => [...prev, newBotMessage]);
      globalChatMessages[threadId] = [...(globalChatMessages[threadId] || []), newBotMessage];
      setIsTyping(false);
    }, 800);
  };

  const clearChat = () => {
    globalChatMessages[threadId] = [];
    setMessagesState([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View style={[styles.topBar, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>{hospitalName.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.chatTitle}>{hospitalName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <View style={[styles.miniStatusDot, { backgroundColor: online ? '#4CD964' : '#999' }]} />
                <Text style={styles.chatSubTitle}>{online ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          </View>
          {/* Clear Chat Button */}
          <TouchableOpacity onPress={clearChat} style={{ padding: 5 }}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.sender === 'user' ? styles.messageUser : styles.messageHospital
            ]}>
              <Text style={item.sender === 'user' ? styles.messageTextUser : styles.messageTextHospital}>
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={isTyping ? (
            <View style={[styles.messageBubble, styles.messageHospital, { paddingVertical: 8, marginTop: 5 }]}>
              <Text style={[styles.messageTextHospital, { fontStyle: 'italic', color: '#888' }]}>typing...</Text>
            </View>
          ) : null}
        />

        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const TipsScreen = ({ navigation }) => {
  const tips = [
    {
      id: 1,
      title: "Drink plenty of water before donating",
      desc: "Hydration helps faster recovery",
      color: "#DA0037",
    },
    {
      id: 2,
      title: "Eat iron-rich foods 24hrs before donation",
      desc: "Spinach, lentils, red meat are great",
      color: "#1D9E75",
    },
    {
      id: 3,
      title: "Wait 56 days between whole blood donations",
      desc: "Your body needs time to replenish",
      color: "#378ADD",
    },
    {
      id: 4,
      title: "Avoid alcohol 24 hours before donating",
      desc: "Alcohol affects blood quality",
      color: "#FFC107",
    },
    {
      id: 5,
      title: "Rest for 10-15 mins after donation",
      desc: "Reduces dizziness risk",
      color: "#DA0037",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Health tips</Text>
        <Text style={styles.topBarSub}>Donation & wellness advice</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 15 }}>
        {tips.map((tip) => (
          <View key={tip.id} style={[styles.tipCard, { borderLeftColor: tip.color }]}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipDesc}>{tip.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
// --- NAVIGATION ---

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const activeRouteName = state.routes[state.index].name;
  const cutoutColor = activeRouteName === 'Settings' ? '#F5F5F5' : '#FFFFFF';

  return (
    <View style={styles.customTabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName = 'home';
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Map') iconName = 'location';
        else if (route.name === 'Posts') iconName = 'document-text';
        else if (route.name === 'Chat') iconName = 'chatbubble';
        else if (route.name === 'Settings') iconName = 'settings';

        return (
          <View key={route.key} style={styles.tabItemContainer}>
            {isFocused && (
              <>
                <View style={[styles.cutoutCircle, { backgroundColor: cutoutColor }]} />
                <TouchableOpacity
                  onPress={onPress}
                  style={styles.activeTabBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name={iconName} size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}
            
            {!isFocused && (
              <TouchableOpacity
                onPress={onPress}
                style={styles.inactiveTabBtn}
                activeOpacity={0.6}
              >
                <Ionicons name={iconName} size={22} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};

const MainTabs = ({ route }) => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} initialParams={{ user: route.params?.user }} />
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="Posts" component={PostsScreen} />
    <Tab.Screen name="Chat" component={ChatScreen} initialParams={{ user: route.params?.user }} />
    <Tab.Screen name="Settings" component={SettingsScreen} initialParams={{ user: route.params?.user, API_URL }} />
  </Tab.Navigator>
);

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Tips" component={TipsScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} initialParams={{ API_URL }} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="Certificates" component={CertificatesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="LocationSettings" component={LocationSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  splashContainer: { flex: 1, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' },
  splashLogoContainer: { width: 110, height: 110, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  splashTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  splashSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, fontWeight: '500' },
  welcomeTop: {
    flex: 0.6,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
  },
  welcomeLogo: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  welcomeSubTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 8,
  },
  welcomeBottom: {
    flex: 0.4,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  btnOutlineWelcome: {
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    flexDirection: 'row',
  },
  btnOutlineTextWelcome: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: '600',
  },
  guestNoteWelcome: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
  },
  btnRed: { backgroundColor: PRIMARY_COLOR, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  btnRedText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnOutline: { height: 50, borderRadius: 12, borderWidth: 2, borderColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginTop: 15, flexDirection: 'row' },
  btnOutlineText: { color: PRIMARY_COLOR, fontSize: 16, fontWeight: '600' },
  btnGray: { backgroundColor: '#f0f0f0', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnGrayText: { color: '#555', fontSize: 16, fontWeight: '500' },
  guestNote: { color: '#bbb', fontSize: 12, textAlign: 'center', marginTop: 15 },
  topBar: { backgroundColor: PRIMARY_COLOR, padding: 20, paddingTop: 30 },
  topBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  topBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  label: { fontSize: 14, color: '#999', marginTop: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10 },
  input: { flex: 1, fontSize: 16, color: '#1a1a1a' },
  infoText: { fontSize: 12, color: '#bbb', marginTop: 10 },
  inputField: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8, fontSize: 14 },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  genderBtn: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, alignItems: 'center' },
  genderBtnActive: { flex: 1, borderWidth: 2, borderColor: PRIMARY_COLOR, borderRadius: 10, padding: 10, alignItems: 'center' },
  genderText: { color: '#bbb', fontSize: 12 },
  genderTextActive: { color: PRIMARY_COLOR, fontSize: 12, fontWeight: 'bold' },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  shortcutItem: { width: (width - 40) / 2, backgroundColor: '#f8f8f8', padding: 20, margin: 5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  shortcutText: { fontSize: 12, color: '#555', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', padding: 15, color: '#999' },
  card: { backgroundColor: '#f8f8f8', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  cardSub: { fontSize: 12, color: '#999', marginTop: 5 },
  cardDesc: { fontSize: 12, color: '#555', marginTop: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFooter: { flexDirection: 'row', marginTop: 10, gap: 5 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginBottom: 20 },
  statBox: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 10, marginTop: 2 },
  mapPlaceholder: { flex: 1, backgroundColor: '#e4ede4', position: 'relative' },
  customPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pinArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    alignSelf: 'center',
    marginTop: -2
  },
  pin: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  mapLegend: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  mapFilters: { flexDirection: 'row', padding: 15, gap: 10, backgroundColor: '#fff' },
  chip: { backgroundColor: '#ffeaea', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5, elevation: 2 },
  chipText: { fontSize: 13, color: '#A32D2D', fontWeight: 'bold' },

  urgentAlert: { backgroundColor: '#ffeaea', padding: 15, borderRadius: 12, marginTop: 10 },
  urgentAlertTitle: { color: '#A32D2D', fontWeight: 'bold', fontSize: 14 },
  urgentAlertSub: { color: '#A32D2D', fontSize: 12, marginTop: 2 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  timeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  timeBtnActive: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 2, borderColor: PRIMARY_COLOR },
  timeText: { color: '#bbb', fontSize: 12 },
  timeTextActive: { color: PRIMARY_COLOR, fontSize: 12, fontWeight: 'bold' },
  confirmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  successCircle: { width: 80, height: 80, backgroundColor: '#eaf3de', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  confirmSub: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  settingText: { flex: 1, fontSize: 14, marginLeft: 15 },
  chatAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chatAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  chatTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chatSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, marginBottom: 15 },
  messageHospital: { backgroundColor: '#f2f2f2', alignSelf: 'flex-start' },
  messageUser: { backgroundColor: PRIMARY_COLOR, alignSelf: 'flex-end' },
  messageTextHospital: { color: '#111', fontSize: 14, lineHeight: 20 },
  messageTextUser: { color: '#fff', fontSize: 14, lineHeight: 20 },
  chatInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 55,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa', marginRight: 10 },
  chatSendBtn: { width: 45, height: 45, backgroundColor: PRIMARY_COLOR, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  chatListItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  chatListAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chatListAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  chatListContent: { flex: 1 },
  chatListHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  chatListName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  chatListTime: { fontSize: 12, color: '#999' },
  chatListTimeUnread: { fontSize: 12, color: '#25D366', fontWeight: 'bold' },
  chatListMessage: { fontSize: 14, color: '#666', flex: 1, marginRight: 10 },
  unreadBadge: { backgroundColor: '#25D366', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
  },
  miniStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  listStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BACKGROUND_COLOR,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CD964',
    marginRight: 2,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  tipCard: {

    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 5,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tipDesc: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  
  customTabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cutoutCircle: {
    position: 'absolute',
    top: -24,
    width: 62,
    height: 62,
    borderRadius: 31,
    zIndex: 1,
  },
  activeTabBtn: {
    position: 'absolute',
    top: -16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  inactiveTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});
