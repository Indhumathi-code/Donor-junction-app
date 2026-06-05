import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function DonorListScreen({ route, navigation }) {
  // Extract parameters from route if navigated from map
  const routeParams = route.params || {};
  const { currentLocation, facilities } = routeParams;

  // Haversine formula to dynamically calculate real distance in km from user coordinates
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Premium fallback list strictly placed within the new 6km zone
  const defaultItems = [
    {
      id: 1,
      type: 'donor',
      initials: 'RK',
      name: 'Ravi Kumar',
      bloodGroup: 'A+',
      distance: '2.3 km',
      distanceVal: 2.3,
      lastDonated: '3 months ago',
      status: 'Eligible',
      statusColor: COLORS.GREEN_TEXT,
      statusBg: COLORS.GREEN_BG,
      navigable: true,
      avatarColor: COLORS.RED_BG,
      avatarTextColor: COLORS.RED_TEXT
    },
    {
      id: 101,
      type: 'hospital',
      initials: 'AH',
      name: 'Apollo Hospital',
      category: 'Hospital',
      distance: '3.0 km',
      distanceVal: 3.0,
      status: 'Active',
      statusColor: '#2E7D32',
      statusBg: '#E8F5E9',
      navigable: true,
      avatarColor: '#FFEBEE',
      avatarTextColor: '#DA0037'
    },
    {
      id: 2,
      type: 'donor',
      initials: 'SP',
      name: 'Siva Priya',
      bloodGroup: 'A+',
      distance: '4.1 km',
      distanceVal: 4.1,
      lastDonated: '4 months ago',
      status: 'Eligible',
      statusColor: COLORS.GREEN_TEXT,
      statusBg: COLORS.GREEN_BG,
      navigable: true,
      avatarColor: COLORS.RED_BG,
      avatarTextColor: COLORS.RED_TEXT
    },
    {
      id: 102,
      type: 'hospital',
      initials: 'CB',
      name: 'Chennai Blood Bank',
      category: 'Blood Bank',
      distance: '4.8 km',
      distanceVal: 4.8,
      status: 'Active',
      statusColor: '#0C447C',
      statusBg: '#E1F5FE',
      navigable: true,
      avatarColor: '#E3F2FD',
      avatarTextColor: '#0C447C'
    },
    {
      id: 3,
      type: 'donor',
      initials: 'MR',
      name: 'Mohammed Rafiq',
      bloodGroup: 'A+',
      distance: '5.2 km',
      distanceVal: 5.2,
      lastDonated: '1 month ago',
      status: 'Wait 56d',
      statusColor: COLORS.AMBER_TEXT,
      statusBg: COLORS.AMBER_BG,
      navigable: true,
      avatarColor: '#F0F0F0',
      avatarTextColor: '#888888'
    },
    {
      id: 4,
      type: 'donor',
      initials: 'AK',
      name: 'Anitha K.',
      bloodGroup: 'A+',
      distance: '5.8 km',
      distanceVal: 5.8,
      lastDonated: '5 months ago',
      status: 'Eligible',
      statusColor: COLORS.GREEN_TEXT,
      statusBg: COLORS.GREEN_BG,
      navigable: true,
      avatarColor: COLORS.RED_BG,
      avatarTextColor: COLORS.RED_TEXT
    }
  ];

  let donors = [...defaultItems];

  // Dynamic coordinates and markers passed from live Map
  if (currentLocation && facilities && facilities.length > 0) {
    const dynamicFacilities = facilities.map(fac => {
      const dist = getDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        fac.lat,
        fac.lon
      );

      let avatarColor = '#FFEBEE';
      let avatarTextColor = '#DA0037';
      if (fac.category === 'Blood Bank') {
        avatarColor = '#E3F2FD';
        avatarTextColor = '#0C447C';
      } else if (fac.category === 'NGO') {
        avatarColor = '#EDE7F6';
        avatarTextColor = '#3C3489';
      }

      return {
        id: fac.id,
        type: 'hospital',
        initials: fac.title.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        name: fac.title,
        category: fac.category,
        distance: `${dist.toFixed(1)} km`,
        distanceVal: dist,
        status: 'Active',
        statusColor: fac.category === 'Hospital' ? '#2E7D32' : '#0C447C',
        statusBg: fac.category === 'Hospital' ? '#E8F5E9' : '#E1F5FE',
        navigable: true,
        avatarColor: avatarColor,
        avatarTextColor: avatarTextColor,
        mobile: fac.mobile
      };
    });

    // Filter dynamic facilities to show only those located within 6km zone
    const withinZone = dynamicFacilities.filter(fac => fac.distanceVal <= 6.0);

    // Filter fallback donors
    const fallbackDonors = defaultItems.filter(item => item.type === 'donor');

    // Combine and sort by distance
    donors = [...fallbackDonors, ...withinZone].sort((a, b) => a.distanceVal - b.distanceVal);
  }

  // Count elements strictly under 6.0km
  const matchingCount = donors.filter(d => d.distanceVal <= 6.0).length;

  const formatDetails = (item) => {
    if (item.type === 'hospital') {
      return `${item.category || 'Hospital'} • ${item.distance} • Facility`;
    }
    return `${item.bloodGroup} • ${item.distance} • Last donated ${item.lastDonated}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View style={styles.topbarHeaderLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topbarTitle}>Nearby facilities & donors</Text>
            <Text style={styles.topbarSub}>
              {matchingCount} found within 6km zone
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.7}>
          <Ionicons name="swap-vertical-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* List Items */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {donors.map((donor) => {
          const CardComponent = donor.navigable ? TouchableOpacity : View;
          return (
            <CardComponent
              key={donor.id}
              style={styles.donorRow}
              onPress={donor.navigable ? () => navigation.navigate('ChatDetail', {
                donor: {
                  id: donor.id,
                  name: donor.name,
                  initials: donor.initials,
                  bloodGroup: donor.type === 'hospital' ? donor.category : donor.bloodGroup,
                  distance: donor.distance,
                  status: donor.status
                }
              }) : undefined}
              activeOpacity={0.75}
            >
              <View style={[styles.avatar, { backgroundColor: donor.avatarColor }]}>
                <Text style={[styles.avatarText, { color: donor.avatarTextColor }]}>{donor.initials}</Text>
              </View>

              <View style={styles.donorInfo}>
                <Text style={styles.donorName}>{donor.name}</Text>
                <Text style={styles.donorDetails}>
                  {formatDetails(donor)}
                </Text>
              </View>

              <View style={[styles.badge, { backgroundColor: donor.statusBg }]}>
                <Text style={[styles.badgeText, { color: donor.statusColor }]}>{donor.status}</Text>
              </View>
            </CardComponent>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topbar: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topbarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingRight: 4,
  },
  topbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  topbarButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 6,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  donorDetails: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
