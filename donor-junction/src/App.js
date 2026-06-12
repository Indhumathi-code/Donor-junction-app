import React, { useState, useRef } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './navigation/AppNavigator';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { GlobalLoader } from './components/common/GlobalLoader';

import GlobalVideoLoader from './components/GlobalVideoLoader';

// Component that consumes the LoadingContext and renders the overlay
function AppContent() {
  const { isLoading } = useLoading();
  const [isNavigating, setIsNavigating] = useState(false);
  const routeNameRef = useRef();
  const navigationRef = useRef();
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          routeNameRef.current = navigationRef.current.getCurrentRoute().name;
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = navigationRef.current.getCurrentRoute().name;

          if (previousRouteName !== currentRouteName) {
            setIsNavigating(true);
            setTimeout(() => {
              setIsNavigating(false);
            }, 600);
          }
          routeNameRef.current = currentRouteName;
        }}
      >
        <AppNavigator />
      </NavigationContainer>
      <GlobalLoader />
      {isNavigating && <GlobalVideoLoader />}
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
