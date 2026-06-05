import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TipsScreen = ({ navigation }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  // Original curated list of 10 Healthy Blood-Boosting Foods (restored)
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
    <SafeAreaView style={[styles.container, { flex: 1, height: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%' }]} edges={['top', 'right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#DA0037" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Tips</Text>
        <View style={{ width: 24 }} /> {/* Balancer */}
      </View>

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

      {/* Full Screen Details Modal */}
      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={[styles.modalOverlay, { flex: 1, height: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%' }]} edges={['top', 'right', 'bottom', 'left']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Health Tips</Text>
            <View style={{ width: 24 }} /> {/* Balancer */}
          </View>

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
