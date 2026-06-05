import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,        
  ScrollView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../constants/theme';

// Leaflet Map inside WebView with dynamic DOM API rendering for Popups to avoid backslash escape syntax errors.
const getMapHtml = (initLat, initLon) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background-color: #FFFFFF;
      }
      #map {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
      .user-dot-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .user-dot {
        width: 12px;
        height: 12px;
        background-color: #4CD964;
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(76, 217, 100, 0.85);
        animation: pulse 1.4s infinite alternate;
      }
      @keyframes pulse {
        0% { transform: scale(0.85); box-shadow: 0 0 4px rgba(76, 217, 100, 0.6); }
        100% { transform: scale(1.3); box-shadow: 0 0 16px rgba(76, 217, 100, 1.0); }
      }
      .donor-marker-pin {
        width: 24px;
        height: 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 10px;
        font-weight: 800;
        border: 2px solid white;
        box-shadow: 0 2.5px 6px rgba(0,0,0,0.3);
      }
      .leaflet-popup-content-wrapper {
        border-radius: 10px;
        padding: 2px;
        box-shadow: 0 3px 12px rgba(0,0,0,0.15);
      }
      .leaflet-popup-content {
        margin: 8px 12px;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map;
      var userMarker;
      var userCircle;
      var donorMarkers = [];

      function startChat(id, name, category, mobile) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'chat',
            id: id,
            name: name,
            category: category,
            mobile: mobile
          }));
        } else if (window.parent) {
          window.parent.postMessage(JSON.stringify({
            type: 'chat',
            id: id,
            name: name,
            category: category,
            mobile: mobile
          }), '*');
        }
      }

      function makeCall(mobile) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'call',
            mobile: mobile
          }));
        } else if (window.parent) {
          window.parent.postMessage(JSON.stringify({
            type: 'call',
            mobile: mobile
          }), '*');
        }
      }

      function initMap() {
        if (typeof L === 'undefined') {
          setTimeout(initMap, 50);
          return;
        }

        // Initialize map at the user's actual registered coordinates directly!
        map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${initLat}, ${initLon}], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        // Add 10km radius circle zone
        userCircle = L.circle([${initLat}, ${initLon}], {
          color: '#4CD964',
          fillColor: '#4CD964',
          fillOpacity: 0.06,
          radius: 10000,
          weight: 1.5,
          dashArray: '6, 6'
        }).addTo(map);

        // Add user static pulsing locator icon
        var userIcon = L.divIcon({
          className: 'user-dot-container',
          html: '<div class="user-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        userMarker = L.marker([${initLat}, ${initLon}], { icon: userIcon }).addTo(map);
        
        var userPopup = document.createElement('div');
        userPopup.style.fontFamily = 'sans-serif';
        userPopup.style.fontSize = '11px';
        userPopup.innerHTML = "<b>Your Facility</b><br/>Registered Location (10km zone shown)";
        userMarker.bindPopup(userPopup);

        // Notify React Native when user manually drags/pans the map
        map.on('dragstart', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dragstart' }));
          } else if (window.parent) {
            window.parent.postMessage(JSON.stringify({ type: 'dragstart' }), '*');
          }
        });

        // Listen for updates from React Native (unified document + window listener for Android WebView portability)
        function handleRNMessage(event) {
          try {
            var data = event.data;
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }
            if (!data) return;

            if (data.type === 'center') {
              map.setView([data.lat, data.lon], 12, { animate: true, duration: 1.2 });
              userMarker.setLatLng([data.lat, data.lon]);
              userCircle.setLatLng([data.lat, data.lon]);
              userPopup.innerHTML = "<b>" + (data.name || "Your Facility") + "</b><br/>" + (data.address || "Registered Location") + "<br/>(10km zone shown)";
              setTimeout(function() { map.invalidateSize(); }, 200);
            } else if (data.type === 'center_map') {
              map.setView([data.lat, data.lon], 12, { animate: true, duration: 1.2 });
              setTimeout(function() { map.invalidateSize(); }, 200);
            } else if (data.type === 'update_marker_only') {
              userMarker.setLatLng([data.lat, data.lon]);
              userCircle.setLatLng([data.lat, data.lon]);
              userPopup.innerHTML = "<b>" + (data.name || "Your Facility") + "</b><br/>" + (data.address || "Registered Location") + "<br/>(10km zone shown)";
            } else if (data.type === 'update_markers') {
              // Clear previous markers
              donorMarkers.forEach(function(item) {
                map.removeLayer(item.marker);
              });
              donorMarkers = [];

              var newDonors = data.donors;
              newDonors.forEach(function(donor) {
                var isMyHub = donor.mobile === data.myMobile;

                var initials = 'N';
                if (donor.type === 'donor') {
                  initials = donor.category && donor.category.length <= 3 ? donor.category : 'D';
                } else if (donor.category === 'Hospital') {
                  initials = 'H';
                } else if (donor.category === 'Blood Bank') {
                  initials = 'B';
                }
                
                var pinIcon = L.divIcon({
                  className: 'user-dot-container',
                  html: '<div class="donor-marker-pin" style="background-color: ' + donor.color + '">' + initials + '</div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                });

                // Generate Popup DOM elements dynamically to avoid any escape/syntax issues
                var popupContent = document.createElement('div');
                popupContent.style.fontFamily = 'sans-serif';
                popupContent.style.fontSize = '11px';
                popupContent.style.width = '140px';

                var titleEl = document.createElement('b');
                titleEl.style.fontSize = '12px';
                titleEl.style.color = '#333';
                titleEl.style.display = 'block';
                titleEl.style.marginBottom = '2px';
                titleEl.textContent = donor.title + (isMyHub ? ' (My Hub)' : '');
                popupContent.appendChild(titleEl);

                var categoryEl = document.createElement('span');
                categoryEl.style.color = '#666';
                categoryEl.style.fontSize = '9px';
                categoryEl.style.display = 'block';
                categoryEl.style.marginBottom = '2px';
                categoryEl.style.fontWeight = 'bold';
                categoryEl.textContent = donor.category;
                popupContent.appendChild(categoryEl);

                var addressEl = document.createElement('span');
                addressEl.style.color = '#888';
                addressEl.style.fontSize = '9px';
                addressEl.style.display = 'block';
                addressEl.style.marginBottom = '8px';
                addressEl.style.lineHeight = '1.2';
                addressEl.textContent = donor.address;
                popupContent.appendChild(addressEl);

                if (isMyHub) {
                  var hubBadge = document.createElement('div');
                  hubBadge.textContent = 'Registered Static Facility';
                  hubBadge.style.textAlign = 'center';
                  hubBadge.style.backgroundColor = '#e6fbe6';
                  hubBadge.style.color = '#27500A';
                  hubBadge.style.padding = '4px 0';
                  hubBadge.style.borderRadius = '4px';
                  hubBadge.style.fontSize = '9px';
                  hubBadge.style.fontWeight = 'bold';
                  popupContent.appendChild(hubBadge);
                } else {
                  var btnRow = document.createElement('div');
                  btnRow.style.display = 'flex';
                  btnRow.style.gap = '4px';

                  var chatBtn = document.createElement('button');
                  chatBtn.textContent = 'Chat';
                  chatBtn.style.flex = '1';
                  chatBtn.style.padding = '5px 0';
                  chatBtn.style.backgroundColor = '#DA0037';
                  chatBtn.style.color = 'white';
                  chatBtn.style.border = 'none';
                  chatBtn.style.borderRadius = '4px';
                  chatBtn.style.fontWeight = 'bold';
                  chatBtn.style.cursor = 'pointer';
                  chatBtn.style.fontSize = '9px';
                  chatBtn.style.textAlign = 'center';
                  chatBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  chatBtn.onclick = function() {
                    startChat(donor.id, donor.title, donor.category, donor.mobile);
                  };
                  btnRow.appendChild(chatBtn);

                  var callBtn = document.createElement('button');
                  callBtn.textContent = 'Call';
                  callBtn.style.flex = '1';
                  callBtn.style.padding = '5px 0';
                  callBtn.style.backgroundColor = '#3C3489';
                  callBtn.style.color = 'white';
                  callBtn.style.border = 'none';
                  callBtn.style.borderRadius = '4px';
                  callBtn.style.fontWeight = 'bold';
                  callBtn.style.cursor = 'pointer';
                  callBtn.style.fontSize = '9px';
                  callBtn.style.textAlign = 'center';
                  callBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  callBtn.onclick = function() {
                    makeCall(donor.mobile);
                  };
                  btnRow.appendChild(callBtn);

                  popupContent.appendChild(btnRow);
                }

                var marker = L.marker([donor.lat, donor.lon], { icon: pinIcon })
                  .addTo(map)
                  .bindPopup(popupContent);
                
                donorMarkers.push({ id: donor.id, marker: marker });
              });
            }
          } catch(e) {
            console.log("WebView message error: " + e.message);
          }
        }

        window.addEventListener('message', handleRNMessage);
        document.addEventListener('message', handleRNMessage);

        // Notify React Native that WebView is ready (retry loop to prevent race condition)
        function notifyReady() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          } else if (window.parent) {
            window.parent.postMessage(JSON.stringify({ type: 'ready' }), '*');
          } else {
            setTimeout(notifyReady, 100);
          }
        }
        notifyReady();
      }

      initMap();
    </script>
  </body>
  </html>
