import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../components/MapModule';
import { COLORS } from '../constants/theme';

const TN_ZONES = [
  { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { name: 'Madurai Zone', lat: 9.9252, lng: 78.1198 },
];

export default function MapScreen() {
  const [currentZone] = useState(TN_ZONES[0]);
  const region = {
    latitude: currentZone.lat,
    longitude: currentZone.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>{currentZone.name}</Text>
        <Text style={styles.subTitle}>Live Rapido-style tracking</Text>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
      >
        <Marker coordinate={{ latitude: currentZone.lat, longitude: currentZone.lng }} title="You are here" />
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  map: { flex: 1 }
});
