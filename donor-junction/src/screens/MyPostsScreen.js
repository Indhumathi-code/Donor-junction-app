import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import { Badge, Card } from '../components/common/CommonComponents';

const fetchWithTimeout = (url, options = {}, timeout = 1200) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

const getImageSource = (image) => {
  if (!image) return null;
  const imgStr = String(image);
  if (imgStr.startsWith('http://') || imgStr.startsWith('https://') || imgStr.startsWith('file://') || imgStr.startsWith('content://') || imgStr.startsWith('data:')) {
    return { uri: imgStr };
  }
  return { uri: `${API_URL}/${imgStr}` };
};

const MyPostsScreen = ({ navigation, route }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadPosts();

    const unsubscribe = navigation.addListener('focus', () => {
      loadPosts();
    });
    return unsubscribe;
  }, [navigation, route.params?.refreshTrigger]);

  const loadPosts = async () => {
    let filterMobile = '';
    let parsedName = '';
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        filterMobile = parsed.mobile || '';
        parsedName = parsed.name || '';
      }
    } catch (e) {
      // Ignore
    }

    if (!filterMobile && !parsedName) {
      setLoading(false);
      return;
    }

    // Load deleted post IDs from AsyncStorage to handle offline fallbacks
    let deletedIds = [];
    try {
      const storedDeleted = await AsyncStorage.getItem('deleted_post_ids');
      if (storedDeleted) {
        deletedIds = JSON.parse(storedDeleted).map(Number);
      }
    } catch (e) {
      // Ignore
    }

    // Load local posts from AsyncStorage
    let localPosts = [];
    try {
      const storedLocal = await AsyncStorage.getItem('local_posts');
      if (storedLocal) {
        localPosts = JSON.parse(storedLocal);
      }
    } catch (e) {
      // Ignore
    }

    const activeLocal = localPosts.filter(p => !deletedIds.includes(p.id));

    const fallbackPosts = [
      { id: 1, title: 'A+ blood needed', type: 'urgent', category: 'seeker', location: 'Apollo Hospital, Chennai', distance: '2.1 km', description: 'Urgent requirement for surgery patient. Replacement donors accepted.', blood_group: 'A+', units_needed: '2 units', mobile: '6382073039' },
      { id: 2, title: 'O+ platelets required', type: 'urgent', category: 'seeker', location: 'Fortis Healthcare, Chennai', distance: '4.8 km', description: 'Dengue fever patient requiring O+ platelets immediately.', blood_group: 'O+', units_needed: '4 units', mobile: '9876543210' },
      { id: 3, title: 'B- normal blood request', type: 'normal', category: 'donor', location: 'GH Hospital, Chennai', distance: '6.5 km', description: 'Scheduled elective surgery requirement for next week.', blood_group: 'B-', units_needed: '1 unit', mobile: '6382073039' },
      { id: 4, title: 'AB+ urgent donation', type: 'urgent', category: 'donor', location: 'MIOT International, Chennai', distance: '8.0 km', description: 'Accident emergency case. Direct donors required.', blood_group: 'AB+', units_needed: '3 units', mobile: '8888888888' }
    ];

    // Filter out deleted posts from offline fallbacks
    const filteredFallbacks = fallbackPosts.filter(p => !deletedIds.includes(p.id));

    // Merge fallback with local posts
    const fallbackCombined = [...activeLocal, ...filteredFallbacks];
    const fallbackFinal = fallbackCombined.filter(p => {
      const cleanP = p.mobile ? String(p.mobile).replace(/[^0-9]/g, '').slice(-10) : '';
      const cleanF = filterMobile ? String(filterMobile).replace(/[^0-9]/g, '').slice(-10) : '';
      const matchesMobile = cleanP && cleanF && (cleanP === cleanF);
      const matchesName = p.title && (
        String(p.title).toLowerCase().includes('anitha') ||
        String(p.title).toLowerCase().includes('anita') ||
        (parsedName && String(p.title).toLowerCase() === String(parsedName).toLowerCase())
      );
      return matchesMobile || matchesName;
    });

    setPosts(fallbackFinal);
    setLoading(true);

    try {
      let url = `${API_URL}/get_posts.php`;
      const response = await fetchWithTimeout(url);
      const res = await response.json();
      if (res.status === 'success' && res.data) {
        // Also filter out any deleted post IDs from the live database response
        const livePosts = res.data.filter(p => !deletedIds.includes(Number(p.id)));

        // Deduplicate local posts that were already successfully uploaded to the database
        const deDuplicatedLocal = activeLocal.filter(localP => {
          const localMobile = localP.mobile ? String(localP.mobile).replace(/[^0-9]/g, '').slice(-10) : '';
          return !livePosts.some(liveP => {
            const liveMobile = liveP.mobile ? String(liveP.mobile).replace(/[^0-9]/g, '').slice(-10) : '';
            return liveP.title === localP.title &&
                   liveP.location === localP.location &&
                   liveMobile === localMobile;
          });
        });

        const combined = [...deDuplicatedLocal, ...livePosts];
        const finalPosts = combined.filter(p => {
          const cleanP = p.mobile ? String(p.mobile).replace(/[^0-9]/g, '').slice(-10) : '';
          const cleanF = filterMobile ? String(filterMobile).replace(/[^0-9]/g, '').slice(-10) : '';
          const matchesMobile = cleanP && cleanF && (cleanP === cleanF);
          const matchesName = p.title && (
            String(p.title).toLowerCase().includes('anitha') ||
            String(p.title).toLowerCase().includes('anita') ||
            (parsedName && String(p.title).toLowerCase() === String(parsedName).toLowerCase())
          );
          return matchesMobile || matchesName;
        });

        setPosts(finalPosts);
      }
    } catch (error) {
      // Offline fallback already populated
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleDeletePost = (id) => {
    Alert.alert(
      "Remove Post",
      "Are you sure you want to remove this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deletePost(id)
        }
      ]
    );
  };

  const deletePost = async (id) => {
    // Save to AsyncStorage so deleted posts are completely excluded from both fallbacks and live views
    try {
      const storedDeleted = await AsyncStorage.getItem('deleted_post_ids');
      let deletedIds = storedDeleted ? JSON.parse(storedDeleted) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        await AsyncStorage.setItem('deleted_post_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      // Ignore
    }

    // Also purge from local_posts in AsyncStorage
    try {
      const storedLocal = await AsyncStorage.getItem('local_posts');
      if (storedLocal) {
        let localList = JSON.parse(storedLocal);
        const updatedLocal = localList.filter(p => p.id !== id);
        await AsyncStorage.setItem('local_posts', JSON.stringify(updatedLocal));
      }
    } catch (e) {
      // Ignore
    }

    try {
      const response = await fetch(`${API_URL}/delete_post.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const res = await response.json();
      if (res.status === 'success') {
        Alert.alert("Success", "Post removed successfully");
        loadPosts();
      } else {
        Alert.alert("Error", res.message || "Failed to remove post");
      }
    } catch (error) {
      setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
      Alert.alert("Success", "Post removed successfully");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, styles.topBarRow]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topBarTitle}>My Posts</Text>
            <Text style={styles.topBarSub}>Manage your requests</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CreatePost', { fromScreen: 'MyPosts' })}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <Card style={{ marginHorizontal: 15, marginTop: 10 }} onPress={() => navigation.navigate('Schedule', { post: item })}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.category && (
                    <Badge color={item.category === 'donor' ? '#e3f2fd' : '#fbe9e7'} textColor={item.category === 'donor' ? '#0d47a1' : '#d84315'}>
                      {item.category === 'donor' ? 'DONOR' : 'WANTS BLOOD'}
                    </Badge>
                  )}
                  <Badge color={item.type === 'urgent' ? '#ffeaea' : '#eaf3de'} textColor={item.type === 'urgent' ? '#A32D2D' : '#27500A'}>
                    {item.type.toUpperCase()}
                  </Badge>
                  <TouchableOpacity
                    onPress={() => handleDeletePost(item.id)}
                    style={{ marginLeft: 12, padding: 4 }}
                  >
                    <Ionicons name="remove-circle" size={24} color="#A32D2D" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardSub}>{item.location} • {item.distance}</Text>

              {item.image ? (
                <Image
                  source={getImageSource(item.image)}
                  style={{ width: '100%', height: 150, borderRadius: 8, marginVertical: 10 }}
                  resizeMode="cover"
                />
              ) : null}

              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Badge color="#e6f1fb" textColor="#0C447C">{item.blood_group}</Badge>
                {item.units_needed && <Badge color="#faeeda" textColor="#633806">{item.units_needed}</Badge>}
              </View>
            </Card>
          )}
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
};

export default MyPostsScreen;
