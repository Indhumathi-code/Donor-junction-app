import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';

const ConfirmationScreen = ({ route, navigation }) => (
  <View style={styles.confirmContainer}>
    <View style={styles.successCircle}><Ionicons name="checkmark" size={40} color="#27500A" /></View>
    <Text style={styles.confirmTitle}>Donation confirmed!</Text>
    <Text style={styles.confirmSub}>{route.params.date} • {route.params.time}{"\n"}{route.params.location}</Text>
    <View style={{ width: '80%', marginTop: 30, zIndex: 10 }}>
      <TouchableOpacity
        style={styles.btnRed}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        activeOpacity={0.7}
      >
        <Text style={styles.btnRedText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default ConfirmationScreen;
