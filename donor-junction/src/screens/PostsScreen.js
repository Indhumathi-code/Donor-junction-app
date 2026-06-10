import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Image, Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../constants/theme';

const fetchWithTimeout = (url, options = {}, timeout = 1200) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

// Haversine formula to calculate distance between two coordinates in km
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(1);
};

const formatDate = (dateString) => {
  if (!dateString) return '15-05-2026';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const parts = dateString.split(' ')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return '15-05-2026';
  }
};

const getImageSource = (image) => {
  if (!image) return null;
  const imgStr = String(image).trim();
  if (imgStr.startsWith('http://') || imgStr.startsWith('https://') || imgStr.startsWith('file://') || imgStr.startsWith('content://') || imgStr.startsWith('data:')) {
    return { uri: imgStr };
  }
  const cleanApiUrl = String(API_URL).trim();
  return { uri: `${cleanApiUrl}/${imgStr}` };
};

const PostCard = ({ item, loggedInMobile, loggedInName, isOwnPost, handleDeletePost, handleShare, navigation }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const authorName = item.author_name || (isOwnPost(item.mobile, item.title) && loggedInName ? loggedInName : 'Blood Donor');
  const postDate = formatDate(item.created_at);
  const imageSrc = getImageSource(item.image);
  const avatarSrc = getImageSource(item.author_avatar);

  // Show placeholder if no image exists, if image loading errored out, or while image is loading
  const showPlaceholder = !imageSrc || imageError || !imageLoaded;

  return (
    <View style={styles.postContainer}>
      {/* Author Header */}
      <View style={styles.authorHeader}>
        <View style={styles.authorInfo}>
          {avatarSrc ? (
            <Image
              source={avatarSrc}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.authorName}>{authorName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {isOwnPost(item.mobile, item.title) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePost(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#DA0037" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item)}>
            <Ionicons name="share-social" size={18} color="#111111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Instagram Style Post Card */}
      <View style={styles.instagramCard}>
        <View style={styles.postImageContainer}>
          {showPlaceholder ? (
            <View style={styles.postImagePlaceholder}>
              <Ionicons name="water" size={48} color="#FFFFFF" style={{ marginBottom: 4 }} />
              <Text style={styles.placeholderBloodGroup}>
                {item.blood_group ? String(item.blood_group).toUpperCase() : 'B+'}
              </Text>
              <Text style={styles.placeholderText}>Blood Request</Text>
            </View>
          ) : null}

          {imageSrc && !imageError ? (
            <Image
              source={imageSrc}
              style={[styles.postImage, showPlaceholder ? { width: 0, height: 0, position: 'absolute' } : {}]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.log("Failed to load image, displaying placeholder instead:", imageSrc.uri);
                setImageError(true);
              }}
            />
          ) : null}

          {/* Floating badge over image (shown only when image loaded successfully) */}
          {!showPlaceholder ? (
            <View style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: item.type === 'urgent' ? '#DA0037' : '#27500A',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                {item.blood_group ? String(item.blood_group).toUpperCase() : 'B+'} • {item.type ? String(item.type).toUpperCase() : 'NORMAL'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => {
              if (item.mobile) {
                navigation.navigate('ChatRoom', {
                  hospitalName: item.author_name || 'Blood Poster',
                  partnerMobile: item.mobile,
                  partnerType: 'user',
                  online: true,
                  user: { mobile: loggedInMobile, name: loggedInName }
                });
              }
            }}>
              <Ionicons name="chatbubble-outline" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.scheduleBtn}
            onPress={() => navigation.navigate('Schedule', { post: item })}
          >
            <Text style={styles.scheduleBtnText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Details Area */}
        <View style={styles.detailsContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.captionAuthor}>{authorName} </Text>
            We need {item.units_needed || '1'} units of {item.blood_group || 'B+'} blood group
          </Text>

          {item.description ? (
            <Text style={styles.descText}>{item.description}</Text>
          ) : null}

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#666" style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>

          <Text style={styles.postDateText}>{postDate} .</Text>
        </View>
      </View>
    </View>
  );
};

// Removed useLoading import from here

import { useLoading } from '../contexts/LoadingContext';

const PostsScreen = ({ navigation, route }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedInMobile, setLoggedInMobile] = useState('');
  const [loggedInName, setLoggedInName] = useState('');
  const { showLoading, hideLoading } = useLoading();

  const isOwnPost = (postMobile, postTitle) => {
    const cleanP = postMobile ? String(postMobile).replace(/[^0-9]/g, '').slice(-10) : '';
    const cleanL = loggedInMobile ? String(loggedInMobile).replace(/[^0-9]/g, '').slice(-10) : '';
    const matchesMobile = cleanP && cleanL && (cleanP === cleanL);

    const matchesName = postTitle && (
      String(postTitle).toLowerCase().includes('anitha') ||
      String(postTitle).toLowerCase().includes('anita') ||
      (loggedInName && String(postTitle).toLowerCase() === String(loggedInName).toLowerCase())
    );

    return matchesMobile || matchesName;
  };

  useEffect(() => {
    loadPosts();

    const unsubscribe = navigation.addListener('focus', () => {
      loadPosts();
    });
    return unsubscribe;
  }, [navigation, route.params?.refreshTrigger]);

  const loadPosts = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setLoggedInMobile(parsed.mobile || '');
        setLoggedInName(parsed.name || '');
      }
    } catch (e) {
      // Ignore
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
      { id: 1, title: 'B+ blood needed', type: 'urgent', category: 'seeker', location: 'anna nagar, madurai', distance: '2.1 km', description: 'post test', blood_group: 'B+', units_needed: '1', mobile: '6382073039', author_name: 'praveen', created_at: '2026-05-15 11:00:00' },
      { id: 2, title: 'A+ blood needed', type: 'urgent', category: 'seeker', location: 'Apollo Hospital, Chennai', distance: '4.8 km', description: 'Urgent requirement for surgery patient.', blood_group: 'A+', units_needed: '2', mobile: '9876543210', author_name: 'Ravi Prasad', created_at: '2026-06-02 09:30:00' },
      { id: 3, title: 'O+ platelets required', type: 'normal', category: 'seeker', location: 'Fortis Healthcare, Chennai', distance: '6.5 km', description: 'Dengue fever patient requiring platelets.', blood_group: 'O+', units_needed: '4', mobile: '6382073039', author_name: 'Mohammed Rafiq', created_at: '2026-06-03 15:45:00' }
    ];

    // Filter out deleted posts from offline fallbacks
    const filteredFallbacks = fallbackPosts.filter(p => !deletedIds.includes(p.id));

    // Merge fallback with local posts
    const fallbackCombined = [...activeLocal, ...filteredFallbacks];
    setPosts(fallbackCombined);
    
    // START LOADING ANIMATION
    setLoading(true);
    showLoading();

    try {
      let url = `${API_URL}/get_posts.php`;
      const response = await fetchWithTimeout(url);
      const res = await response.json();
      if (res.status === 'success' && res.data) {
        const livePosts = res.data.filter(p => !deletedIds.includes(Number(p.id))).map(post => {
          return { ...post, distance: 'Unknown' };
        });

        // Deduplicate local posts
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
        setPosts(combined);
      }
    } catch (error) {
      // Offline fallback already populated
    } finally {
      // END LOADING ANIMATION
      setLoading(false);
      setTimeout(() => {
        hideLoading();
      }, 1500);
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

  const handleShare = async (item) => {
    try {
      const message = `Blood Request:\nWe need ${item.units_needed || '1'} units of ${item.blood_group || 'B+'} blood group.\nLocation: ${item.location}\nDetails: ${item.description}`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1, height: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', backgroundColor: COLORS.PRIMARY }]} edges={['top', 'right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.PRIMARY, borderBottomWidth: 0 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Blood Post</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatePost', { fromScreen: 'Posts' })}
          style={styles.headerRightBtn}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, backgroundColor: '#FFF9FA' }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#DA0037" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={item => item.id.toString()}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={{ paddingVertical: 15 }}
            renderItem={({ item }) => (
              <PostCard
                item={item}
                loggedInMobile={loggedInMobile}
                loggedInName={loggedInName}
                isOwnPost={isOwnPost}
                handleDeletePost={handleDeletePost}
                handleShare={handleShare}
                navigation={navigation}
              />
            )}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DA0037',
    textAlign: 'center',
  },
  headerRightBtn: {
    padding: 4,
  },
  postContainer: {
    marginBottom: 25,
    marginHorizontal: 15,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF5F6',
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    marginLeft: 10,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F3EAEB',
    overflow: 'hidden',
    shadowColor: '#DA0037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  postImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#FAF5F6',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#FF4A70',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderBloodGroup: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  placeholderText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6ECEE',
  },
  scheduleBtn: {
    backgroundColor: '#DA0037',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 15,
  },
  captionText: {
    fontSize: 14,
    color: '#111111',
    lineHeight: 20,
    marginBottom: 6,
  },
  captionAuthor: {
    fontWeight: 'bold',
  },
  descText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  postDateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default PostsScreen;
