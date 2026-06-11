import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './navigation/AppNavigator';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { GlobalLoader } from './components/common/GlobalLoader';

// Component that consumes the LoadingContext and renders the overlay
function AppContent() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <GlobalLoader />
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
