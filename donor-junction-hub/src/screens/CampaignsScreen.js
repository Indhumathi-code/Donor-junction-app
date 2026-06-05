import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
  Modal,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function CampaignsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [campaignsList, setCampaignsList] = useState([]);

  // Stepper Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [unitsToAdd, setUnitsToAdd] = useState(1);

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState(null);

  // Load campaigns from local storage and backend API
  const loadCampaigns = async () => {
    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const response = await fetch(`${API_URL}/get_campaigns.php?org_mobile=${mobile}`);
      const resData = await response.json();
      
      if (resData.status === 'success' && resData.campaigns) {
        setCampaignsList(resData.campaigns);
        await AsyncStorage.setItem('campaignsList', JSON.stringify(resData.campaigns));
      } else {
        const stored = await AsyncStorage.getItem('campaignsList');
        if (stored) {
          setCampaignsList(JSON.parse(stored));
        } else {
          // Seed default campaigns if storage is empty
          const initialList = [
            {
              id: '1',
              title: 'World Blood Day 2025',
              date: 'June 14 • 09:00 AM - 05:00 PM',
              place: 'Apollo Hospital Main Auditorium',
              status: 'Active',
              statusColor: COLORS.GREEN_TEXT,
              statusBg: COLORS.GREEN_BG,
              description: 'All blood groups • 50 donors registered',
              collected: 32,
              target: 50,
              imageUri: null,
            },
            {
              id: '2',
              title: 'A+ emergency drive',
              date: 'June 10–16 • 24 Hours Open',
              place: 'Chennai Central Blood Bank',
              status: 'Urgent',
              statusColor: COLORS.RED_TEXT,
              statusBg: COLORS.RED_BG,
              description: 'A+ only • 2 donors confirmed',
              collected: 3,
              target: 10,
              imageUri: null,
            },
            {
              id: '3',
              title: 'Monthly thalassemia donors',
              date: 'Recurring • 10:00 AM - 02:00 PM',
              place: 'Red Cross Society Clinic',
              status: 'Open',
              statusColor: COLORS.BLUE_TEXT,
              statusBg: COLORS.BLUE_BG,
              description: 'O- only • 5 regular donors',
              collected: 0,
              target: 5,
              imageUri: null,
            }
          ];
          await AsyncStorage.setItem('campaignsList', JSON.stringify(initialList));
          setCampaignsList(initialList);
        }
      }
    } catch (e) {
      console.log('Error loading campaigns list: ', e);
      // Fallback to local storage on network failure
      const stored = await AsyncStorage.getItem('campaignsList');
      if (stored) {
        setCampaignsList(JSON.parse(stored));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCampaigns();
    });
    return unsubscribe;
  }, [navigation]);

  // Open the detail modal
  const handleOpenDetailModal = (camp) => {
    setDetailCampaign(camp);
    setShowDetailModal(true);
  };

  // Open the collection stepper modal
  const handleOpenLogModal = (camp) => {
    setSelectedCampaign(camp);
    setUnitsToAdd(1);
    setShowLogModal(true);
  };

  // Perform progress math, backend update, and local storage saving
  const updateProgress = async (id, increment) => {
    try {
      let targetCampaign = campaignsList.find(c => c.id === id);
      if (!targetCampaign) return;

      const newCollected = targetCampaign.collected + increment;
      const isCompleted = newCollected >= targetCampaign.target;
      const updatedStatus = isCompleted ? 'Completed' : targetCampaign.status;
      const updatedStatusColor = isCompleted ? COLORS.GREEN_TEXT : targetCampaign.statusColor;
      const updatedStatusBg = isCompleted ? COLORS.GREEN_BG : targetCampaign.statusBg;

      const response = await fetch(`${API_URL}/update_campaign_progress.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          collected: newCollected,
          status: updatedStatus,
          status_color: updatedStatusColor,
          status_bg: updatedStatusBg
        })
      });

      const resData = await response.json();
      if (resData.status !== 'success') {
        return Alert.alert('Update Failed', resData.message || 'Unable to update progress.');
      }

      const updated = campaignsList.map((camp) => {
        if (camp.id === id) {
          return {
            ...camp,
            collected: newCollected,
            status: updatedStatus,
            statusColor: updatedStatusColor,
            statusBg: updatedStatusBg,
          };
        }
        return camp;
      });

      setCampaignsList(updated);
      await AsyncStorage.setItem('campaignsList', JSON.stringify(updated));

      // Pop success alert if goal achieved
      if (newCollected >= targetCampaign.target && targetCampaign.collected < targetCampaign.target) {
        setTimeout(() => {
          Alert.alert(
            "🏆 Target Completed!",
            `Congratulations! Your campaign "${targetCampaign.title}" has successfully reached 100% of its target collection goal!`
          );
        }, 300);
      }
    } catch (e) {
      console.log('Error updating campaign collections: ', e);
      Alert.alert('Network Error', 'Could not save the updated collections to the server.');
    }
  };

  const handleSaveCollection = async () => {
    if (!selectedCampaign) return;
    await updateProgress(selectedCampaign.id, unitsToAdd);
    setShowLogModal(false);
  };

  // Filter tabs
  const filteredCampaigns = campaignsList.filter((camp) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return camp.collected < camp.target;
    if (activeTab === 'Closed') return camp.collected >= camp.target;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>Campaigns</Text>
          <Text style={styles.topbarSub}>Blood donation drives</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('NewCampaign')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        {['All', 'Active', 'Closed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable Campaign list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {filteredCampaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No drives found under this section.</Text>
          </View>
        ) : (
          filteredCampaigns.map((camp) => {
            const progressPercent = Math.min((camp.collected / camp.target) * 100, 100);
            return (
              <TouchableOpacity 
                key={camp.id} 
                style={styles.card}
                onPress={() => handleOpenDetailModal(camp)}
                activeOpacity={0.9}
              >
                {/* 16:9 Uploaded Image Banner or Fallback */}
                {camp.imageUri ? (
                  <Image source={{ uri: camp.imageUri }} style={styles.cardBanner} />
                ) : (
                  <View style={styles.defaultBanner}>
                    <Ionicons name="water" size={32} color="rgba(255,255,255,0.4)" />
                  </View>
                )}

                <View style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>{camp.title}</Text>
                      
                      {/* Place & Time Details */}
                      <View style={styles.detailsRow}>
                        <Ionicons name="calendar-outline" size={10} color="#999999" />
                        <Text style={styles.cardSub}>{camp.date}</Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Ionicons name="pin" size={10} color={COLORS.PRIMARY} />
                        <Text style={[styles.cardSub, { color: COLORS.TEXT_DARK, fontWeight: '500' }]}>
                          {camp.place || 'Hospital Auditorium'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: camp.statusBg }]}>
                      <Text style={[styles.badgeText, { color: camp.statusColor }]}>{camp.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc}>{camp.description}</Text>

                  {/* Collection Dynamic Ratio and Progress Indicator */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    
                    <View style={styles.cardFooterRow}>
                      <Text style={styles.collectedRatioText}>
                        {camp.collected} / {camp.target} Units Collected ({Math.round(progressPercent)}%)
                      </Text>
                      
                      {progressPercent < 100 ? (
                        <TouchableOpacity 
                          style={styles.logButton} 
                          onPress={(e) => {
                            e.stopPropagation(); // Stop Detail modal from popping when clicking button directly!
                            handleOpenLogModal(camp);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="water" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                          <Text style={styles.logButtonText}>Log Collection</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.completedIndicator}>
                          <Ionicons name="checkmark-circle" size={13} color={COLORS.GREEN_TEXT} style={{ marginRight: 3 }} />
                          <Text style={styles.completedIndicatorText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Immersive Campaign Detail Modal */}
      {detailCampaign && (
        <Modal
          visible={showDetailModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailContent}>
              
              {/* Top Banner inside Details */}
              {detailCampaign.imageUri ? (
                <Image source={{ uri: detailCampaign.imageUri }} style={styles.detailBanner} />
              ) : (
                <View style={[styles.defaultDetailBanner, { backgroundColor: COLORS.PRIMARY }]}>
                  <Ionicons name="water" size={48} color="rgba(255,255,255,0.4)" />
                </View>
              )}

              {/* Float Close X Button */}
              <TouchableOpacity 
                style={styles.closeOverlayButton}
                onPress={() => setShowDetailModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.detailPadding}>
                {/* Header title */}
                <View style={styles.detailHeaderRow}>
                  <Text style={styles.detailTitle}>{detailCampaign.title}</Text>
                  <View style={[styles.badge, { backgroundColor: detailCampaign.statusBg }]}>
                    <Text style={[styles.badgeText, { color: detailCampaign.statusColor }]}>{detailCampaign.status}</Text>
                  </View>
                </View>

                {/* Location & Time details */}
                <View style={styles.detailMetaSection}>
                  <View style={styles.detailMetaRow}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.PRIMARY} style={{ width: 18 }} />
                    <Text style={styles.detailMetaText}>{detailCampaign.date}</Text>
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Ionicons name="pin" size={13} color={COLORS.PRIMARY} style={{ width: 18 }} />
                    <Text style={styles.detailMetaText}>{detailCampaign.place || 'Apollo Hospital Auditorium'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Target and Group specifications */}
                <Text style={styles.sectionLabel}>Drive Target Diagnostics</Text>
                <View style={styles.targetGrid}>
                  <View style={styles.targetCol}>
                    <Text style={styles.targetLabel}>Blood Group</Text>
                    <Text style={styles.targetValue}>
                      {detailCampaign.description.split(' ')[0] || 'All'}
                    </Text>
                  </View>
                  <View style={styles.targetCol}>
                    <Text style={styles.targetLabel}>Target Units</Text>
                    <Text style={styles.targetValue}>{detailCampaign.target} Bags</Text>
                  </View>
                  <View style={styles.targetCol}>
                    <Text style={styles.targetLabel}>Collected</Text>
                    <Text style={[styles.targetValue, { color: COLORS.GREEN_TEXT }]}>
                      {detailCampaign.collected} Bags
                    </Text>
                  </View>
                </View>

                {/* Progress bar and delta units display */}
                <View style={styles.detailProgressContainer}>
                  <View style={styles.detailProgressHeader}>
                    <Text style={styles.detailProgressLabel}>Target Goal Progress</Text>
                    <Text style={styles.detailProgressPercent}>
                      {Math.round(Math.min((detailCampaign.collected / detailCampaign.target) * 100, 100))}%
                    </Text>
                  </View>
                  
                  <View style={styles.detailProgressBarBg}>
                    <View 
                      style={[
                        styles.detailProgressBarFill, 
                        { width: `${Math.min((detailCampaign.collected / detailCampaign.target) * 100, 100)}%` }
                      ]} 
                    />
                  </View>

                  <Text style={styles.unitsLeftText}>
                    {detailCampaign.collected >= detailCampaign.target 
                      ? '🎉 Target Achieved! Great job!' 
                      : `🩸 ${detailCampaign.target - detailCampaign.collected} units left to collect`}
                  </Text>
                </View>

                {/* Modal Footer Buttons */}
                <View style={styles.detailActionRow}>
                  {detailCampaign.collected < detailCampaign.target && (
                    <TouchableOpacity 
                      style={styles.detailPrimaryButton}
                      onPress={() => {
                        setShowDetailModal(false);
                        setTimeout(() => handleOpenLogModal(detailCampaign), 350);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="water" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.detailPrimaryButtonText}>Log Collection</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.detailSecondaryButton, { flex: detailCampaign.collected < detailCampaign.target ? 0.5 : 1 }]}
                    onPress={() => setShowDetailModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailSecondaryButtonText}>Close Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Immersive Bottom-Sheet Stepper Modal */}
      {selectedCampaign && (
        <Modal
          visible={showLogModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLogModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Log Blood Collection</Text>
                  <Text style={styles.modalSub}>{selectedCampaign.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLogModal(false)}>
                  <Ionicons name="close" size={20} color={COLORS.TEXT_DARK} />
                </TouchableOpacity>
              </View>

              <View style={styles.stepperContainer}>
                <Text style={styles.stepperLabel}>Select Blood Bags Collected:</Text>
                
                <View style={styles.stepperRow}>
                  <TouchableOpacity 
                    style={styles.stepperButton} 
                    onPress={() => setUnitsToAdd(prev => Math.max(1, prev - 1))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color="#555555" />
                  </TouchableOpacity>

                  <View style={styles.stepperDisplay}>
                    <Text style={styles.stepperValue}>{unitsToAdd}</Text>
                    <Text style={styles.stepperUnits}>Units</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.stepperButton} 
                    onPress={() => setUnitsToAdd(prev => prev + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="#555555" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.targetSummaryText}>
                  Current: {selectedCampaign.collected} Units • New Total: {selectedCampaign.collected + unitsToAdd} / {selectedCampaign.target} Target Units
                </Text>

                <TouchableOpacity 
                  style={styles.saveActionButton}
                  onPress={handleSaveCollection}
                  activeOpacity={0.8}
                >
                  <Ionicons name="water" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveActionButtonText}>Save Collected Units</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  tabButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabButtonText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardBanner: {
    width: '100%',
    height: 120,
  },
  defaultBanner: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPadding: {
    padding: 12,
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
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardSub: {
    fontSize: 9,
    color: '#999999',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 10,
    color: '#555555',
    marginTop: 6,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#ECECEC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  collectedRatioText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777777',
  },
  logButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GREEN_BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.GREEN_TEXT,
  },
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  modalSub: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  stepperContainer: {
    padding: 16,
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 12,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplay: {
    alignItems: 'center',
    width: 100,
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  stepperUnits: {
    fontSize: 9,
    fontWeight: '600',
    color: '#999999',
    marginTop: 2,
  },
  targetSummaryText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  saveActionButton: {
    backgroundColor: COLORS.PRIMARY,
    width: '100%',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  saveActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Dynamic Campaign Details Panel Styling
  detailContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 28,
  },
  detailBanner: {
    width: '100%',
    height: 160,
  },
  defaultDetailBanner: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeOverlayButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  detailPadding: {
    padding: 16,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.TEXT_DARK,
    flex: 1,
    marginRight: 8,
  },
  detailMetaSection: {
    gap: 6,
    marginBottom: 14,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailMetaText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.BORDER,
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    marginBottom: 16,
  },
  targetCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetLabel: {
    fontSize: 9,
    color: '#999999',
    fontWeight: '600',
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.TEXT_DARK,
  },
  detailProgressContainer: {
    marginBottom: 20,
  },
  detailProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  detailProgressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  detailProgressBarBg: {
    height: 8,
    backgroundColor: '#ECECEC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailProgressBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  unitsLeftText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888888',
    marginTop: 6,
    textAlign: 'right',
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  detailPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  detailPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailSecondaryButton: {
    backgroundColor: '#F0F0F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  detailSecondaryButtonText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '600',
  },
});
