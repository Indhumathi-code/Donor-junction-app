import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';

const globalChatMessages = {
  '1': [
    { id: '1', text: 'Hello! Welcome to Apollo Hospital. How can we assist you with blood donation today?', sender: 'hospital' }
  ],
  '2': [
    { id: '1', text: 'Hello! Welcome to Vadamalayan Hospital. How can we assist you with blood donation today?', sender: 'hospital' }
  ],
  '3': [
    { id: '1', text: 'Hello! Welcome to Meenakshi Mission. How can we assist you with blood donation today?', sender: 'hospital' }
  ]
};

const ChatRoomScreen = ({ route, navigation }) => {
  const { hospitalName = "Apollo Hospital", online = true, threadId = '1' } = route.params || {};
  const partnerMobile = route.params?.partnerMobile || route.params?.mobile || hospitalName;
  const partnerType = route.params?.partnerType || (route.params?.mobile ? 'user' : 'hospital');
  const flatListRef = useRef(null);
  const user = route.params?.user || { phone: '9999999999', name: 'Donor' };
  const resolvedPhone = user.mobile || user.phone || '9999999999';
  const [userPhone, setUserPhone] = useState(resolvedPhone);

  const [messages, setMessagesState] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const loadUserPhone = async () => {
      if (resolvedPhone && resolvedPhone !== '9999999999') return;
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && (parsed.mobile || parsed.phone)) {
            setUserPhone(parsed.mobile || parsed.phone);
            return;
          }
        }
        const phone = await AsyncStorage.getItem('user_phone');
        if (phone) {
          setUserPhone(phone);
        }
      } catch (e) {
        console.error("Error loading user phone:", e);
      }
    };
    loadUserPhone();
  }, [user]);

  useEffect(() => {
    let intervalId;
    const loadMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/chat_messages.php?user_phone=${encodeURIComponent(userPhone)}&partner_mobile=${encodeURIComponent(partnerMobile)}&partner_name=${encodeURIComponent(hospitalName)}`);
        const result = await response.json();

        if (result.status === 'success') {
          const formattedMsgs = result.data.map(m => ({
            id: m.id.toString(),
            text: m.message,
            sender: m.sender // 'user' or 'partner'
          }));

          if (formattedMsgs.length === 0) {
            setMessagesState([
              { id: '1', text: `Hello! Welcome to ${hospitalName}. How can we assist you with blood donation today?`, sender: 'partner' }
            ]);
          } else {
            setMessagesState(formattedMsgs);
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    const startPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      loadMessages();
      intervalId = setInterval(loadMessages, 4000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', startPolling);
    const unsubscribeBlur = navigation.addListener('blur', stopPolling);

    // Initial check
    startPolling();

    return () => {
      stopPolling();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, hospitalName, userPhone, partnerMobile]);

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const userText = inputText.trim();
    if (!userText) return;

    const activePhone = userPhone || '9999999999';

    // Save user message to database
    await fetch(`${API_URL}/chat_messages.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_phone: activePhone,
        partner_name: hospitalName,
        partner_mobile: partnerMobile,
        partner_type: partnerType,
        sender: 'user',
        message: userText
      })
    });

    const newUserMessage = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessagesState(prev => [...prev, newUserMessage]);
    setInputText('');
  };

  const clearChat = async () => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete all messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: async () => {
            try {
              const activePhone = userPhone || '9999999999';
              const response = await fetch(`${API_URL}/chat_messages.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'delete',
                  user_phone: activePhone,
                  partner_mobile: partnerMobile,
                  partner_name: hospitalName
                })
              });
              const result = await response.json();
              if (result.status === 'success') {
                setMessagesState([]);
                Alert.alert("Success", "Chat deleted successfully!");
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete chat");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View style={[styles.topBar, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })} style={{ marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>{hospitalName.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.chatTitle}>{hospitalName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <View style={[styles.miniStatusDot, { backgroundColor: online ? '#4CD964' : '#999' }]} />
                <Text style={styles.chatSubTitle}>{online ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={{ padding: 5 }}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.sender === 'user' ? styles.messageUser : styles.messageHospital
            ]}>
              <Text style={item.sender === 'user' ? styles.messageTextUser : styles.messageTextHospital}>
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={isTyping ? (
            <View style={[styles.messageBubble, styles.messageHospital, { paddingVertical: 8, marginTop: 5 }]}>
              <Text style={[styles.messageTextHospital, { fontStyle: 'italic', color: '#888' }]}>typing...</Text>
            </View>
          ) : null}
        />

        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;
