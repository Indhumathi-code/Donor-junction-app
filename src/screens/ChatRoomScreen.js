import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function ChatRoomScreen({ route, navigation }) {
  const { hospitalName } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', text: `Hello! Welcome to ${hospitalName}.`, sender: 'hospital' }
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.title}>{hospitalName}</Text>
        </View>
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.hospitalBubble]}>
              <Text style={item.sender === 'user' ? styles.userText : styles.hospitalText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 15 }}
        />
        <View style={styles.inputArea}>
          <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Type msg..." />
          <TouchableOpacity style={styles.send} onPress={sendMessage}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 10, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.PRIMARY },
  hospitalBubble: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0' },
  userText: { color: '#fff' },
  hospitalText: { color: '#000' },
  inputArea: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: '#fafafa', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  send: { width: 40, height: 40, backgroundColor: COLORS.PRIMARY, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
