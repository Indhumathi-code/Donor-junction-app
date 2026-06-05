import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={styles.topHeader}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color={COLORS.PRIMARY} />
            <Text style={styles.badgeText}>Saves Lives Daily</Text>
          </View>
        </View>

        <View style={styles.center}>
          <View style={styles.logoWrapper}>
            <Ionicons name="water" size={55} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.mainTitle}>Donor Junction</Text>
          <Text style={styles.mainSub}>The ultimate bridge connecting willing blood donors with those in urgent need.</Text>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.btnRed} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnRedText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnOutline} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Ionicons name="eye-outline" size={20} color="#555" style={{ marginRight: 8 }} />
            <Text style={styles.btnOutlineText}>Continue as Guest</Text>
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>Guests can browse requests. OTP needed to donate.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topHeader: { paddingTop: 20, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffeaea', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: COLORS.PRIMARY, fontSize: 11, fontWeight: '700', marginLeft: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  logoWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffeaea', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.SECONDARY },
  mainSub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  bottomContainer: { padding: 30 },
  btnRed: { backgroundColor: COLORS.PRIMARY, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  btnRedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: { height: 55, borderRadius: 16, borderWidth: 2, borderColor: '#eee', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginTop: 12 },
  btnOutlineText: { color: '#555', fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 15 },
});
