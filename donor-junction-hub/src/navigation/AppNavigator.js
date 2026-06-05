import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PendingScreen from '../screens/PendingScreen';
import HomeScreen from '../screens/HomeScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import NewCampaignScreen from '../screens/NewCampaignScreen';
import CampaignDoneScreen from '../screens/CampaignDoneScreen';
import DonorMapScreen from '../screens/DonorMapScreen';
import DonorListScreen from '../screens/DonorListScreen';
import InquiryScreen from '../screens/InquiryScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SuperAdminScreen from '../screens/SuperAdminScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Campaigns') {
          iconName = focused ? 'megaphone' : 'megaphone-outline';
        } else if (route.name === 'Map') {
          iconName = focused ? 'location' : 'location-outline';
        } else if (route.name === 'Chat') {
          iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.PRIMARY,
      tabBarInactiveTintColor: COLORS.GRAY,
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 0.5,
        borderTopColor: COLORS.BORDER,
        height: 60,
        paddingBottom: 8,
        paddingTop: 6,
        backgroundColor: '#FFFFFF',
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
      }
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Campaigns" component={CampaignsScreen} />
    <Tab.Screen name="Map" component={DonorMapScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
    {/* Auth & Setup Stack */}
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Pending" component={PendingScreen} />

    {/* Main Bottom Tabs */}
    <Stack.Screen name="MainTabs" component={MainTabs} />

    {/* Detail Screens */}
    <Stack.Screen name="NewCampaign" component={NewCampaignScreen} />
    <Stack.Screen name="CampaignDone" component={CampaignDoneScreen} />
    <Stack.Screen name="DonorList" component={DonorListScreen} />
    <Stack.Screen name="Inquiry" component={InquiryScreen} />
    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    <Stack.Screen name="SuperAdmin" component={SuperAdminScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
