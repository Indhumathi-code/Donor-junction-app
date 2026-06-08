import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import { Badge, Card } from '../components/common/CommonComponents';
import { nutritionTips } from '../data/nutritionTipsData';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' });
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [urgentCampaign, setUrgentCampaign] = useState(null);

  const carouselRef = useRef(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!nutritionTips || nutritionTips.length === 0) return;
    const interval = setInterval(() => {
      currentIndexRef.current = (currentIndexRef.current + 1) % nutritionTips.length;
      if (carouselRef.current) {
        const itemWidth = (width * 0.85) + 15;
        carouselRef.current.scrollTo({ x: currentIndexRef.current * itemWidth, animated: true });
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadCampaignStats = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const cityFilter = parsedUser?.city?.toLowerCase()?.trim() || '';

      console.log('🔍 HomeScreen API_URL:', API_URL);
      const response = await fetch(`${API_URL}/get_campaigns.php`);
      console.log('📡 HomeScreen fetch status:', response.status);

      if (!response.ok) {
        console.error('❌ HomeScreen API response not ok:', response.statusText);
        return;
      }

      const resData = await response.json();
      console.log('📦 HomeScreen campaigns response:', resData);

      if (resData.status === 'success' && Array.isArray(resData.campaigns)) {
        const allCampaigns = resData.campaigns;
        console.log('✅ HomeScreen found campaigns:', allCampaigns.length);

        let filteredCampaigns = allCampaigns;
        if (cityFilter) {
          const safeCity = cityFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const cityRegex = new RegExp(safeCity, 'i');
          filteredCampaigns = allCampaigns.filter((camp) => {
            const place = String(camp.place || '');
            const title = String(camp.title || '');
            return cityRegex.test(place) || cityRegex.test(title);
          });
          console.log('🏙️  HomeScreen filtered campaigns:', filteredCampaigns.length);
        }

        setCampaignsCount(allCampaigns.length);
        const urgent = filteredCampaigns.find((camp) => camp.status?.toLowerCase() === 'urgent') || (allCampaigns.length > 0 ? allCampaigns[0] : null);
        setUrgentCampaign(urgent);
      } else {
        console.warn('⚠️  HomeScreen invalid response structure:', resData);
      }
    } catch (error) {
      console.error('❌ HomeScreen: loadCampaignStats error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else if (route.params?.user) {
          setUser(route.params.user);
        }
      } catch {
        // Silenced async storage warning
      }
      await loadCampaignStats();
    });
    return unsubscribe;
  }, [navigation, route.params?.user]);

  // Load campaigns on initial mount
  useEffect(() => {
    loadCampaignStats();
  }, []);


  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, styles.topBarRow]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={styles.topBarTitle}>Hello, {user.name} </Text>
            <Badge color="rgba(255,255,255,.2)" textColor="#fff">{user.blood_group}</Badge>
          </View>
          <Text style={styles.topBarSub}>Eligible to donate • {user.city}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <View style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={{
              position: 'absolute',
              right: -2,
              top: -2,
              backgroundColor: '#FFEB3B',
              width: 10,
              height: 10,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: COLORS.PRIMARY
            }} />
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
          <Text style={styles.sectionTitle}>Health tips</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tips')} style={{ paddingRight: 15 }}>
            {/* <Text style={{ color: COLORS.PRIMARY, fontSize: 14, fontWeight: '600' }}>See all</Text> */}
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 15, paddingBottom: 20 }}
        >
          {nutritionTips.map((item) => {
            const isRemoteUrl = typeof item.image === 'string' && (item.image.startsWith('http://') || item.image.startsWith('https://'));
            const imageSrc = isRemoteUrl ? { uri: item.image } : item.image;
            return (
              <TouchableOpacity
                key={item.id.toString()}
                style={{
                  width: width * 0.85,
                  marginRight: 20,
                  backgroundColor: '#dd8a8a46',
                  borderRadius: 30,
                  padding: 15,
                  marginRight: 20,
                  height: 200,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                onPress={() => navigation.navigate('Tips')}
              >
                <Image
                  source={imageSrc}
                  style={{ width: 160, height: 150, borderRadius: 10, marginRight: 15, backgroundColor: '#FFF' }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: '#4B5563', lineHeight: 16 }} numberOfLines={4}>{item.teaser}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.shortcutGrid}>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Map')}>
            <Ionicons name="location" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Find donors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Posts')}>
            <Ionicons name="document-text" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Blood posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Tips')}>
            <Ionicons name="heart" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.shortcutText}>Health tips</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Urgent near you</Text>
        <Card style={{ marginHorizontal: 15 }} onPress={() => navigation.navigate('Campaigns')}>
          <Text style={styles.cardTitle}>{urgentCampaign?.title || 'A+ blood needed'}</Text>
          <Text style={styles.cardSub}>{urgentCampaign?.place || 'Apollo Hospital, Chennai'} • 2.1 km</Text>
          <Badge color="#ffeaea" textColor="#A32D2D">{urgentCampaign?.status || 'Urgent'}</Badge>
        </Card>

        <Text style={styles.sectionTitle}>Your stats</Text>
        <View style={[styles.statsRow, { flexWrap: 'wrap' }]}>
          <View style={[styles.statBox, { backgroundColor: '#ffeaea' }]}>
            <Text style={[styles.statValue, { color: '#A32D2D' }]}>3</Text>
            <Text style={[styles.statLabel, { color: '#A32D2D' }]}>donations</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#eaf3de' }]}>
            <Text style={[styles.statValue, { color: '#27500A' }]}>152</Text>
            <Text style={[styles.statLabel, { color: '#27500A' }]}>days since last</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#e6f1fb' }]}>
            <Text style={[styles.statValue, { color: '#0C447C' }]}>{campaignsCount}</Text>
            <Text style={[styles.statLabel, { color: '#0C447C' }]}>campaigns</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
