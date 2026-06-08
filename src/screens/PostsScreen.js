import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';
import Badge from '../components/Badge';

export default function PostsScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/get_posts.php`)
      .then(res => res.json())
      .then(data => { if(data.status==='success') setPosts(data.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Blood Posts</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{marginTop: 50}} /> : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Schedule', { post: item })}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Badge>{item.blood_group}</Badge>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { backgroundColor: COLORS.PRIMARY, padding: 20, paddingTop: 30 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { margin: 15, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardDesc: { color: '#666', marginTop: 5 }
});
