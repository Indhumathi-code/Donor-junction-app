import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function TipsScreen({ navigation }) {
  const tips = [
    { id: 1, title: "Drink water", desc: "Stay hydrated before donating." },
    { id: 2, title: "Eat iron-rich food", desc: "Helps maintain hemoglobin." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Health Tips</Text>
      </View>
      <ScrollView style={{ padding: 15 }}>
        {tips.map(tip => (
          <View key={tip.id} style={styles.card}>
            <Text style={styles.cardTitle}>{tip.title}</Text>
            <Text style={styles.cardDesc}>{tip.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  card: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: COLORS.PRIMARY },
  cardTitle: { fontWeight: 'bold' },
  cardDesc: { color: '#666', marginTop: 5 }
});
