import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function ChatDetailScreen({ route, navigation }) {
  const { donor } = route.params || {};

  const defaultDonor = {
    id: 1,
    name: 'Ravi Kumar',
    initials: 'RK',
    bloodGroup: 'A+',
    distance: '2.3 km',
    status: 'Eligible'
  };

  const activeDonor = donor || defaultDonor;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const messagesCountRef = useRef(0);

  // Fetch messages from database backend
  const fetchMessages = async (forceScroll = false) => {
    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const response = await fetch(`${API_URL}/get_messages.php?donor_id=${activeDonor.id}&org_mobile=${mobile}`);
      const resData = await response.json();

      if (resData.status === 'success') {
        const prevCount = messagesCountRef.current;
        const currentCount = resData.messages.length;
        messagesCountRef.current = currentCount;
        setMessages(resData.messages);
        
        if (forceScroll || prevCount === 0 || currentCount > prevCount) {
          // Scroll to end
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
      }
    } catch (e) {
      console.log('Error loading messages: ', e);
      if (messagesCountRef.current === 0) {
        setMessages([]);
      }
    }
  };

  useEffect(() => {
    fetchMessages(true);
    
    // Refresh chat periodically (every 4 seconds) to simulate real-time chat sync!
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const msgText = inputText.trim();
    setInputText('');
    inputRef.current?.focus();

    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const response = await fetch(`${API_URL}/send_message.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donor_id: activeDonor.id.toString(),
          org_mobile: mobile,
          message_text: msgText,
          is_me: 1
        })
      });

      const resData = await response.json();
      if (resData.status === 'success') {
        const newMsg = {
          id: resData.data.id,
          text: resData.data.text,
          me: resData.data.me
        };
        setMessages((prev) => {
          const updated = [...prev, newMsg];
          messagesCountRef.current = updated.length;
          return updated;
        });
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Send Failed', resData.message || 'Unable to send message.');
      }
    } catch (e) {
      console.log('Error sending message: ', e);
      Alert.alert('Network Error', 'Could not connect to server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{activeDonor.initials}</Text>
          </View>
          <View>
            <Text style={styles.topbarTitle}>{activeDonor.name}</Text>
            <Text style={styles.topbarSub}>
              {activeDonor.bloodGroup} • {activeDonor.distance} • {activeDonor.status}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.7}>
          <Ionicons name="call" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages Bubbles stream */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          style={{
            flex: 1,
            height: Platform.OS === 'web' ? 'calc(100vh - 110px)' : '100%',
            overflowY: Platform.OS === 'web' ? 'auto' : undefined
          }}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrapper, item.me ? styles.meWrapper : styles.themWrapper]}>
              <View style={[styles.bubble, item.me ? styles.meBubble : styles.themBubble]}>
                <Text style={[styles.bubbleText, item.me ? styles.meText : styles.themText]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Input Bar Footer */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#BBBBBB"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
  },
  topbar: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    paddingRight: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 9,
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
  keyboardContainer: {
    flex: 1,
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
  },
  messageList: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  meWrapper: {
    justifyContent: 'flex-end',
  },
  themWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '78%',
  },
  meBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 2,
  },
  themBubble: {
    backgroundColor: '#F1F1F1',
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 16,
  },
  meText: {
    color: '#FFFFFF',
  },
  themText: {
    color: COLORS.TEXT_DARK,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.5,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  sendButton: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
