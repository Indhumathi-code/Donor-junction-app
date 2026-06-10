import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import { Badge, Card } from '../components/common/CommonComponents';
import { nutritionTips } from '../data/nutritionTipsData';
import { useLoading } from '../contexts/LoadingContext';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(route.params?.user || { name: 'Guest', blood_group: 'N/A', city: 'Unknown' });
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [urgentCampaign, setUrgentCampaign] = useState(null);
  const { showLoading, hideLoading } = useLoading();

  const carouselRef = useRef(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!nutritionTips || nutritionTips.length === 0) return;
    const interval = setInterval(() => {
      currentIndexRef.current = (currentIndexRef.current + 1) % nutritionTips.length;
      if (carouselRef.current) {
        const itemWidth = (width * 0.88) + 15;
        carouselRef.current.scrollTo({ x: currentIndexRef.current * itemWidth, animated: true });
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadCampaignStats = async () => {
    try {
      showLoading();
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
    } finally {
      setTimeout(() => {
        hideLoading();
      }, 1500);
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


  const shortcuts = [
    {
      label: 'Health Tips',
      image: require('../assets/images/health_tips_icon.png'),
      onPress: () => navigation.navigate('Tips'),
    },
    {
      label: 'Chat',
      image: require('../assets/images/chat_icon.png'),
      onPress: () => navigation.navigate('Chat'),
    },
    {
      label: 'Find Donor',
      image: require('../assets/images/find_donor_icon.png'),
      onPress: () => navigation.navigate('Map'),
    },
    {
      label: 'Post',
      image: require('../assets/images/post_icon.png'),
      onPress: () => navigation.navigate('Posts'),
    },
    {
      label: 'Certification',
      image: require('../assets/images/certification_icon.png'),
      onPress: () => navigation.navigate('Certificates'),
    },
  ];

  const itemWidth = (width - 70) / 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 45,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
      }}>
        <View>
          <Text style={{
            color: '#8E8E93',
            fontSize: 12,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 2
          }}>
            Welcome
          </Text>
          <Text style={{
            color: '#000000',
            fontSize: 22,
            fontWeight: 'bold',
          }}>
            {(user.name || 'guest').toLowerCase()}{' '}
            <Text style={{ color: '#DA0037' }}>{user.blood_group || 'N/A'}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <View style={{ position: 'relative', padding: 4 }}>
            <Ionicons name="notifications-outline" size={26} color="#000000" />
            <View style={{
              position: 'absolute',
              right: 2,
              top: 2,
              backgroundColor: '#DA0037',
              width: 9,
              height: 9,
              borderRadius: 4.5,
              borderWidth: 1.5,
              borderColor: '#FFFFFF'
            }} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Carousel */}
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingBottom: 25, paddingTop: 10, paddingRight: 20 }}
          snapToInterval={width * 0.88 + 15}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
        >
          {nutritionTips.map((item) => {
            const isRemoteUrl = typeof item.image === 'string' && (item.image.startsWith('http://') || item.image.startsWith('https://'));
            const imageSrc = isRemoteUrl ? { uri: item.image } : item.image;
            return (
              <TouchableOpacity
                key={item.id.toString()}
                style={{
                  width: width * 0.88,
                  backgroundColor: '#F0F2F4',
                  borderRadius: 20,
                  padding: 15,
                  marginRight: 15,
                  height: 150,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                onPress={() => navigation.navigate('Tips')}
              >
                <Image
                  source={imageSrc}
                  style={{ width: 120, height: 120, borderRadius: 8, marginRight: 15, backgroundColor: '#FFFFFF' }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: '#333333', lineHeight: 18 }} numberOfLines={4}>{item.teaser}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lower gray container for shortcuts and additional features */}
        <View style={{
          backgroundColor: '#EAEAEA',
          flex: 1,
          paddingTop: 25,
          paddingBottom: 40,
          minHeight: height - 320,
        }}>
          {/* Grid of Shortcuts (3 on Row 1, 2 on Row 2) */}
          <View style={{ paddingHorizontal: 20 }}>
            {/* Row 1: Health Tips, Chat, Find Donor */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 15,
              marginBottom: 15,
            }}>
              {shortcuts.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: itemWidth,
                    height: itemWidth,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 8,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={item.onPress}
                  activeOpacity={0.85}
                >
                  <Image
                    source={item.image}
                    style={{ width: 45, height: 45, marginBottom: 8 }}
                    resizeMode="contain"
                  />
                  <Text style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#000000',
                    textAlign: 'center',
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 2: Post, Certification */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              gap: 15,
            }}>
              {shortcuts.slice(3, 5).map((item, index) => (
                <TouchableOpacity
                  key={index + 3}
                  style={{
                    width: itemWidth,
                    height: itemWidth,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 8,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={item.onPress}
                  activeOpacity={0.85}
                >
                  <Image
                    source={item.image}
                    style={{ width: 45, height: 45, marginBottom: 8 }}
                    resizeMode="contain"
                  />
                  <Text style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#000000',
                    textAlign: 'center',
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
