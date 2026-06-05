import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function CampaignDoneScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark" size={36} color={COLORS.GREEN_TEXT} />
        </View>
        
        <Text style={styles.title}>Campaign published!</Text>
        <Text style={styles.description}>
          Donors nearby will be notified.{"\n"}
          World Blood Day Drive 2025
        </Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Map' })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>View Nearby Donors</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Campaigns' })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back to Campaigns</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  successIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.GREEN_BG,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  actionContainer: {
    width: '100%',
    marginTop: 30,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  secondaryButtonText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '500',
  },
});
