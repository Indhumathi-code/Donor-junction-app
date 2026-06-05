import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/theme';

const NotificationsScreen = ({ navigation }) => {
  const [newRequests, setNewRequests] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [chatMessages, setChatMessages] = useState(true);
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const nr = await AsyncStorage.getItem('newRequests');
      const ua = await AsyncStorage.getItem('urgentAlerts');
      const cm = await AsyncStorage.getItem('chatMessages');
      const rm = await AsyncStorage.getItem('reminders');
      if (nr !== null) setNewRequests(JSON.parse(nr));
      if (ua !== null) setUrgentAlerts(JSON.parse(ua));
      if (cm !== null) setChatMessages(JSON.parse(cm));
      if (rm !== null) setReminders(JSON.parse(rm));
    } catch (e) { }
  };

  const saveSetting = async (key, value, setter) => {
    setter(value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Notifications</Text>
      </View>
      <View style={{ padding: 20 }}>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>New requests near you</Text>
          <Switch
            value={newRequests}
            onValueChange={(v) => saveSetting('newRequests', v, setNewRequests)}
            trackColor={{ false: "#eee", true: COLORS.PRIMARY }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Urgent alerts</Text>
          <Switch
            value={urgentAlerts}
            onValueChange={(v) => saveSetting('urgentAlerts', v, setUrgentAlerts)}
            trackColor={{ false: "#eee", true: COLORS.PRIMARY }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Chat messages</Text>
          <Switch
            value={chatMessages}
            onValueChange={(v) => saveSetting('chatMessages', v, setChatMessages)}
            trackColor={{ false: "#eee", true: COLORS.PRIMARY }}
          />
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Donation reminders</Text>
          <Switch
            value={reminders}
            onValueChange={(v) => saveSetting('reminders', v, setReminders)}
            trackColor={{ false: "#eee", true: COLORS.PRIMARY }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingsRowText: { fontSize: 17, color: '#333' },
});

export default NotificationsScreen;
