import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const SmallSupermanLoader = ({ color = "#FFFFFF" }) => {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="small" color={color} />
    </View>
  );
};

export default SmallSupermanLoader;
