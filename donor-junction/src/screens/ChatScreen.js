import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoading } from '../contexts/LoadingContext';

const ChatScreen = ({ navigation, route }) => {
  const user = route.params?.user || { name: 'Donor' };
  const donor = route.params?.donor;

  const [threads, setThreads] = useState([]);

  const [currentUser, setCurrentUser] = useState(user);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      showLoading();
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Ignore
      } finally {
        setTimeout(hideLoading, 1500); // Wait for the animation to finish
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const activeUser = currentUser || user;
        const userPhone = activeUser.mobile || activeUser.phone || '9999999999';
        // Fetch from database
        const response = await fetch(`${API_URL}/chat_threads.php?user_phone=${encodeURIComponent(userPhone)}`);
        const result = await response.json();

        let currentThreads = [];
        if (result.status === 'success') {
          currentThreads = result.data.map(t => {
            let formattedTime = 'Now';
            if (t.created_at) {
              const date = new Date(t.created_at.replace(' ', 'T'));
              const now = new Date();
              const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              
              if (isToday) {
                formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
                  formattedTime = 'Yesterday';
                } else {
                  formattedTime = date.toLocaleDateString();
                }
              }
            }
            return {
              id: t.id.toString(),
              name: t.partner_name,
              partnerMobile: t.partner_phone,
              partnerType: t.partner_type,
              lastMessage: t.last_message || 'No messages yet',
              time: formattedTime,
              unread: t.unread || 0,
              online: true
            };
          });
        }

        if (donor) {
          const exists = currentThreads.some(t => t.name === donor);
          if (!exists) {
            // Save new donor thread to database
            await fetch(`${API_URL}/chat_threads.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_phone: userPhone,
                partner_name: donor,
                last_message: 'Chat started from map'
              })
            });

            // Refresh list
            const reloadRes = await fetch(`${API_URL}/chat_threads.php?user_phone=${encodeURIComponent(userPhone)}`);
            const reloadResult = await reloadRes.json();
            if (reloadResult.status === 'success') {
              currentThreads = reloadResult.data.map(t => {
                let formattedTime = 'Now';
                if (t.created_at) {
                  const date = new Date(t.created_at.replace(' ', 'T'));
                  const now = new Date();
                  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  
                  if (isToday) {
                    formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } else {
                    const yesterday = new Date(now);
                    yesterday.setDate(now.getDate() - 1);
                    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
                      formattedTime = 'Yesterday';
                    } else {
                      formattedTime = date.toLocaleDateString();
                    }
                  }
                }
                return {
                  id: t.id.toString(),
                  name: t.partner_name,
                  partnerMobile: t.partner_phone,
                  partnerType: t.partner_type,
                  lastMessage: t.last_message || 'No messages yet',
                  time: formattedTime,
                  unread: t.unread || 0,
                  online: true
                };
              });
            }
          }
        }
        setThreads(currentThreads);
      } catch (error) {
        console.error("Error loading threads:", error);
      }
    };

    loadThreads();
    const intervalId = setInterval(loadThreads, 4000);

    return () => clearInterval(intervalId);
  }, [donor, currentUser, user]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Chats</Text>
        </View>
        <Ionicons name="search" size={20} color="#fff" />
      </View>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        contentContainerStyle={threads.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : {}}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={{ marginTop: 15, fontSize: 16, color: '#999' }}>No conversations yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatListItem}
            onPress={() => navigation.navigate('ChatRoom', {
              hospitalName: item.name,
              partnerMobile: item.partnerMobile || item.name,
              partnerType: item.partnerType || 'hospital',
              online: item.online,
              threadId: item.id,
              user: currentUser || user
            })}
          >
            <View style={styles.chatListAvatar}>
              <Text style={styles.chatListAvatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
              <View style={[styles.listStatusDot, { backgroundColor: item.online ? '#4CD964' : '#999' }]} />
            </View>
            <View style={styles.chatListContent}>
              <View style={styles.chatListHeader}>
                <Text style={styles.chatListName}>{item.name}</Text>
                <Text style={item.unread > 0 ? styles.chatListTimeUnread : styles.chatListTime}>{item.time}</Text>
              </View>
              <View style={styles.chatListHeader}>
                <Text style={styles.chatListMessage} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChatScreen;
