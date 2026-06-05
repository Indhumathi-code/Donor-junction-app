import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const chatThreads = [
  { id: '1', name: 'Apollo Hospital', lastMessage: 'Hello! Welcome to Apollo Hospital. How can we assist you with blood donation today?', time: '9:49 AM', unread: 0, online: true },
  { id: '2', name: 'Vadamalayan Hospital', lastMessage: 'Please confirm your appointment.', time: 'Yesterday', unread: 0, online: false },
];

export default function ChatScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Chats</Text>
      </View>
      <FlatList
        data={chatThreads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem} 
            onPress={() => navigation.navigate('ChatRoom', { hospitalName: item.name, threadId: item.id })}
          >
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.msg} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chatItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  name: { fontWeight: 'bold', fontSize: 16 },
  msg: { color: '#666', fontSize: 14 }
});
