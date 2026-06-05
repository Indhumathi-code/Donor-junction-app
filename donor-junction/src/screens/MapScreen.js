import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/MapModule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const TN_ZONES = [
  { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { name: 'Madurai Zone', lat: 9.9252, lng: 78.1198 },
  { name: 'Coimbatore West', lat: 11.0168, lng: 76.9558 },
  { name: 'Trichy North', lat: 10.7905, lng: 78.7047 },
  { name: 'Salem East', lat: 11.6643, lng: 78.1460 },
];

const MapScreen = ({ navigation, route }) => {
  const user = route.params?.user;
  const [currentZone] = useState(() => TN_ZONES[0]); // Default to Chennai Central so seeded markers are visible
  const [districtName, setDistrictName] = useState(currentZone.name);
  const mapRef = useRef(null);

  const initialLat = user?.latitude || currentZone.lat;
  const initialLng = user?.longitude || currentZone.lng;

  const [region, setRegion] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  });

  const fetchMarkers = async () => {
    let dbMarkers = [];
    try {
      // Fetch Blood Posts
      const postsRes = await fetch(`${API_URL}/get_posts.php`).catch(() => null);
      if (postsRes) {
        const res = await postsRes.json();
        if (res.status === 'success' && res.data) {
          for (let p of res.data) {
            let lat = p.latitude ? parseFloat(p.latitude) : null;
            let lng = p.longitude ? parseFloat(p.longitude) : null;

            if ((!lat || !lng) && p.location) {
              try {
                const geo = await Location.geocodeAsync(p.location);
                if (geo && geo.length > 0) {
                  lat = geo[0].latitude;
                  lng = geo[0].longitude;
                }
              } catch (e) {
                // Ignore
              }
            }

            if (lat && lng) {
              dbMarkers.push({
                id: `post_${p.id}`,
                title: p.title || 'Unknown Donor',
                address: p.location,
                blood: `${p.blood_group} (${p.units_needed || '1 unit'})`,
                lat: lat,
                lng: lng,
                type: p.category === 'donor' ? 'donor' : 'donor' // Display blood posts as donors
              });
            }
          }
        }
      }

      // Fetch Hospitals / Blood Banks
      const locsRes = await fetch(`${API_URL}/get_locations.php`).catch(() => null);
      if (locsRes) {
        const res = await locsRes.json();
        if (res.status === 'success' && res.locations) {
          for (let loc of res.locations) {
            if (loc.latitude && loc.longitude) {
              dbMarkers.push({
                id: `loc_${loc.id}`,
                title: loc.name,
                address: loc.address,
                blood: loc.category || 'Hospital',
                lat: parseFloat(loc.latitude),
                lng: parseFloat(loc.longitude),
                type: loc.type === 'user' ? 'donor' : 'hospital',
                mobile: loc.mobile
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Error fetching map markers:", e);
    }
    setMarkers(dbMarkers);
  };

  const triggerExactLocation = async () => {
    try {
      await fetchMarkers();
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);

        try {
          let addresses = await Location.reverseGeocodeAsync(loc.coords);
          if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            const name = addr.district || addr.city || addr.subregion || 'My Location';
            setDistrictName(name);
          }
        } catch (e) {
          console.error("Error reverse geocoding:", e);
        }
      } else {
        const savedLat = await AsyncStorage.getItem('user_lat');
        const savedLng = await AsyncStorage.getItem('user_lng');
        if (savedLat && savedLng) {
          const centerLat = parseFloat(savedLat);
          const centerLng = parseFloat(savedLng);
          const newRegion = {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);

          try {
            let addresses = await Location.reverseGeocodeAsync({
              latitude: centerLat,
              longitude: centerLng
            });
            if (addresses && addresses.length > 0) {
              const addr = addresses[0];
              const name = addr.district || addr.city || addr.subregion || 'My Location';
              setDistrictName(name);
            }
          } catch (e) { }
        }
      }
    } catch (e) {
      console.error("Error getting live location:", e);
    }
  };

  useEffect(() => {
    const getLiveLocation = async () => {
      await fetchMarkers();
      await triggerExactLocation();
    };
    getLiveLocation();
  }, []);

  const [markers, setMarkers] = useState([]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'donors', 'hospitals'


  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2 - lat1) * (Math.PI / 180);
    var dLon = (lon2 - lon1) * (Math.PI / 180);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const activeMarkers = markers.filter(marker => {
    // 10km radius zone filter
    const distance = getDistanceFromLatLonInKm(
      region.latitude,
      region.longitude,
      marker.lat,
      marker.lng
    );
    if (distance > 10) {
      return false;
    }

    if (selectedFilter === 'donors') {
      return marker.type === 'donor';
    }
    if (selectedFilter === 'hospitals') {
      return marker.type === 'hospital';
    }
    return true;
  }); // Filter markers based on selection and 10km radius


  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, styles.topBarRow]}>
        <View>
          <Text style={styles.topBarTitle}>{districtName}</Text>
          <Text style={styles.topBarSub}>Live tracking in TN</Text>
        </View>
        <TouchableOpacity onPress={() => {
          triggerExactLocation();
          setRefreshKey(prev => prev + 1);
        }}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <MapView
          key={`${refreshKey}_${region.latitude}_${region.longitude}_${selectedFilter}`}
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsUserLocation={true}
          userLocation={{ latitude: region.latitude, longitude: region.longitude }}
          onChatPress={(name) => {
            const foundMarker = markers.find(m => m.title === name);
            if (foundMarker && foundMarker.mobile) {
              navigation.navigate('ChatRoom', { hospitalName: name, mobile: foundMarker.mobile, user: user });
            } else {
              navigation.navigate('ChatRoom', { hospitalName: name, user: user });
            }
          }}
        >
          <Marker
            key="user_location"
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            title="My Location"
            description="You are here"
          >
            <View style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#4CD964',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5
            }} />
          </Marker>

          {activeMarkers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              title={marker.title}
              description={marker.address ? `${marker.address} • ${marker.blood}` : `Type: ${marker.blood}`}
              type={marker.type}
            >
              <View style={[styles.customPin, { backgroundColor: marker.type === 'donor' ? COLORS.PRIMARY : '#0C447C' }]}>
                <Ionicons name={marker.type === 'donor' ? "water" : "business"} size={16} color="#fff" />
              </View>
              <View style={styles.pinArrow} />
            </Marker>
          ))}
        </MapView>

        <View style={styles.mapLegend}>
          <View style={styles.liveDot} />
          <Text style={{ fontSize: 12, marginLeft: 5, fontWeight: 'bold' }}>
            {activeMarkers.length} Active in this zone
          </Text>
        </View>
      </View>

      <View style={styles.mapFilters}>
        <TouchableOpacity 
          style={[styles.chip, selectedFilter === 'all' && { backgroundColor: '#e2e2e2' }]} 
          onPress={() => setSelectedFilter('all')}
        >
          <Ionicons name="apps" size={14} color="#555" />
          <Text style={[styles.chipText, { color: '#555' }, selectedFilter === 'all' && { fontWeight: 'bold' }]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chip, selectedFilter === 'donors' && { backgroundColor: '#ffeaea' }]} 
          onPress={() => setSelectedFilter('donors')}
        >
          <Ionicons name="water" size={14} color={selectedFilter === 'donors' ? COLORS.PRIMARY : '#A32D2D'} />
          <Text style={[styles.chipText, { color: selectedFilter === 'donors' ? COLORS.PRIMARY : '#A32D2D' }, selectedFilter === 'donors' && { fontWeight: 'bold' }]}>Donors</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chip, selectedFilter === 'hospitals' && { backgroundColor: '#e6f1fb' }]} 
          onPress={() => setSelectedFilter('hospitals')}
        >
          <Ionicons name="business" size={14} color={selectedFilter === 'hospitals' ? '#0C447C' : '#0C447C'} />
          <Text style={[styles.chipText, { color: '#0C447C' }, selectedFilter === 'hospitals' && { fontWeight: 'bold' }]}>Hospitals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MapScreen;
