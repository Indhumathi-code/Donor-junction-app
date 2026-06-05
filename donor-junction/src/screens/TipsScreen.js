import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles as globalStyles } from '../styles/globalStyles';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const TipsScreen = ({ navigation }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  // Curated list of 10 Healthy Blood-Boosting Foods (Fruits, Vegetables & Healthy Non-Veg)
  const nutritionTips = [
    {
      id: 1,
      name: "Beetroot",
      type: "Vegetable",
      badgeColor: "#C2185B",
      tag: "Blood Builder",
      image: require('../assets/images/beet_root.png'),
      teaser: "Rich in active iron and folic acid to quickly increase red blood cells and purify blood.",
      nutrient: "Folic Acid, Iron, Nitrates",
      benefits: [
        "Extremely rich in plant-based iron and active folic acid.",
        "Helps repair and reactivate damaged red blood cells.",
        "Contains natural nitrates that improve blood flow and lower blood pressure.",
        "Acts as a powerful detoxifier for a cleaner bloodstream."
      ]
    },
    {
      id: 2,
      name: "Pomegranate",
      type: "Fruit",
      badgeColor: "#E91E63",
      tag: "Iron Rich",
      image: require('../assets/images/fruits_tips.png'),
      teaser: "Packed with iron, vitamins A, C, and E, it directly stimulates hemoglobin production.",
      nutrient: "Iron, Vitamin C, Folate",
      benefits: [
        "Stimulates red blood cell production due to rich iron content.",
        "High Vitamin C content improves iron absorption in your gut.",
        "Contains vital antioxidants that protect red blood cells from damage.",
        "Promotes better blood flow and overall cardiovascular health."
      ]
    },
    {
      id: 3,
      name: "Spinach",
      type: "Vegetable",
      badgeColor: "#4CAF50",
      tag: "Superfood",
      image: require('../assets/images/veg_tips.png'),
      teaser: "A legendary iron and folate superfood. Highly recommended to fight anemia.",
      nutrient: "Non-Heme Iron, Folate",
      benefits: [
        "Loaded with essential plant-based (non-heme) iron.",
        "Abundant in folic acid, vital for red blood cell synthesis.",
        "Contains carotenoids and Vitamin C to support tissue repair.",
        "Helps maintain optimal blood count and overall immune function."
      ]
    },
    {
      id: 4,
      name: "Lean Chicken",
      type: "Healthy Non-Veg",
      badgeColor: "#4788C7",
      tag: "Heme Iron",
      image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80",
      teaser: "A premier source of heme iron. Highly recommended to absorb iron efficiently.",
      nutrient: "Heme Iron, Protein, Vitamin B12",
      benefits: [
        "Highly efficient source of heme iron to quickly restore blood count.",
        "Avoid frying: consume grilled, boiled, or baked to keep it heart-healthy.",
        "Packed with lean protein for tissue repair, cell growth, and muscle strength.",
        "Rich in Vitamin B12, which is absolutely crucial for red blood cell production."
      ]
    },
    {
      id: 5,
      name: "Dates & Figs",
      type: "Fruit",
      badgeColor: "#5D4037",
      tag: "Anemia Shield",
      image: require('../assets/images/dates_tips.png'),
      teaser: "Packed with concentrated iron and calcium, dates are a sweet way to fight anemia.",
      nutrient: "Iron, Calcium, Magnesium",
      benefits: [
        "One of the richest, most concentrated sources of natural iron.",
        "Effectively combats anemia and chronic weakness.",
        "Fibers assist in steady metabolism and slow sugar release.",
        "Magnesium supports nerve transmission and muscle health."
      ]
    },
    {
      id: 6,
      name: "Apples",
      type: "Fruit",
      badgeColor: "#FF5252",
      tag: "Daily Wellness",
      image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
      teaser: "Rich in iron and fiber to naturally maintain healthy hemoglobin levels.",
      nutrient: "Iron, Vitamin C, Dietary Fiber",
      benefits: [
        "A reliable source of iron that aids in blood replenishment.",
        "High dietary fiber content keeps the digestive system healthy.",
        "Vitamin C content supports natural iron absorption.",
        "Provides dynamic natural energy to fight weakness and fatigue."
      ]
    },
    {
      id: 7,
      name: "Carrots",
      type: "Vegetable",
      badgeColor: "#FF7043",
      tag: "Iron Booster",
      image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
      teaser: "Rich in beta-carotenes that assist the body in storing and using iron.",
      nutrient: "Beta-Carotene, Vitamin A",
      benefits: [
        "Beta-carotene aids the body in absorbing and using iron efficiently.",
        "Essential for releasing stored iron into your bloodstream.",
        "Vitamins support cellular health and prevent red cell breakdown.",
        "Promotes strong circulation and healthy blood vessels."
      ]
    },
    {
      id: 8,
      name: "Broccoli",
      type: "Vegetable",
      badgeColor: "#388E3C",
      tag: "High Nutrient",
      image: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=600&auto=format&fit=crop&q=80",
      teaser: "A powerhouse containing iron, folate, and Vitamin C for comprehensive blood health.",
      nutrient: "Iron, Vitamin B9, Vitamin C",
      benefits: [
        "Combines iron and Vitamin C in a single natural source.",
        "Rich in B-complex vitamins (especially B9/folate) to synthesize blood cells.",
        "Supports calcium absorption to maintain overall body strength.",
        "Anti-inflammatory properties protect vascular health."
      ]
    },
    {
      id: 9,
      name: "Bananas",
      type: "Fruit",
      badgeColor: "#FBC02D",
      tag: "Blood Stimulant",
      image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",
      teaser: "Contains iron and potassium which naturally stimulates hemoglobin production in the blood.",
      nutrient: "Iron, Potassium, Vitamin B6",
      benefits: [
        "Directly stimulates synthesis of hemoglobin to maintain blood levels.",
        "Vitamin B6 content assists in red blood cell development.",
        "Rich in potassium to regulate blood pressure and muscle health.",
        "Perfect snack to replenish energy before and after blood donation."
      ]
    },
    {
      id: 10,
      name: "Oranges",
      type: "Fruit",
      badgeColor: "#E65100",
      tag: "Absorb Helper",
      image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=600&auto=format&fit=crop&q=80",
      teaser: "Extremely rich in Vitamin C, which is essential to absorb plant-based iron.",
      nutrient: "Vitamin C, Citric Acid, Folate",
      benefits: [
        "Crucial for absorbing iron from green vegetables and grains.",
        "Packed with active antioxidants that protect blood vessels.",
        "Enhances immune system defense mechanisms.",
        "Keeps the body hydrated and refreshed."
      ]
    }
  ];

  return (
    <SafeAreaView style={globalStyles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      
      {/* Top Header */}
      <View style={globalStyles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.topBarTitle}>Health tips</Text>
        <Text style={globalStyles.topBarSub}>Blood-Boosting Foods & Wellness</Text>
      </View>

      {/* Main Grid View */}
      <ScrollView style={{ flex: 1, marginTop: 10 }} contentContainerStyle={{ paddingBottom: 25 }}>
        <Text style={localStyles.tabHeaderTitle}>Essential Blood-Boosting Foods</Text>
        <Text style={localStyles.tabHeaderSubtitle}>Tap any card to view detailed health benefits and tips.</Text>
        
        <View style={localStyles.gridContainer}>
          {nutritionTips.map((item) => {
            const isRemoteUrl = typeof item.image === 'string' && (item.image.startsWith('http://') || item.image.startsWith('https://'));
            const imageSrc = isRemoteUrl ? { uri: item.image } : item.image;
            const isLocalAsset = !isRemoteUrl;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={localStyles.fruitCard}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.85}
              >
                <View style={[localStyles.cardImageContainer, isLocalAsset && { backgroundColor: '#F9FAFB' }]}>
                  <Image 
                    source={imageSrc} 
                    style={localStyles.cardImage} 
                    resizeMode={isLocalAsset ? "contain" : "cover"} 
                  />
                </View>
                <View style={localStyles.cardContent}>
                  <View style={localStyles.badgeRow}>
                    <View style={[localStyles.typeBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={localStyles.typeText}>{item.type}</Text>
                    </View>
                    <View style={localStyles.tagBadge}>
                      <Text style={localStyles.tagText}>{item.tag}</Text>
                    </View>
                  </View>
                  <Text style={localStyles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={localStyles.cardTeaser} numberOfLines={2}>{item.teaser}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Full Screen Details Modal */}
      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={localStyles.modalOverlay} edges={['top', 'right', 'bottom', 'left']}>
          <View style={localStyles.modalContent}>
            {selectedItem && (
              <>
                {(() => {
                  const isModalRemoteUrl = typeof selectedItem.image === 'string' && (selectedItem.image.startsWith('http://') || selectedItem.image.startsWith('https://'));
                  const modalImageSrc = isModalRemoteUrl ? { uri: selectedItem.image } : selectedItem.image;
                  return (
                    <View style={[localStyles.modalImageContainer, !isModalRemoteUrl && { backgroundColor: '#F9FAFB' }]}>
                      <Image 
                        source={modalImageSrc} 
                        style={localStyles.modalImage} 
                        resizeMode={isModalRemoteUrl ? "cover" : "contain"} 
                      />
                      <TouchableOpacity 
                        style={localStyles.closeBtn} 
                        onPress={() => setSelectedItem(null)}
                      >
                        <Ionicons name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })()}
                
                <ScrollView style={localStyles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={localStyles.modalHeaderRow}>
                    <View style={[localStyles.typeBadge, { backgroundColor: selectedItem.badgeColor, paddingHorizontal: 10, paddingVertical: 4 }]}>
                      <Text style={[localStyles.typeText, { fontSize: 11 }]}>{selectedItem.type}</Text>
                    </View>
                    <View style={[localStyles.tagBadge, { paddingHorizontal: 10, paddingVertical: 4 }]}>
                      <Text style={[localStyles.tagText, { fontSize: 11 }]}>{selectedItem.tag}</Text>
                    </View>
                  </View>

                  <Text style={localStyles.modalTitle}>{selectedItem.name}</Text>
                  <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 20 }}>{selectedItem.teaser}</Text>

                  {/* Nutrient Bar */}
                  <View style={localStyles.nutrientBar}>
                    <Ionicons name="nutrition" size={18} color={selectedItem.badgeColor} style={{ marginRight: 8 }} />
                    <Text style={localStyles.nutrientLabel}>Key Nutrients:</Text>
                    <Text style={localStyles.nutrientVal}>{selectedItem.nutrient}</Text>
                  </View>

                  <Text style={localStyles.sectionSubtitle}>Health Tips & Benefits</Text>
                  
                  {selectedItem.benefits.map((benefit, index) => (
                    <View key={index} style={localStyles.benefitItem}>
                      <Text style={[localStyles.benefitBullet, { color: selectedItem.badgeColor }]}>✓</Text>
                      <Text style={localStyles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                  
                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  tabHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 15,
    marginTop: 5,
  },
  tabHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 15,
    marginTop: 2,
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  fruitCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  cardImageContainer: {
    width: '100%',
    height: 110,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  tagBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
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
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  nutrientBar: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  nutrientLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#374151',
  },
  nutrientVal: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 5,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  benefitBullet: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  }
});

export default TipsScreen;
