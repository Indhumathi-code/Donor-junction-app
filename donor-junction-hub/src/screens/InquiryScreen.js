import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function InquiryScreen({ navigation }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchInquiries();
    const unsubscribe = navigation.addListener('focus', fetchInquiries);
    return unsubscribe;
  }, [navigation]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/get_posts.php`);
      const result = await response.json();
      if (result.status === 'success') {
        const mapped = result.data.map(item => ({
          id: item.id,
          title: item.title,
          info: `From: ${item.mobile || 'Unknown'} • ${item.location}`,
          status: item.type === 'urgent' ? 'Urgent' : 'Normal',
          statusColor: item.type === 'urgent' ? COLORS.RED_TEXT : COLORS.GREEN_TEXT,
          statusBg: item.type === 'urgent' ? COLORS.RED_BG : COLORS.GREEN_BG,
          description: item.description || `Needs ${item.units_needed || 'blood'} of ${item.blood_group}`,
          mobile: item.mobile,
          blood_group: item.blood_group,
          units_needed: item.units_needed || '1 unit',
          location: item.location
        }));
        setInquiries(mapped);
      }
    } catch (e) {
      console.error('Error fetching inquiries:', e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View style={styles.topbarHeaderLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topbarTitle}>Inquiries</Text>
            <Text style={styles.topbarSub}>Blood requirement requests</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.topbarButton} activeOpacity={0.7}>
          <Ionicons name="funnel-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Inquiry List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {inquiries.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>No blood posts available.</Text>
          ) : (
            inquiries.map((inq) => (
              <TouchableOpacity
                key={inq.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedInquiry(inq);
                  setModalVisible(true);
                }}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleCol}>
                    <Text style={styles.cardTitle}>{inq.title}</Text>
                    <Text style={styles.cardSub}>{inq.info}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: inq.statusBg }]}>
                    <Text style={[styles.badgeText, { color: inq.statusColor }]}>{inq.status}</Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{inq.description}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            
            {selectedInquiry && (
              <View>
                <Text style={styles.modalTitle}>{selectedInquiry.title}</Text>
                <Text style={styles.modalSub}>{selectedInquiry.info}</Text>
                
                <View style={styles.modalDetailRow}>
                  <View style={styles.modalDetailBox}>
                    <Text style={styles.modalDetailLabel}>Blood Group</Text>
                    <Text style={styles.modalDetailValue}>{selectedInquiry.blood_group || 'Unknown'}</Text>
                  </View>
                  <View style={styles.modalDetailBox}>
                    <Text style={styles.modalDetailLabel}>Units</Text>
                    <Text style={styles.modalDetailValue}>{selectedInquiry.units_needed}</Text>
                  </View>
                </View>
                
                <View style={{ marginTop: 15 }}>
                  <Text style={styles.modalDescLabel}>Location</Text>
                  <Text style={styles.modalDesc}>{selectedInquiry.location || 'Unknown'}</Text>
                </View>

                <View style={{ marginTop: 15 }}>
                  <Text style={styles.modalDescLabel}>Description</Text>
                  <Text style={styles.modalDesc}>{selectedInquiry.description}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => {
                    setModalVisible(false);
                    if (selectedInquiry.mobile) {
                      navigation.navigate('ChatDetail', { 
                        donor: { 
                          id: selectedInquiry.mobile, 
                          name: selectedInquiry.title,
                          initials: selectedInquiry.title.substring(0, 2).toUpperCase() || 'US',
                          bloodGroup: selectedInquiry.blood_group || 'Unknown',
                          distance: 'Unknown',
                          status: 'Active'
                        } 
                      });
                    } else {
                      alert("This post doesn't have a valid mobile number attached.");
                    }
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.chatBtnText}>Chat with Poster</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  topbarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingRight: 4,
  },
  topbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 10,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  cardSub: {
    fontSize: 9,
    color: '#999999',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 11,
    color: '#555555',
    marginTop: 6,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 30,
    minHeight: '40%',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
    paddingRight: 20,
  },
  modalSub: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    gap: 15,
  },
  modalDetailBox: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  modalDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  modalDescLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  chatBtn: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
  },
  chatBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  }
});
