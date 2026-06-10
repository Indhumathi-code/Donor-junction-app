import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';
import { COLORS, API_URL } from '../constants/theme';
import { Badge } from '../components/common/CommonComponents';
import SupermanLoader from '../components/SupermanLoader';

import { useLoading } from '../contexts/LoadingContext';

const CampaignsScreen = ({ navigation, route }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    loadCampaigns();
    const unsubscribe = navigation.addListener('focus', () => {
      loadCampaigns();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      showLoading();
      const response = await fetch(`${API_URL}/get_campaigns.php`);
      const resData = await response.json();

      if (resData.status === 'success' && Array.isArray(resData.campaigns)) {
        setCampaigns(resData.campaigns);
      }
    } catch (error) {
      console.error('CampaignsScreen error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        hideLoading();
      }, 1500);
    }
  };

  const handleCampaignPress = (campaign) => {
    setSelectedCampaign(campaign);
    setDetailVisible(true);
  };

  const renderCampaignCard = ({ item }) => (
    <TouchableOpacity onPress={() => handleCampaignPress(item)}>
      <View style={campaignStyles.card}>
        <View style={campaignStyles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={campaignStyles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={campaignStyles.place} numberOfLines={1}>{item.place}</Text>
          </View>
          <Badge
            color={item.statusBg || '#ffeaea'}
            textColor={item.statusColor || '#A32D2D'}
          >
            {item.status}
          </Badge>
        </View>

        <View style={campaignStyles.cardBody}>
          <Text style={campaignStyles.description} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={campaignStyles.progressContainer}>
            <View style={campaignStyles.progressBar}>
              <View
                style={[
                  campaignStyles.progressFill,
                  {
                    width: `${Math.min(((item.collected || 0) / (item.target || 1)) * 100, 100)}%`,
                    backgroundColor: item.statusColor || '#DA0037'
                  }
                ]}
              />
            </View>
            <Text style={campaignStyles.progressText}>
              {item.collected || 0} / {item.target || 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <SupermanLoader text="Fetching campaigns..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <View style={[styles.topBar, styles.topBarRow]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>All Campaigns</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={campaigns}
        renderItem={renderCampaignCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={campaignStyles.list}
        ListEmptyComponent={
          <View style={campaignStyles.emptyContainer}>
            <Text style={campaignStyles.emptyText}>No campaigns available</Text>
          </View>
        }
      />

      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={campaignStyles.modalOverlay}>
          <View style={campaignStyles.modalContent}>
            <TouchableOpacity
              style={campaignStyles.closeButtonTop}
              onPress={() => setDetailVisible(false)}
            >
              <Ionicons name="close" size={28} color={COLORS.PRIMARY} />
            </TouchableOpacity>

            {selectedCampaign && (
              <View>
                <Text style={campaignStyles.modalTitle}>{selectedCampaign.title}</Text>
                <Text style={campaignStyles.modalPlace}>{selectedCampaign.place}</Text>
                <Badge
                  color={selectedCampaign.statusBg || '#ffeaea'}
                  textColor={selectedCampaign.statusColor || '#A32D2D'}
                >
                  {selectedCampaign.status}
                </Badge>

                <View style={campaignStyles.modalSection}>
                  <Text style={campaignStyles.sectionLabel}>Description</Text>
                  <Text style={campaignStyles.descriptionText}>
                    {selectedCampaign.description}
                  </Text>
                </View>

                <View style={campaignStyles.modalSection}>
                  <Text style={campaignStyles.sectionLabel}>Progress</Text>
                  <View style={campaignStyles.progressContainer}>
                    <View style={campaignStyles.progressBar}>
                      <View
                        style={[
                          campaignStyles.progressFill,
                          {
                            width: `${Math.min(
                              ((selectedCampaign.collected || 0) / (selectedCampaign.target || 1)) * 100,
                              100
                            )}%`,
                            backgroundColor: selectedCampaign.statusColor || '#DA0037'
                          }
                        ]}
                      />
                    </View>
                    <Text style={campaignStyles.progressLabel}>
                      {selectedCampaign.collected || 0} of {selectedCampaign.target || 0} units collected
                    </Text>
                  </View>
                </View>

                {selectedCampaign.date && (
                  <View style={campaignStyles.modalSection}>
                    <Text style={campaignStyles.sectionLabel}>Date & Time</Text>
                    <Text style={campaignStyles.descriptionText}>{selectedCampaign.date}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const campaignStyles = StyleSheet.create({
  list: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ececec',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  place: {
    fontSize: 12,
    color: '#666',
  },
  cardBody: {
    padding: 12,
  },
  description: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 10,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 50,
    maxHeight: '85%',
  },
  closeButtonTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  modalPlace: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  modalSection: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default CampaignsScreen;
