import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './navigation/AppNavigator';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import AnimatedBloodLoader from './components/AnimatedBloodLoader';

// Component that consumes the LoadingContext and renders the overlay
function AppContent() {
  const { isLoading, showLoading, hideLoading } = useLoading();
  const routeNameRef = React.useRef();
  const navigationRef = React.useRef();

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

          if (previousRouteName !== currentRouteName && currentRouteName) {
            // Trigger the loading animation for each page navigation
            showLoading();
            setTimeout(() => {
              hideLoading();
            }, 3050); // Matches the new 3 second loading timing
          }

          routeNameRef.current = currentRouteName;
        }}
      >
        <AppNavigator />
      </NavigationContainer>
      {/* Global loading overlay that stays on top of navigation */}
      <AnimatedBloodLoader visible={isLoading} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
}