`;

export default function DonorMapScreen({ navigation }) {
  const webViewRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [facilityCoords, setFacilityCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [myMobile, setMyMobile] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true); // Follow status (centering)
  const [myOrgName, setMyOrgName] = useState('Your Facility');
  const [myOrgAddress, setMyOrgAddress] = useState('Registered Location');
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
    // Hide own static pin to keep map clean of duplicates/My Hub markers
    if (marker.mobile === myMobile) return false;
    if (selectedFilter === 'donors') {
      return marker.type === 'donor';
    }
    if (selectedFilter === 'hospitals') {
      return marker.type === 'hospital';
    }
    return true;
  });

  // Fetch coordinates once with safety timeout & progressive accuracy fallback
  const getCurrentLocationWithTimeout = async (accuracyLevel, timeoutMs) => {
    return Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: accuracyLevel,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GPS request timed out at level: ' + accuracyLevel)), timeoutMs)
      )
    ]);
  };

  // Set up continuous GPS location watch & initial facility fetch
  useEffect(() => {
    let positionSubscription = null;

    const initializeMapData = async () => {
      try {
        const loggedInMobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
        setMyMobile(loggedInMobile);

        let staticLat = null;
        let staticLon = null;

        // Try reading static details from AsyncStorage first
        const cachedName = await AsyncStorage.getItem(`orgName_${loggedInMobile}`);
        const cachedAddress = await AsyncStorage.getItem(`orgAddress_${loggedInMobile}`);
        const cachedCity = await AsyncStorage.getItem(`orgCity_${loggedInMobile}`);
        if (cachedName) {
          setMyOrgName(cachedName);
        }
        if (cachedAddress) {
          setMyOrgAddress(cachedCity ? `${cachedAddress}, ${cachedCity}` : cachedAddress);
        }

        const cachedLat = await AsyncStorage.getItem(`orgLatitude_${loggedInMobile}`);
        const cachedLon = await AsyncStorage.getItem(`orgLongitude_${loggedInMobile}`);
        if (cachedLat && cachedLon) {
          staticLat = parseFloat(cachedLat);
          staticLon = parseFloat(cachedLon);
          console.log('DonorMapScreen: Found static coordinates in cache:', staticLat, staticLon);
        }

        // Fetch facility locations from backend database
        const response = await fetch(`${API_URL}/get_locations.php`);
        const resData = await response.json();
        if (resData.status === 'success') {
          const formatted = resData.locations.map(loc => {
            let type = loc.type === 'user' ? 'donor' : 'hospital';
            let color = COLORS.MAP_GREEN;

            if (type === 'donor') {
              color = '#DA0037';
            } else if (loc.category === 'Hospital') {
              color = '#0C447C';
            } else if (loc.category === 'Blood Bank') {
              color = '#C82333';
            } else if (loc.category === 'NGO') {
              color = '#3C3489';
            }

            return {
              id: loc.id,
              title: loc.name,
              category: loc.category || 'Hospital',
              mobile: loc.mobile,
              address: loc.address,
              city: loc.city,
              lat: loc.latitude,
              lon: loc.longitude,
              color: color,
              type: type
            };
          });
          setMarkers(formatted);

          // Find this logged-in organization's static location and info from DB
          const myFacility = resData.locations.find(loc => loc.mobile === loggedInMobile);
          if (myFacility) {
            setMyOrgName(myFacility.name);
            const fullAddress = myFacility.city ? `${myFacility.address}, ${myFacility.city}` : myFacility.address;
            setMyOrgAddress(fullAddress);

            // Detect if DB has the hardcoded Chennai fallback from the earlier registration bug
            const isFallbackChennai = myFacility.latitude && Math.abs(parseFloat(myFacility.latitude) - 13.0601) < 0.001;

            if (myFacility.latitude && parseFloat(myFacility.latitude) !== 0 && myFacility.longitude && parseFloat(myFacility.longitude) !== 0 && !isFallbackChennai) {
              staticLat = parseFloat(myFacility.latitude);
              staticLon = parseFloat(myFacility.longitude);
              console.log('DonorMapScreen: Found valid static coordinates in DB:', staticLat, staticLon);
              // Save/sync back to AsyncStorage cache
              await AsyncStorage.setItem(`orgLatitude_${loggedInMobile}`, staticLat.toString());
              await AsyncStorage.setItem(`orgLongitude_${loggedInMobile}`, staticLon.toString());
            } else {
              try {
                console.log('DonorMapScreen: No valid DB coordinates, geocoding address:', fullAddress);
                let geocodeResult;
                if (Platform.OS !== 'web') {
                  geocodeResult = await Location.geocodeAsync(fullAddress);
                }
                if (!geocodeResult || geocodeResult.length === 0) {
                  // Fallback to nominatim
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`, { headers: { 'User-Agent': 'DonorJunctionApp/1.0' } });
                  const data = await res.json();
                  if (data && data.length > 0) {
                    geocodeResult = [{ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }];
                  }
                }

                if (geocodeResult && geocodeResult.length > 0) {
                  staticLat = geocodeResult[0].latitude;
                  staticLon = geocodeResult[0].longitude;
                  console.log('DonorMapScreen: Geocoded address to coordinates:', staticLat, staticLon);
                  await AsyncStorage.setItem(`orgLatitude_${loggedInMobile}`, staticLat.toString());
                  await AsyncStorage.setItem(`orgLongitude_${loggedInMobile}`, staticLon.toString());
                }
              } catch (e) {
                console.log('Geocoding error:', e);
              }
            }
          }

          // If still no coords, try geocoding cached address
          if (!staticLat && !staticLon && cachedAddress) {
            try {
              const fullAddress = cachedCity ? `${cachedAddress}, ${cachedCity}` : cachedAddress;
              console.log('DonorMapScreen: Geocoding cached address:', fullAddress);
              let geocodeResult;
              if (Platform.OS !== 'web') {
                geocodeResult = await Location.geocodeAsync(fullAddress);
              }
              if (!geocodeResult || geocodeResult.length === 0) {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`, { headers: { 'User-Agent': 'DonorJunctionApp/1.0' } });
                const data = await res.json();
                if (data && data.length > 0) {
                  geocodeResult = [{ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }];
                }
              }
              if (geocodeResult && geocodeResult.length > 0) {
                staticLat = geocodeResult[0].latitude;
                staticLon = geocodeResult[0].longitude;
                console.log('DonorMapScreen: Geocoded cached address to coordinates:', staticLat, staticLon);
              }
            } catch (e) {
              console.log('Geocoding error:', e);
            }
          }
        }

        if (staticLat && staticLon) {
          console.log('DonorMapScreen: Using registered static location for facility:', staticLat, staticLon);
          setFacilityCoords({
            latitude: staticLat,
            longitude: staticLon
          });
          setCurrentLocation({
            latitude: staticLat,
            longitude: staticLon
          });
        } else {
          // If no static coordinates exist, fallback to GPS or Madurai
          console.log('DonorMapScreen: No registered static coordinates found. Running GPS/fallback...');
          let resolvedLocation = null;
          try {
            resolvedLocation = await Location.getLastKnownPositionAsync({});
          } catch (e) { }

          if (!resolvedLocation) {
            try {
              resolvedLocation = await getCurrentLocationWithTimeout(Location.Accuracy.Balanced, 2000);
            } catch (e) { }
          }

          if (resolvedLocation && resolvedLocation.coords) {
            const lat = resolvedLocation.coords.latitude;
            const lon = resolvedLocation.coords.longitude;
            console.log('DonorMapScreen: Fallback GPS resolved coordinates:', lat, lon);
            staticLat = lat;
            staticLon = lon;
          } else {
            // Ultimate fallback (Madurai coordinates) to prevent rendering a blank map
            staticLat = 9.9252;
            staticLon = 78.1198;
          }

          setFacilityCoords({ latitude: staticLat, longitude: staticLon });
          setCurrentLocation({ latitude: staticLat, longitude: staticLon });

          await AsyncStorage.setItem(`orgLatitude_${loggedInMobile}`, staticLat.toString());
          await AsyncStorage.setItem(`orgLongitude_${loggedInMobile}`, staticLon.toString());
        }

        setLoading(false);
      } catch (error) {
        console.log('Error initializing location: ', error);
        setLoading(false);
      }
    };

    initializeMapData();

    return () => {
      if (positionSubscription) {
        positionSubscription.remove();
      }
    };
  }, []);

  // Helper for cross-platform postMessage
  const postToMap = (data) => {
    if (!webViewRef.current) return;
    const payload = JSON.stringify(data);
    if (Platform.OS === 'web') {
      webViewRef.current.contentWindow?.postMessage(payload, '*');
    } else {
      webViewRef.current.postMessage(payload);
    }
  };

  // Sync WebView state with locations and markers
  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      // 1. Always keep the user pulsing GPS marker and circle at their live coordinates
      postToMap({
        type: 'update_marker_only',
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
        name: myOrgName,
        address: myOrgAddress
      });

      // 2. Perform map centering depending on active mode
      if (isFollowing) {
        postToMap({
          type: 'center',
          lat: currentLocation.latitude,
          lon: currentLocation.longitude,
          name: myOrgName,
          address: myOrgAddress
        });
      }

      // 3. Update all facility pins
      postToMap({
        type: 'update_markers',
        donors: activeMarkers,
        myMobile: myMobile
      });
    }
  }, [isMapReady, currentLocation, activeMarkers, myMobile, isFollowing, myOrgName, myOrgAddress]);

  // Recenter to static registered hospital coordinates (My Hub)
  const reCenterFacility = async () => {
    setLoading(true);
    setIsFollowing(true);
    console.log('DonorMapScreen: recentering to static facility requested:', facilityCoords);

    try {
      postToMap({
        type: 'center',
        lat: facilityCoords.latitude,
        lon: facilityCoords.longitude,
        name: myOrgName,
        address: myOrgAddress
      });
    } catch (error) {
      console.log('Re-center failed: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle events originating from WebView
  const handleMessage = (event) => {
    try {
      let dataStr = event.nativeEvent ? event.nativeEvent.data : event.data;
      if (!dataStr || typeof dataStr !== 'string') return;

      const data = JSON.parse(dataStr);
      if (!data.type) return; // Prevent parsing arbitrary messages from web plugins

      console.log('DonorMapScreen: handleMessage received:', data);
      if (data.type === 'ready') {
        setIsMapReady(true);
      } else if (data.type === 'dragstart') {
        setIsFollowing(false); // Disable auto-centering when user pans around
      } else if (data.type === 'chat') {
        navigation.navigate('ChatDetail', {
          donor: {
            id: data.mobile,
            name: data.name,
            initials: data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            bloodGroup: data.category,
            distance: 'Nearby',
            status: 'Active'
          }
        });
      } else if (data.type === 'call') {
        Linking.openURL(`tel:${data.mobile}`).catch(err => {
          Alert.alert('Calling Failed', 'Could not open phone dialer.');
        });
      }
    } catch (e) {
      // Log silently to avoid crash on non-JSON messages
    }
  };

  // Add global event listener for web messages
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>Donor Map</Text>
          <Text style={styles.topbarSub}>
            {myOrgName && myOrgName !== 'Your Facility' ? myOrgName : 'Registered Location'}
          </Text>
        </View>

        {/* Pulsing Live/Paused Follow Status Indicator */}
        <View style={[styles.liveStatusBadge, isFollowing ? styles.liveStatusBadgeActive : styles.liveStatusBadgePaused]}>
          <View style={[styles.liveStatusDot, isFollowing && styles.liveStatusDotActive]} />
          <Text style={styles.liveStatusText}>
            {isFollowing ? 'FACILITY CENTERED' : 'FREE ROAM'}
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {!loading && currentLocation ? (
          Platform.OS === 'web' ? (
            <iframe
              ref={webViewRef}
              srcDoc={getMapHtml(currentLocation.latitude, currentLocation.longitude)}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: getMapHtml(currentLocation.latitude, currentLocation.longitude), baseUrl: 'https://unpkg.com' }}
              style={styles.map}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={false}
              scrollEnabled={false}
              onMessage={handleMessage}
            />
          )
        ) : (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Initializing Map...</Text>
          </View>
        )}

        {/* Loading Spinner HUD overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Syncing GPS...</Text>
          </View>
        )}

        {/* Floating Re-center GPS Button (Highlighted when following live) */}
        <TouchableOpacity
          style={[styles.gpsLocationButton, isFollowing && styles.gpsLocationButtonActive]}
          onPress={reCenterFacility}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={20} color={isFollowing ? '#FFFFFF' : COLORS.PRIMARY} />
        </TouchableOpacity>

        {/* Floating Top-Right Filter Badge */}
        <View style={styles.filterHUD}>
          <Ionicons name="funnel" size={10} color={COLORS.PRIMARY} />
          <Text style={styles.filterHUDText}>All Facilities</Text>
        </View>

        {/* Floating Bottom-Center Donors Count Banner */}
        <View style={styles.countHUD}>
          <Ionicons name="people" size={12} color={COLORS.PRIMARY} />
          <Text style={styles.countHUDText}>
            {activeMarkers.length > 0 ? `${activeMarkers.length} facilities nearby` : 'Fetching nearby...'}
          </Text>
        </View>
      </View>

      {/* Map Filters (Chips) */}
      <View style={styles.mapFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapFilters}>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: '#e6fbe6' }, isFollowing && { borderWidth: 1.5, borderColor: '#4CD964' }]}
            onPress={reCenterFacility}
          >
            <Ionicons name="business" size={14} color="#4CD964" />
            <Text style={[styles.chipText, { color: '#4CD964' }]}>My Hub</Text>
          </TouchableOpacity>

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
        </ScrollView>
      </View>

      {/* View List Actions Panel */}
      <View style={styles.actionsPanel}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DonorList')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>View Donor List</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topbar: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  liveStatusBadgeActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  liveStatusBadgePaused: {
    backgroundColor: '#ECEFF1',
    borderColor: '#CFD8DC',
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#90A4AE',
    marginRight: 5,
  },
  liveStatusDotActive: {
    backgroundColor: '#2E7D32',
  },
  liveStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#37474F',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    elevation: 3,
    zIndex: 100,
  },
  loadingText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  gpsLocationButton: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 99,
  },
  gpsLocationButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterHUD: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    elevation: 2,
    zIndex: 50,
  },
  filterHUDText: {
    fontSize: 9,
    color: COLORS.TEXT_DARK,
    fontWeight: '600',
  },
  countHUD: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    elevation: 3,
    zIndex: 50,
  },
  countHUDText: {
    fontSize: 10,
    color: COLORS.TEXT_DARK,
    fontWeight: '600',
  },
  actionsPanel: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.BORDER,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  mapFiltersContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 10,
  },
  mapFilters: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#ffeaea',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  chipText: {
    fontSize: 13,
    color: '#A32D2D',
    fontWeight: 'bold',
  },
});
