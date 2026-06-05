import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/theme';

const SettingsScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' });
  const API_URL = route.params?.API_URL;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else if (route.params?.user) {
          setUser(route.params.user);
        }
      } catch (e) {
        // Silenced error
      }
    });
    return unsubscribe;
  }, [navigation, route.params?.user]);

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, { height: 130, justifyContent: 'flex-end', paddingBottom: 20 }]}>
        <Text style={[styles.topBarTitle, { fontSize: 22 }]}>Settings</Text>
        <Text style={styles.topBarSub}>Profile & preferences</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          {user.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          )}
        </View>
        <View style={styles.profileInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.profileName}>{user.name}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { user, API_URL })} style={{ marginLeft: 8 }}>
              <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileDetail}>{user.blood_group || 'O+'} • {user.city ? user.city.toUpperCase() : 'UNKNOWN'}</Text>
          <Text style={[styles.profileDetail, { marginTop: 4, fontWeight: 'bold' }]}>+91 {user.mobile || 'Not provided'}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('Certificates')}>
          <Text style={styles.settingsRowText}>My certificates</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        {user.mobile && (
          <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('MyPosts')}>
            <Text style={styles.settingsRowText}>My posts</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.settingsRowText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('LocationSettings')}>
          <Text style={styles.settingsRowText}>Location settings</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow} onPress={async () => {
          await AsyncStorage.removeItem('user');
          navigation.replace('Welcome');
        }}>
          <Text style={[styles.settingsRowText, { color: COLORS.PRIMARY }]}>Logout</Text>
          <Ionicons name="log-out-outline" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  topBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  profileSection: { flexDirection: 'row', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: '#fff' },
  avatarCircle: { width: 85, height: 85, borderRadius: 42.5, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.PRIMARY, fontSize: 32, fontWeight: 'bold' },
  profileInfo: { marginLeft: 20, flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#111', textTransform: 'uppercase' },
  profileDetail: { fontSize: 13, color: '#aaa', marginTop: 4, letterSpacing: 0.5 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingsRowText: { fontSize: 17, color: '#333' },
});

export default SettingsScreen;
