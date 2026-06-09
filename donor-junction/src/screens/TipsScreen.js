import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { nutritionTips } from '../data/nutritionTipsData';

const TipsScreen = ({ navigation }) => {
  const [selectedItem, setSelectedItem] = useState(null);



  return (
    <SafeAreaView style={[styles.container, { flex: 1, height: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', backgroundColor: '#DA0037' }]} edges={['top', 'right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor="#DA0037" />

      <View style={{ flex: 1, backgroundColor: '#FFF9FA' }}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: '#DA0037', borderBottomWidth: 0 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Health Tips</Text>
          <View style={{ width: 24 }} />
        </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, backgroundColor: '#FFF9FA' }}>
        {/* Main List View */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 15 }}>
          {nutritionTips.map((item) => {
            const isRemoteUrl = typeof item.image === 'string' && (item.image.startsWith('http://') || item.image.startsWith('https://'));
            const imageSrc = isRemoteUrl ? { uri: item.image } : item.image;
            const isLocalAsset = !isRemoteUrl;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.85}
              >
                <View style={[styles.cardImageContainer, isLocalAsset && { backgroundColor: '#F9FAFB' }]}>
                  <Image
                    source={imageSrc}
                    style={styles.cardImage}
                    resizeMode={isLocalAsset ? "contain" : "cover"}
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardTeaser} numberOfLines={2}>{item.teaser}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Full Screen Details Modal */}
      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={[styles.modalOverlay, { flex: 1, height: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', backgroundColor: '#DA0037' }]} edges={['top', 'right', 'bottom', 'left']}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: '#DA0037', borderBottomWidth: 0 }]}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: '#FFFFFF' }]}>Health Tips</Text>
            <View style={{ width: 24 }} /> {/* Balancer */}
          </View>

          {/* Modal Content Area */}
          <View style={{ flex: 1, backgroundColor: '#FFF9FA' }}>
            {selectedItem && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Centered Image */}
                <View style={styles.detailImageContainer}>
                  {(() => {
                    const isModalRemoteUrl = typeof selectedItem.image === 'string' && (selectedItem.image.startsWith('http://') || selectedItem.image.startsWith('https://'));
                    const modalImageSrc = isModalRemoteUrl ? { uri: selectedItem.image } : selectedItem.image;
                    return (
                      <Image
                        source={modalImageSrc}
                        style={styles.detailImage}
                        resizeMode={isModalRemoteUrl ? "cover" : "contain"}
                      />
                    );
                  })()}
                </View>

                {/* Title */}
                <Text style={styles.detailTitle}>{selectedItem.name}</Text>

                {/* Description Paragraphs */}
                <View style={styles.paragraphsContainer}>
                  {/* Teaser */}
                  <Text style={styles.paragraphText}>{selectedItem.teaser}</Text>

                  {/* Key Nutrients */}
                  <View style={styles.nutrientBar}>
                    <Ionicons name="nutrition" size={18} color={selectedItem.badgeColor} style={{ marginRight: 8 }} />
                    <Text style={styles.nutrientLabel}>Key Nutrients: </Text>
                    <Text style={styles.nutrientVal}>{selectedItem.nutrient}</Text>
                  </View>

                  {/* Benefits as Paragraphs */}
                  {selectedItem.benefits.map((benefit, idx) => (
                    <Text key={idx} style={styles.paragraphText}>
                      {benefit}
                    </Text>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DA0037',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3EAEB',
    // Shadow
    shadowColor: '#DA0037',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAF5F6',
    borderWidth: 1,
    borderColor: '#F3EAEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
  },
  tagBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardTeaser: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFF9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalBackBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DA0037',
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
  },
  detailImageContainer: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: '#DA0037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '90%',
    height: '90%',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DA0037',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraphsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  paragraphText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 23,
    marginBottom: 20,
    textAlign: 'left',
  },
  nutrientBar: {
    backgroundColor: '#FAF5F6',
    borderWidth: 1,
    borderColor: '#F3EAEB',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  nutrientLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#374151',
  },
  nutrientVal: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
});

export default TipsScreen;
