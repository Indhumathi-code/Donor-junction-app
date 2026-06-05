import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function NewCampaignScreen({ navigation }) {
  // Empty states strictly relying on modern placeholders
  const [title, setTitle] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All groups');
  const [units, setUnits] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // Interactive picker state
  const [showBloodModal, setShowBloodModal] = useState(false);
  const bloodGroupsList = ['All groups', 'A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

  // Native Image Picker Selector
  const handlePickBannerImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need access to your photo gallery to upload a dynamic campaign banner image.'
        );
        return;
      }

      // Open gallery selection
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking campaign banner: ', err);
      Alert.alert('Error', 'Unable to access your photo gallery at this moment.');
    }
  };

  // Handle Publish Submit
  const handlePublish = async () => {
    if (!title.trim()) {
      return Alert.alert('Missing Field', 'Please enter a campaign title.');
    }
    if (!place.trim()) {
      return Alert.alert('Missing Field', 'Please enter a campaign location/place.');
    }
    if (!units.trim()) {
      return Alert.alert('Missing Field', 'Please specify the target collection units.');
    }
    if (!date.trim()) {
      return Alert.alert('Missing Field', 'Please enter a campaign date.');
    }
    if (!startTime.trim() || !endTime.trim()) {
      return Alert.alert('Missing Field', 'Please specify both start and end times.');
    }

    const targetUnits = parseInt(units.replace(/[^0-9]/g, '')) || 10;

    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const isUrgent = targetUnits >= 30;
      const statusText = isUrgent ? 'Urgent' : 'Active';
      const statusColor = isUrgent ? COLORS.RED_TEXT : COLORS.GREEN_TEXT;
      const statusBg = isUrgent ? COLORS.RED_BG : COLORS.GREEN_BG;

      const bodyData = {
        id: Date.now().toString(),
        org_mobile: mobile,
        title: title.trim(),
        date_time: `${date} • ${startTime.trim()} - ${endTime.trim()}`,
        place: place.trim(),
        status: statusText,
        status_color: statusColor,
        status_bg: statusBg,
        description: `${bloodGroup} needed • Target collection: ${targetUnits} Units`,
        collected: 0,
        target: targetUnits,
        image_uri: imageUri
      };

      const response = await fetch(`${API_URL}/create_campaign.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const resData = await response.json();

      if (resData.status !== 'success') {
        return Alert.alert('Publish Failed', resData.message || 'Unable to publish campaign.');
      }

      // Synchronize with local storage as fallback
      const stored = await AsyncStorage.getItem('campaignsList');
      let currentList = stored ? JSON.parse(stored) : [];

      const newCampaign = {
        id: bodyData.id,
        title: bodyData.title,
        date: bodyData.date_time,
        place: bodyData.place,
        status: bodyData.status,
        statusColor: bodyData.status_color,
        statusBg: bodyData.status_bg,
        description: bodyData.description,
        collected: bodyData.collected,
        target: bodyData.target,
        imageUri: bodyData.image_uri,
      };

      currentList.unshift(newCampaign);
      await AsyncStorage.setItem('campaignsList', JSON.stringify(currentList));

      // Route to CampaignDoneScreen
      navigation.replace('CampaignDone');
    } catch (e) {
      console.log('Error creating campaign: ', e);
      Alert.alert('Publish Error', 'Unable to register your blood drive campaign.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Banner */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Create campaign</Text>
        <Text style={styles.topbarSub}>Post a blood requirement</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        
        {/* Campaign Title */}
        <Text style={styles.label}>Campaign title</Text>
        <TextInput 
          style={styles.input} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="e.g. World Blood Day Apollo Drive"
          placeholderTextColor="#BBBBBB"
        />

        {/* Place of campaign */}
        <Text style={styles.label}>Place of campaign</Text>
        <TextInput 
          style={styles.input} 
          value={place} 
          onChangeText={setPlace} 
          placeholder="e.g. Apollo Hospital Main Auditorium"
          placeholderTextColor="#BBBBBB"
        />

        {/* Blood Group Picker Trigger */}
        <Text style={styles.label}>Blood group needed</Text>
        <TouchableOpacity 
          style={styles.dropdown} 
          onPress={() => setShowBloodModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>{bloodGroup}</Text>
          <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
        </TouchableOpacity>

        {/* Units Required */}
        <Text style={styles.label}>Units required (Target)</Text>
        <TextInput 
          style={styles.input} 
          value={units} 
          onChangeText={setUnits} 
          keyboardType="numeric"
          placeholder="e.g. 20"
          placeholderTextColor="#BBBBBB"
        />

        {/* Campaign Date */}
        <Text style={styles.label}>Date of campaign</Text>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.inputWithIcon} 
            value={date} 
            onChangeText={setDate} 
            placeholder="e.g. June 25, 2025"
            placeholderTextColor="#BBBBBB"
          />
          <Ionicons name="calendar-outline" size={16} color="#AAAAAA" style={styles.inputIcon} />
        </View>

        {/* Times Row */}
        <View style={styles.timesRow}>
          <View style={styles.timeCol}>
            <Text style={styles.label}>Start time</Text>
            <TextInput 
              style={styles.input} 
              value={startTime} 
              onChangeText={startTime => setStartTime(startTime)} 
              placeholder="e.g. 09:00 AM"
              placeholderTextColor="#BBBBBB"
            />
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.label}>End time</Text>
            <TextInput 
              style={styles.input} 
              value={endTime} 
              onChangeText={endTime => setEndTime(endTime)} 
              placeholder="e.g. 05:00 PM"
              placeholderTextColor="#BBBBBB"
            />
          </View>
        </View>

        {/* Image Upload Banner Selector */}
        <Text style={styles.label}>Add image banner</Text>
        {imageUri ? (
          <View style={styles.bannerWrapper}>
            <Image source={{ uri: imageUri }} style={styles.bannerPreview} />
            <TouchableOpacity 
              style={styles.changeBannerButton} 
              onPress={handlePickBannerImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.changeBannerText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.imageUpload} 
            onPress={handlePickBannerImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={24} color="#BBBBBB" />
            <Text style={styles.uploadText}>Tap to select banner from gallery</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handlePublish}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Publish Campaign</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Interactive Blood Group Modal Sheet */}
      <Modal
        visible={showBloodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBloodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Blood Group</Text>
              <TouchableOpacity onPress={() => setShowBloodModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={bloodGroupsList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setBloodGroup(item);
                    setShowBloodModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, bloodGroup === item && styles.modalOptionTextActive]}>
                    {item}
                  </Text>
                  {bloodGroup === item && (
                    <Ionicons name="checkmark" size={18} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
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
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    backgroundColor: '#FAFAFA',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  timesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
    flex: 1,
  },
  imageUpload: {
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    fontSize: 10,
    color: '#BBBBBB',
    marginTop: 4,
    fontWeight: '500',
  },
  bannerWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  bannerPreview: {
    width: '100%',
    height: 140,
  },
  changeBannerButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBannerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 24,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  secondaryButtonText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '500',
  },
  // Bottom Modal Sheet Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8F8F8',
  },
  modalOptionText: {
    fontSize: 13,
    color: '#555555',
  },
  modalOptionTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
});
