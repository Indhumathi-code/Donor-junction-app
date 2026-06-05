import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Badge({ children, color = '#ffeaea', textColor = '#A32D2D' }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
});
