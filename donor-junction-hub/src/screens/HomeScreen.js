import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const [orgName, setOrgName] = useState('Apollo Hospital');
  const [orgLocation, setOrgLocation] = useState('Chennai • Hospital');

  useEffect(() => {
    const fetchOrgDetails = async () => {
      try {
        const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
        const response = await fetch(`${API_URL}/get_profile.php?mobile=${mobile}`);
        const resData = await response.json();
        
        if (resData.status === 'success' && resData.organization) {
          const org = resData.organization;
          setOrgName(org.name);
          setOrgLocation(`${org.city} • ${org.category}`);
          
          // Sync to AsyncStorage
          await AsyncStorage.setItem(`orgName_${mobile}`, org.name);
          await AsyncStorage.setItem(`orgLocation_${mobile}`, `${org.city} • ${org.category}`);
        } else {
          // Fallback to AsyncStorage
          const storedName = await AsyncStorage.getItem(`orgName_${mobile}`);
          const storedLocation = await AsyncStorage.getItem(`orgLocation_${mobile}`);
          if (storedName) setOrgName(storedName);
          if (storedLocation) setOrgLocation(storedLocation);
        }
      } catch (error) {
        console.log('Error fetching org details:', error);
        // Fallback to AsyncStorage
        const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
        const storedName = await AsyncStorage.getItem(`orgName_${mobile}`);
        const storedLocation = await AsyncStorage.getItem(`orgLocation_${mobile}`);
        if (storedName) setOrgName(storedName);
        if (storedLocation) setOrgLocation(storedLocation);
      }
    };
    
    // Fetch details on mount and every time home screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrgDetails();
    });
    fetchOrgDetails();
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Row */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{orgName}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>{orgLocation}</Text>
        </View>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Navigation Grid (2x2) */}
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Campaigns')}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconBg}>
              <Ionicons name="megaphone" size={22} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.gridText}>Campaigns</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Map')}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconBg}>
              <Ionicons name="location" size={22} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.gridText}>Donor map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconBg}>
              <Ionicons name="chatbubbles" size={22} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.gridText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Inquiry')}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconBg}>
              <Ionicons name="list" size={22} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.gridText}>Inquiries</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Stats Section */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: COLORS.RED_BG }]}>
            <Text style={[styles.statNum, { color: COLORS.RED_TEXT }]}>5</Text>
            <Text style={[styles.statText, { color: COLORS.RED_TEXT }]}>Active campaigns</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: COLORS.GREEN_BG }]}>
            <Text style={[styles.statNum, { color: COLORS.GREEN_TEXT }]}>24</Text>
            <Text style={[styles.statText, { color: COLORS.GREEN_TEXT }]}>Donors contacted</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: COLORS.BLUE_BG }]}>
            <Text style={[styles.statNum, { color: COLORS.BLUE_TEXT }]}>8</Text>
            <Text style={[styles.statText, { color: COLORS.BLUE_TEXT }]}>Pending replies</Text>
          </View>
        </View>

        {/* Recent Activity Section */}
        <Text style={styles.sectionTitle}>Recent activity</Text>
        
        {/* Activity Card 1 */}
        <TouchableOpacity 
          style={styles.activityCard} 
          onPress={() => navigation.navigate('ChatDetail')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Donor responded — Ravi K.</Text>
            <View style={[styles.badge, { backgroundColor: COLORS.GREEN_BG }]}>
              <Text style={[styles.badgeText, { color: COLORS.GREEN_TEXT }]}>Confirmed</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>A+ • Available June 15 • 2.3 km</Text>
        </TouchableOpacity>

        {/* Activity Card 2 */}
        <TouchableOpacity 
          style={styles.activityCard} 
          onPress={() => navigation.navigate('Inquiry')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>New inquiry — O- request</Text>
            <View style={[styles.badge, { backgroundColor: COLORS.AMBER_BG }]}>
              <Text style={[styles.badgeText, { color: COLORS.AMBER_TEXT }]}>Pending review</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>Received 10 mins ago</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  gridItem: {
    width: '48%',
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 6,
  },
  gridText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  statText: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  cardSub: {
    fontSize: 9,
    color: '#999999',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '600',
  },
});
