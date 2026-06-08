import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function ConfirmationScreen({ route, navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}><Ionicons name="checkmark" size={40} color={COLORS.SUCCESS} /></View>
      <Text style={styles.title}>Donation confirmed!</Text>
      <Text style={styles.sub}>{route.params.date} • {route.params.time}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Home')}><Text style={styles.btnText}>Back to Home</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eaf3de', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  sub: { color: '#999', marginTop: 10, textAlign: 'center' },
  btn: { backgroundColor: COLORS.PRIMARY, width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
