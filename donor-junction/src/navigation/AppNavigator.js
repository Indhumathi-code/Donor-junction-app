import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import PostsScreen from '../screens/PostsScreen';
import ChatScreen from '../screens/ChatScreen';
import TipsScreen from '../screens/TipsScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import { SettingsScreen, EditProfileScreen, CertificatesScreen, NotificationsScreen, LocationSettingsScreen } from '../screens/settings/SettingsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import CampaignsScreen from '../screens/CampaignsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

import CurvedTabBar from '../components/navigation/CurvedTabBar';

const HomeStack = createStackNavigator();
const HomeStackScreen = ({ route }) => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} initialParams={{ user: route.params?.user }} />
    <HomeStack.Screen name="Map" component={MapScreen} />
    <HomeStack.Screen name="Chat" component={ChatScreen} />
    <HomeStack.Screen name="Tips" component={TipsScreen} />
    <HomeStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    <HomeStack.Screen name="Certificates" component={CertificatesScreen} />
  </HomeStack.Navigator>
);

const SettingsStack = createStackNavigator();
const SettingsStackScreen = ({ route }) => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} initialParams={{ user: route.params?.user, API_URL }} />
    <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} initialParams={{ API_URL }} />
    <SettingsStack.Screen name="LocationSettings" component={LocationSettingsScreen} />
    <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
    <SettingsStack.Screen name="MyPosts" component={MyPostsScreen} />
    <SettingsStack.Screen name="Campaigns" component={CampaignsScreen} />
    <SettingsStack.Screen name="Chat" component={ChatScreen} />
    <SettingsStack.Screen name="Certificates" component={CertificatesScreen} />
  </SettingsStack.Navigator>
);

const MainTabs = ({ route }) => (
  <Tab.Navigator
    initialRouteName="Home"
    tabBar={(props) => <CurvedTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Posts" component={PostsScreen} />
    <Tab.Screen name="Home" component={HomeStackScreen} initialParams={{ user: route.params?.user }} />
    <Tab.Screen name="Settings" component={SettingsStackScreen} initialParams={{ user: route.params?.user }} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
    <Stack.Screen name="Schedule" component={ScheduleScreen} />
    <Stack.Screen name="CreatePost" component={CreatePostScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
