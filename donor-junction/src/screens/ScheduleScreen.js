import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import SmallSupermanLoader from '../components/SmallSupermanLoader';

const fetchWithTimeout = (url, options = {}, timeout = 1200) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

const ScheduleScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('2025-06-15');
  const [time, setTime] = useState('9:00 AM');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Ignore
      }
    };
    loadUser();
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/schedule_donation.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, 
          post_id: post.id,
          scheduled_date: date,
          scheduled_time: time
        })
      });
      const res = await response.json();
      navigation.navigate('ChatRoom', { 
        hospitalName: post.author_name || post.title || 'Blood Poster', 
        partnerMobile: post.mobile || post.title,
        partnerType: post.mobile ? 'user' : 'hospital',
        threadId: post.id.toString(), 
        online: true, 
        user 
      });
    } catch (error) {
      navigation.navigate('ChatRoom', { 
        hospitalName: post.author_name || post.title || 'Blood Poster', 
        partnerMobile: post.mobile || post.title,
        partnerType: post.mobile ? 'user' : 'hospital',
        threadId: post.id.toString(), 
        online: true, 
        user 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Schedule donation</Text>
        <Text style={styles.topBarSub}>{post.location}</Text>
      </View>
      <View style={{ padding: 20 }}>
        <View style={styles.urgentAlert}>
          <Text style={styles.urgentAlertTitle}>{post.title}</Text>
          <Text style={styles.urgentAlertSub}>{post.units_needed} needed</Text>
        </View>

        <Text style={styles.label}>Select date</Text>
        <TextInput style={styles.inputField} value={date} onChangeText={setDate} />

        <Text style={styles.label}>Select time</Text>
        <View style={styles.timeRow}>
          {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'].map((t) => (
            <TouchableOpacity
              key={t}
              style={time === t ? styles.timeBtnActive : styles.timeBtn}
              onPress={() => setTime(t)}
            >
              <Text style={time === t ? styles.timeTextActive : styles.timeText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnRed, { marginTop: 30 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? <SmallSupermanLoader /> : <Text style={styles.btnRedText}>Confirm Donation</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGray, { marginTop: 10, zIndex: 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.btnGrayText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ScheduleScreen;
