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
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, API_URL } from '../constants/theme';

export default function RegisterScreen({ route, navigation }) {
  const [step, setStep] = useState(1);

  // Form State - Empty defaults, prefilled with passed number if available
  const passedMobile = route.params?.mobileNumber || '';
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [license, setLicense] = useState('');
  const [mobile, setMobile] = useState(passedMobile);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  // Progressive geocoding helper that matches exactly to the pincode first
  const geocodeAddressWithFallback = async (addressText, cityText, pincodeText) => {
    // Helper for Nominatim (works on web without API keys)
    const geocodeNominatim = async (query) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'DonorJunctionApp/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
          return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
      } catch (e) {
        console.log('Nominatim fallback failed:', e);
      }
      return null;
    };

    // 1. Try geocoding the pincode + city first
    try {
      const pinQuery = `${pincodeText.trim()}, ${cityText.trim()}, India`;
      console.log('RegisterScreen: Progressive Geocoder trying Pincode query:', pinQuery);
      
      let results;
      if (Platform.OS !== 'web') {
         results = await Location.geocodeAsync(pinQuery);
      }
      if (results && results.length > 0) {
        return results[0];
      } else {
        const nomRes = await geocodeNominatim(pinQuery);
        if (nomRes) return nomRes;
      }
    } catch (e) {
      console.log('RegisterScreen: Pincode query geocode failed:', e);
    }

    // 2. Fallback to full address query
    try {
      const fullQuery = `${addressText.trim()}, ${cityText.trim()}, ${pincodeText.trim()}`;
      console.log('RegisterScreen: Progressive Geocoder trying Full Address query:', fullQuery);
      let results;
      if (Platform.OS !== 'web') {
         results = await Location.geocodeAsync(fullQuery);
      }
      if (results && results.length > 0) {
        return results[0];
      } else {
        const nomRes = await geocodeNominatim(fullQuery);
        if (nomRes) return nomRes;
      }
    } catch (e) {
      console.log('RegisterScreen: Full address query geocode failed:', e);
    }

    // 3. Fallback to just city
    try {
      const cityQuery = `${cityText.trim()}, India`;
      console.log('RegisterScreen: Progressive Geocoder trying City query:', cityQuery);
      let results;
      if (Platform.OS !== 'web') {
         results = await Location.geocodeAsync(cityQuery);
      }
      if (results && results.length > 0) {
        return results[0];
      } else {
        const nomRes = await geocodeNominatim(cityQuery);
        if (nomRes) return nomRes;
      }
    } catch (e) {
      console.log('RegisterScreen: City query geocode failed:', e);
    }

    return null;
  };

  // Document Upload States
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedDocUri, setSelectedDocUri] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('image'); // 'image' or 'pdf'

  // Category Picker State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const categoriesList = ['Hospital', 'Blood Bank', 'NGO', 'Clinic'];

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) return Alert.alert('Missing Field', 'Please enter your organization name.');
      if (!category) return Alert.alert('Missing Field', 'Please select your organization category.');
      if (!license.trim()) return Alert.alert('Missing Field', 'Please enter your license number.');
      if (!mobile.trim()) return Alert.alert('Missing Field', 'Please enter your mobile number.');
    }

    if (step === 2) {
      if (!address.trim()) return Alert.alert('Missing Field', 'Please enter your address.');
      if (!city.trim()) return Alert.alert('Missing Field', 'Please enter your city.');
      if (!pincode.trim()) return Alert.alert('Missing Field', 'Please enter your pincode.');

      if (latitude === '' || longitude === '') {
        setGeocodeLoading(true);
        try {
          const coords = await geocodeAddressWithFallback(address, city, pincode);
          if (coords) {
            setLatitude(coords.latitude.toString());
            setLongitude(coords.longitude.toString());
            console.log('RegisterScreen: Address geocoded to coordinates matching pincode:', coords.latitude, coords.longitude);
          } else {
            console.log('RegisterScreen: No geocode results found, falling back to default Chennai coordinates.');
            setLatitude('13.0601');
            setLongitude('80.2506');
          }
        } catch (err) {
          console.log('RegisterScreen: Geocoding error during step 2 Next:', err);
          // Resilient fallback to avoid blocking registration flow
          setLatitude('13.0601');
          setLongitude('80.2506');
        } finally {
          setGeocodeLoading(false);
        }
      }
    }

    if (step === 3) {
      if (!fileUploaded) return Alert.alert('Document Required', 'Please upload a license copy to proceed.');

      try {
        // Save the phone number as registered so they don't have to register again
        const cleaned = mobile.replace(/[\s\-_]/g, '');
        if (cleaned) {
          const bodyData = {
            id: cleaned,
            name: name.trim(),
            category: category,
            license: license.trim(),
            mobile: cleaned,
            city: city.trim(),
            address: address.trim(),
            pincode: pincode.trim(),
            doc_uri: selectedDocUri,
            doc_type: selectedDocType,
            doc_name: selectedDocType === 'pdf' ? 'org_license_credential.pdf' : 'org_license_credential.jpg',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null
          };

          const response = await fetch(`${API_URL}/register_organization.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
          });

          const resData = await response.json();

          if (resData.status !== 'success') {
            return Alert.alert('Registration Failed', resData.message || 'Unable to register organization.');
          }

          // 🌟 Save active logged-in mobile number first!
          await AsyncStorage.setItem('loggedInMobile', cleaned);

          const stored = await AsyncStorage.getItem('registeredNumbers');
          let registeredList = stored ? JSON.parse(stored) : [];
          if (!registeredList.includes(cleaned)) {
            registeredList.push(cleaned);
            await AsyncStorage.setItem('registeredNumbers', JSON.stringify(registeredList));
          }

          // 🌟 Auto-Sync registered organisation details & license document directly to Settings, uniquely scoped by the mobile number!
          await AsyncStorage.setItem(`orgName_${cleaned}`, name.trim());
          await AsyncStorage.setItem(`orgAddress_${cleaned}`, address.trim());
          await AsyncStorage.setItem(`orgLocation_${cleaned}`, `${city.trim()} • ${category}`);
          await AsyncStorage.setItem(`orgCity_${cleaned}`, city.trim());
          await AsyncStorage.setItem(`orgLicense_${cleaned}`, license.trim());
          await AsyncStorage.setItem(`orgCategory_${cleaned}`, category);
          await AsyncStorage.setItem(`orgStatus_${cleaned}`, 'pending');
          await AsyncStorage.setItem(`orgDocUri_${cleaned}`, selectedDocUri);
          await AsyncStorage.setItem(`orgDocType_${cleaned}`, selectedDocType);
          await AsyncStorage.setItem(`orgDocName_${cleaned}`, selectedDocType === 'pdf' ? 'org_license_credential.pdf' : 'org_license_credential.jpg');
          if (latitude) {
            await AsyncStorage.setItem(`orgLatitude_${cleaned}`, latitude.toString());
          }
          if (longitude) {
            await AsyncStorage.setItem(`orgLongitude_${cleaned}`, longitude.toString());
          }

          // 🌟 Add to the pendingOrganisations list so they show up in the Super Admin dashboard verification queue
          const storedPending = await AsyncStorage.getItem('pendingOrganisations');
          let pendingList = storedPending ? JSON.parse(storedPending) : [];
          if (!pendingList.some(item => item.id === cleaned)) {
            pendingList.push({
              id: cleaned,
              name: name.trim(),
              category: category,
              license: license.trim(),
              mobile: cleaned,
              city: city.trim(),
              address: address.trim(),
              status: 'pending'
            });
            await AsyncStorage.setItem('pendingOrganisations', JSON.stringify(pendingList));
          }

          // 🌟 Clean slate clear for old profile photo & extra documents scoped specifically to this brand new mobile number!
          await AsyncStorage.removeItem(`orgPhotoUri_${cleaned}`);
          await AsyncStorage.removeItem(`extraDocs_${cleaned}`);
        }

        // Set as logged in so they bypass the login page
        await AsyncStorage.setItem('isLoggedIn', 'true');
      } catch (e) {
        console.log('Error saving registration session: ', e);
        return Alert.alert('Network Error', 'Could not connect to the server to complete registration.');
      }

      navigation.replace('Pending');
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  // Image Picker Upload Handler (100% crash-proof using precompiled core elements)
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to upload your license certificate.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const defaultName = selectedDocType === 'pdf' ? 'org_license_credential.pdf' : 'org_license_credential.jpg';

        setSelectedDocUri(uri);
        setFileName(defaultName);
        setFileUploaded(true);
      }
    } catch (error) {
      console.log('Error picking image: ', error);
      Alert.alert('Upload Failed', 'There was an error accessing your gallery.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Banner */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>
          {step === 3 ? 'Document upload' : 'Register organisation'}
        </Text>
        <Text style={styles.topbarSub}>
          {step === 1 && 'Step 1 of 3 — Basic details'}
          {step === 2 && 'Step 2 of 3 — Location & address'}
          {step === 3 && 'Step 3 of 3 — Verification docs'}
        </Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, step >= 1 && styles.dotActive, step === 1 && styles.dotCurrent]} />
        <View style={[styles.dot, step >= 2 && styles.dotActive, step === 2 && styles.dotCurrent]} />
        <View style={[styles.dot, step >= 3 && styles.dotActive, step === 3 && styles.dotCurrent]} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {step === 1 && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Organisation name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Apollo Hospital"
              placeholderTextColor="#BBBBBB"
            />

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, !category && styles.placeholderText]}>
                {category || 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
            </TouchableOpacity>

            <Text style={styles.label}>License number</Text>
            <TextInput
              style={styles.input}
              value={license}
              onChangeText={setLicense}
              placeholder="e.g. TN-MED-2024-00872"
              placeholderTextColor="#BBBBBB"
            />

            <Text style={styles.label}>Mobile number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
                placeholder="98400 12345"
                placeholderTextColor="#BBBBBB"
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={2}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 21, Greams Road, Thousand Lights"
              placeholderTextColor="#BBBBBB"
            />

            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Chennai, Tamil Nadu"
              placeholderTextColor="#BBBBBB"
            />

            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={pincode}
              onChangeText={setPincode}
              placeholder="e.g. 600006"
              placeholderTextColor="#BBBBBB"
              maxLength={6}
            />

            <Text style={styles.label}>Latitude (Manual / Auto-detected)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
              placeholder="e.g. 13.0601"
              placeholderTextColor="#BBBBBB"
            />

            <Text style={styles.label}>Longitude (Manual / Auto-detected)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
              placeholder="e.g. 80.2506"
              placeholderTextColor="#BBBBBB"
            />

            <TouchableOpacity 
              style={styles.geocodeButton} 
              onPress={async () => {
                if (!address.trim() || !city.trim() || !pincode.trim()) {
                  return Alert.alert('Missing Info', 'Please enter address, city and pincode first.');
                }
                setGeocodeLoading(true);
                try {
                  const coords = await geocodeAddressWithFallback(address, city, pincode);
                  if (coords) {
                    setLatitude(coords.latitude.toString());
                    setLongitude(coords.longitude.toString());
                    Alert.alert('Success', 'Coordinates auto-detected successfully from pincode!');
                  } else {
                    Alert.alert('Not Found', 'Could not locate coordinates matching this pincode. Please enter manually.');
                  }
                } catch (e) {
                  Alert.alert('Error', 'Geocoding failed. Please enter manually.');
                } finally {
                  setGeocodeLoading(false);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.geocodeButtonText}>Auto-Detect Coordinates</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.formContainer}>
            <Text style={styles.choiceHeader}>Choose document type to upload:</Text>

            {/* Interactive PDF vs JPG Toggle */}
            <View style={styles.choiceWrapper}>
              <TouchableOpacity
                style={[styles.choiceBtn, selectedDocType === 'image' && styles.choiceBtnActive]}
                onPress={() => {
                  setSelectedDocType('image');
                  setFileUploaded(false);
                  setFileName('');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="image"
                  size={16}
                  color={selectedDocType === 'image' ? '#FFFFFF' : COLORS.PRIMARY}
                />
                <Text style={[styles.choiceBtnText, selectedDocType === 'image' && styles.choiceBtnTextActive]}>
                  JPG Document
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, selectedDocType === 'pdf' && styles.choiceBtnActive]}
                onPress={() => {
                  setSelectedDocType('pdf');
                  setFileUploaded(false);
                  setFileName('');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="document"
                  size={16}
                  color={selectedDocType === 'pdf' ? '#FFFFFF' : COLORS.PRIMARY}
                />
                <Text style={[styles.choiceBtnText, selectedDocType === 'pdf' && styles.choiceBtnTextActive]}>
                  PDF Document
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gallery Upload Card */}
            <TouchableOpacity style={styles.uploadArea} onPress={pickImage} activeOpacity={0.7}>
              <Ionicons name="cloud-upload-outline" size={28} color={COLORS.PRIMARY} />
              <Text style={styles.uploadTitle}>
                {fileUploaded ? 'Change uploaded license copy' : 'Upload license copy'}
              </Text>
              <Text style={styles.uploadSubtitle}>
                Tap to pick {selectedDocType === 'pdf' ? 'PDF Screenshot' : 'JPG Photo'} • Max 5MB
              </Text>
            </TouchableOpacity>

            {fileUploaded && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#27500A" />
                <Text style={styles.successText} numberOfLines={1}>
                  {fileName} selected successfully!
                </Text>
              </View>
            )}

            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#999999" />
              <Text style={styles.infoText}>
                Your copy will be saved immediately to your Settings and used for the 24–48 hrs official review process.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNext} 
            activeOpacity={0.8}
            disabled={geocodeLoading}
          >
            {geocodeLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 1 && 'Next'}
                {step === 2 && 'Next — Upload documents'}
                {step === 3 && 'Submit for Review'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack} 
            activeOpacity={0.8}
            disabled={geocodeLoading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Dropdown Native Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Organisation Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categoriesList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryOptionText}>{item}</Text>
                  {category === item && (
                    <Ionicons name="checkmark" size={16} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
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
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topbarSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EBEBEB',
  },
  dotActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  dotCurrent: {
    width: 16,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formContainer: {
    marginTop: 10,
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },
  placeholderText: {
    color: '#BBBBBB',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingLeft: 12,
    paddingRight: 6,
    fontSize: 13,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
  },

  choiceHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  choiceWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  choiceBtnActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  choiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  choiceBtnTextActive: {
    color: '#FFFFFF',
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginTop: 6,
  },
  uploadSubtitle: {
    fontSize: 9,
    color: '#BBBBBB',
    marginTop: 2,
  },
  successBanner: {
    marginTop: 12,
    backgroundColor: COLORS.GREEN_BG,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 11,
    color: COLORS.GREEN_TEXT,
    fontWeight: '500',
    flex: 1,
  },
  infoBanner: {
    marginTop: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 10,
    color: '#888888',
    lineHeight: 14,
  },
  actionContainer: {
    marginTop: 24,
    gap: 10,
  },
  nextButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F0F0F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  backButtonText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '500',
  },
  geocodeButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  geocodeButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  categoryOption: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryOptionText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
});
