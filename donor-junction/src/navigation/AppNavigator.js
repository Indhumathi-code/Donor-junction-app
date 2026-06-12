import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import BlogScreen from '../screens/BlogScreen';
import ChatScreen from '../screens/ChatScreen';
import TipsScreen from '../screens/TipsScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import { SettingsScreen, EditProfileScreen, CertificatesScreen, NotificationsScreen, LocationSettingsScreen } from '../screens/settings/SettingsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import AddCertificateScreen from '../screens/settings/AddCertificateScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

import CurvedTabBar from '../components/navigation/CurvedTabBar';

const MainTabs = ({ route }) => (
  <Tab.Navigator
    initialRouteName="Home"
    tabBar={(props) => <CurvedTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
    sceneContainerStyle={{ backgroundColor: 'transparent' }}
  >
    <Tab.Screen name="Blog" component={BlogScreen} />
    <Tab.Screen name="Home" component={HomeScreen} initialParams={{ user: route.params?.user }} />
    <Tab.Screen name="Settings" component={SettingsScreen} initialParams={{ user: route.params?.user, API_URL }} />
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
    
    {/* All Detail Screens in the Root Stack to hide Bottom Tab Bar */}
    <Stack.Screen name="Map" component={MapScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Tips" component={TipsScreen} />
    <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    <Stack.Screen name="Certificates" component={CertificatesScreen} />
    <Stack.Screen name="Posts" component={PostsScreen} />
    
    <Stack.Screen name="EditProfile" component={EditProfileScreen} initialParams={{ API_URL }} />
    <Stack.Screen name="LocationSettings" component={LocationSettingsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="MyPosts" component={MyPostsScreen} />
    <Stack.Screen name="Campaigns" component={CampaignsScreen} />
    <Stack.Screen name="AddCertificate" component={AddCertificateScreen} initialParams={{ API_URL }} />
    
    <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
    <Stack.Screen name="Schedule" component={ScheduleScreen} />
    <Stack.Screen name="CreatePost" component={CreatePostScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
