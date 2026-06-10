import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const MapView = ({ children, style, initialRegion, onChatPress, userLocation }) => {
  // Random Tamil Nadu coordinates for the web iframe
  const lat = initialRegion?.latitude || 13.0827;
  const lng = initialRegion?.longitude || 80.2707;

  const markersData = React.Children.toArray(children)
    .filter(child => child && child.props && child.props.coordinate)
    .map(child => ({
      lat: child.props.coordinate.latitude,
      lng: child.props.coordinate.longitude,
      title: child.props.title || '',
      desc: child.props.description || '',
      type: child.props.type || 'donor'
    }));

  console.log("🗺️ MapModule: markersData = ", JSON.stringify(markersData));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100vw; height: 100vh; }
          .leaflet-popup-content-wrapper { border-radius: 8px; }
          .chat-btn {
            margin-top: 8px;
            width: 100%;
            background-color: #DA0037;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
          }
          .user-pin-container {
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0px 5px 6px rgba(0,0,0,0.4));
            animation: bounce 1.5s infinite ease-in-out;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); filter: drop-shadow(0px 11px 8px rgba(0,0,0,0.2)); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function sendMsg(msg) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(msg);
            } else if (window.parent) {
              window.parent.postMessage(msg, '*');
            }
          }
          
          var map = L.map('map').setView([${lat}, ${lng}], 12);
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 20
          }).addTo(map);

          if (${userLocation && userLocation.latitude && userLocation.longitude ? 'true' : 'false'}) {
            L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
              color: '#4CD964',
              fillColor: '#4CD964',
              fillOpacity: 0.06,
              radius: 10000,
              weight: 1.5,
              dashArray: '6, 6'
            }).addTo(map);
          }

          var markers = ${JSON.stringify(markersData)};
          
          markers.forEach(function(m) {
            if (isNaN(m.lat) || isNaN(m.lng) || m.lat == null || m.lng == null) return;
            if (m.title === 'My Location') return; // Rendered explicitly
            
            // Resolve initials
            var initials = 'D';
            var descStr = m.desc ? String(m.desc) : '';
            if (m.type === 'hospital') {
              if (descStr.includes('NGO')) initials = 'N';
              else if (descStr.includes('Blood Bank')) initials = 'B';
              else initials = 'H';
            } else {
              // Extract blood group like "AB+" or "A+" from description/title
              var bloodMatch = descStr.match(/([A-Z]{1,2}[+-])/);
              if (bloodMatch) {
                initials = bloodMatch[1];
              }
            }

            var color = m.type === 'hospital' ? '#2196F3' : '#DA0037';
            var iconHtml = \`
              <div style="filter: drop-shadow(0px 5px 6px rgba(0,0,0,0.4)); display: flex; align-items: center; justify-content: center;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 23.5s8-8 8-12.5a8 8 0 1 0-16 0c0 4.5 8 12.5 8 12.5z" fill="\${color}" stroke="white" stroke-width="1.5"/>
                  <circle cx="12" cy="11" r="5" fill="white"/>
                  <text x="12" y="11.5" fill="\${color}" font-size="4.5" font-family="sans-serif" font-weight="900" text-anchor="middle" dominant-baseline="central">\${initials}</text>
                </svg>
              </div>
            \`;
            var customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [44,44], iconAnchor: [22,42] });
            var marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);
            
            if(m.title) {
              var safeTitle = String(m.title).replace(/'/g, "\\'");
              var popupContent = "<b>" + m.title + "</b><br>" + descStr;
              popupContent += "<br><button class='chat-btn' onclick='sendMsg(\`chat:" + safeTitle + "\`)'>Chat</button>";
              marker.bindPopup(popupContent);
            }
          });

          // Draw user marker last with high zIndex so it's always visible above others
          if (${userLocation && userLocation.latitude && userLocation.longitude ? 'true' : 'false'}) {
            var userColor = '#4CD964';
            var userIconHtml = \`
              <div class="user-pin-container">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 23.5s8-8 8-12.5a8 8 0 1 0-16 0c0 4.5 8 12.5 8 12.5z" fill="\${userColor}" stroke="white" stroke-width="1.5"/>
                  <circle cx="12" cy="11" r="4.5" fill="white"/>
                  <circle cx="12" cy="11" r="2" fill="\${userColor}"/>
                </svg>
              </div>
            \`;
            var userIcon = L.divIcon({
              className: '',
              html: userIconHtml,
              iconSize: [44, 44],
              iconAnchor: [22, 42]
            });
            L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: userIcon, zIndexOffset: 1000 })
              .bindPopup('<b>My Location</b><br>You are here')
              .addTo(map);
          }
        </script>
      </body>
    </html>
  `;

  // Global listener for web messages
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event) => {
        const data = event.data;
        if (typeof data === 'string' && data.startsWith('chat:') && onChatPress) {
          const donorName = data.split(':')[1];
          onChatPress(donorName);
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [onChatPress]);

  return (
    <View style={[style, styles.container]}>
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={htmlContent}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <WebView
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            if (data.startsWith('chat:') && onChatPress) {
              const donorName = data.split(':')[1];
              onChatPress(donorName);
            }
          }}
        />
      )}
    </View>
  );
};

export const Marker = () => null;
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
