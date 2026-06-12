import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const CertificatesScreen = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.topBar}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Certificates</Text>
      </View>
      <TouchableOpacity onPress={() => { /* Handle add certification */ }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Ionicons name="ribbon-outline" size={80} color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>No certificates yet</Text>
      <Text style={{ color: '#999', textAlign: 'center', marginTop: 10 }}>Donate blood to earn certificates and badges!</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { 
    backgroundColor: COLORS.PRIMARY, 
    padding: 15, 
    paddingTop: 40, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CertificatesScreen;
