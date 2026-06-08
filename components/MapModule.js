import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = ({ children, style, initialRegion }) => {
  // Random Tamil Nadu coordinates for the web iframe
  const lat = initialRegion?.latitude || 13.0827;
  const lng = initialRegion?.longitude || 80.2707;
  
  // Using an iframe to show a real Google Map on web without complex setup
  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <View style={[style, styles.container]}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
      ></iframe>
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Live Map (Web Preview)</Text>
      </View>
    </View>
  );
};

export const Marker = ({ children }) => <View style={{ position: 'absolute' }}>{children}</View>;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e4ede4',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(218, 0, 55, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  overlayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MapView;
