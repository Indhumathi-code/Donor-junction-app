import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import Badge from '../components/Badge';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  const user = route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' };
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, styles.topBarRow]}>
        <View>
          <Text style={styles.topBarTitle}>Hello, {user.name} <Badge color="rgba(255,255,255,.2)" textColor="#fff">{user.blood_group}</Badge></Text>
          <Text style={styles.topBarSub}>{user.city}</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.shortcutGrid}>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Map')}>
            <Ionicons name="location" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Find donors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Posts')}>
            <Ionicons name="document-text" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Blood posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Tips')}>
            <Ionicons name="heart" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Health tips</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  topBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  topBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  shortcutItem: { width: (width - 40) / 2, backgroundColor: '#f8f8f8', padding: 20, margin: 5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  shortcutText: { fontSize: 12, color: '#555', marginTop: 8 },
});
