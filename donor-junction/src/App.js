import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './navigation/AppNavigator';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';

// Component that consumes the LoadingContext and renders the overlay
function AppContent() {
  const { isLoading } = useLoading();

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
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
