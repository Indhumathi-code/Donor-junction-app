import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Image, Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, API_URL } from '../constants/theme';
import { useLoading } from '../contexts/LoadingContext';

const fetchWithTimeout = (url, options = {}, timeout = 3000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
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

const BlogCard = ({ item, handleShare }) => {
  const imageSrc = getImageSource(item.image_uri);
  const authorName = item.org_name || 'Tamil Trust';
  const title = item.title || 'blood donation camp null';
  const description = item.description || 'test test';

  return (
    <View style={styles.postContainer}>
      <Text style={styles.postTitle}>{title}</Text>
      
      {/* Red container */}
      <View style={styles.cardContainer}>
        {imageSrc ? (
          <Image source={imageSrc} style={styles.postImage} resizeMode="cover" />
        ) : (
          <View style={[styles.postImage, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.subText}>{title}</Text>
          <Text style={styles.subText}>{description}</Text>
          
          {/* Absolute bottom bar container, floating-like */}
          <View style={styles.bottomBar}>
             <TouchableOpacity style={styles.iconButton} onPress={() => handleShare(item)}>
               <Ionicons name="share-social" size={24} color="#666" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.donateButton}>
               <Text style={styles.donateButtonText}>Quick Donate</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const BlogScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    loadBlogs();
    const unsubscribe = navigation.addListener('focus', () => {
      loadBlogs();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBlogs = async () => {
    setLoading(true);
    showLoading();
    try {
      const response = await fetchWithTimeout(`${API_URL}/get_blogs.php`);
      const res = await response.json();
      if (res.status === 'success' && res.blogs) {
        setBlogs(res.blogs);
      } else {
        // Mock fallback
        setBlogs([{
            id: 1,
            title: 'திருமணத்தில் வைக்கப்படும் நல் அடிகள் எதற்காகத் தெரியுமா',
            org_name: 'Tamil Trust',
            description: '1வது அடி: பஞ்சமில்லாமல் வாழ வேண்டும்.\n2வது அடி: ஆரோக்கியமாக வாழ வேண்டும்.',
            image_uri: null
        }]);
      }
    } catch (error) {
      console.log('Error fetching blogs:', error);
      // Mock fallback
      setBlogs([{
          id: 1,
          title: 'திருமணத்தில் வைக்கப்படும் நல் அடிகள் எதற்காகத் தெரியுமா',
          org_name: 'Tamil Trust',
          description: '1வது அடி: பஞ்சமில்லாமல் வாழ வேண்டும்.\n2வது அடி: ஆரோக்கியமாக வாழ வேண்டும்.',
          image_uri: null
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        hideLoading();
      }, 1000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlogs();
    setRefreshing(false);
  };

  const handleShare = async (item) => {
    try {
      const message = `Check out this blog: ${item.title}\nBy ${item.org_name}\n${item.description}`;
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1, height: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', backgroundColor: '#FFFFFF' }]} edges={['top', 'right', 'bottom', 'left']}>
      {isFocused && <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blog</Text>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#DA0037" />
          </View>
        ) : (
          <FlatList
            data={blogs}
            keyExtractor={(item, index) => String(item.id || index)}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={{ paddingVertical: 15 }}
            renderItem={({ item }) => (
              <BlogCard
                item={item}
                handleShare={handleShare}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
  },
  postContainer: {
    marginBottom: 30,
    marginHorizontal: 20,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
    lineHeight: 26,
  },
  cardContainer: {
    backgroundColor: '#DA0037',
    borderRadius: 15,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 15,
    paddingBottom: 40,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconButton: {
    padding: 5,
  },
  donateButton: {
    backgroundColor: '#DA0037',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default BlogScreen;
