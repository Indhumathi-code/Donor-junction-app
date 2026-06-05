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

export default function ChatListScreen({ navigation }) {
  const [chatsList, setChatsList] = useState([]);

  const fetchChats = async () => {
    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const response = await fetch(`${API_URL}/get_chats.php?org_mobile=${mobile}`);
      const resData = await response.json();

      if (resData.status === 'success') {
        setChatsList(resData.chats);
      }
    } catch (e) {
      console.log('Error loading chats: ', e);
      // No mock fallback
      setChatsList([]);
    }
  };

  useEffect(() => {
    fetchChats();
    const unsubscribe = navigation.addListener('focus', fetchChats);
    
    // Poll every 4 seconds to reflect new real-time database messages automatically!
    const interval = setInterval(fetchChats, 4000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>Messages</Text>
          <Text style={styles.topbarSub}>Donor conversations</Text>
        </View>
        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chat Threads Scrollable */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {chatsList.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatRow}
            onPress={() => navigation.navigate('ChatDetail', {
              donor: chat.donor
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: chat.avatarBg }]}>
              <Text style={[styles.avatarText, { color: chat.avatarColor }]}>{chat.initials}</Text>
            </View>

            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={chat.unread > 0 ? styles.lastMessageUnread : styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            </View>

            <View style={styles.rightContainer}>
              <Text style={chat.unread > 0 ? styles.timeTextUnread : styles.timeText}>{chat.time}</Text>
              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{chat.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
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
  topbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
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
    paddingVertical: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
    minWidth: 0, // Helps with text truncation inside flex item
  },
  chatName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  lastMessage: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  lastMessageUnread: {
    fontSize: 10,
    color: COLORS.TEXT_DARK,
    fontWeight: '600',
    marginTop: 2,
  },
  timeText: {
    fontSize: 9,
    color: '#BBBBBB',
  },
  timeTextUnread: {
    fontSize: 9,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
