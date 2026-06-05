import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../../constants/theme';
import * as Location from 'expo-location';

const LocationSettingsScreen = ({ navigation }) => {
  const [useLocation, setUseLocation] = useState(true);
  const [showNearby, setShowNearby] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const location = await AsyncStorage.getItem('useLocation');
      const nearby = await AsyncStorage.getItem('showNearby');
      const savedLat = await AsyncStorage.getItem('user_lat');
      const savedLng = await AsyncStorage.getItem('user_lng');

      if (location !== null) setUseLocation(JSON.parse(location));
      if (nearby !== null) setShowNearby(JSON.parse(nearby));
      if (savedLat && savedLng) {
        setCurrentCoords({ latitude: parseFloat(savedLat), longitude: parseFloat(savedLng) });
      }
    } catch (e) { }
  };

  const updateLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      setLoading(false);
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      setCurrentCoords(loc.coords);
      await AsyncStorage.setItem('user_lat', loc.coords.latitude.toString());
      await AsyncStorage.setItem('user_lng', loc.coords.longitude.toString());

      // Sync to backend database
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        await fetch(`${API_URL}/update_profile.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          })
        });
      }

      Alert.alert('Success', 'Location updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
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
            trackColor={{ false: "#eee", true: COLORS.PRIMARY }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Show me to nearby hospitals</Text>
          <Switch
            value={showNearby}
            onValueChange={toggleNearby}
            trackColor={{ false: "#eee", true: COLORS.PRIMARY }}
          />
        </View>

        <TouchableOpacity
          style={{ marginTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.PRIMARY, padding: 15, borderRadius: 8 }}
          onPress={updateLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="locate" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Update Current Location</Text>
            </>
          )}
        </TouchableOpacity>

        {currentCoords && (
          <Text style={{ marginTop: 15, color: '#666', textAlign: 'center' }}>
            Current: {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingsRowText: { fontSize: 17, color: '#333' },
});

export default LocationSettingsScreen;
