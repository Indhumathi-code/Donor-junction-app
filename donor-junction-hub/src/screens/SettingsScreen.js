import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Image,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  // Profile Display States
  const [orgName, setOrgName] = useState('Apollo Hospital');
  const [orgLocation, setOrgLocation] = useState('Chennai • Hospital');
  const [orgCity, setOrgCity] = useState('Chennai');
  const [orgCategory, setOrgCategory] = useState('Hospital');
  const [orgLicense, setOrgLicense] = useState('TN-MED-2024-00872');
  const [orgPhotoUri, setOrgPhotoUri] = useState(null);

  // Modal visibilities
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);

  // Form Temp Editing States
  const [tempName, setTempName] = useState('');
  const [tempCity, setTempCity] = useState('');

  // Primary Document States (License)
  const [docUri, setDocUri] = useState(null);
  const [docType, setDocType] = useState(null); // 'image' or 'pdf'
  const [docName, setDocName] = useState(null);

  // Additional / Extra Documents Array
  const [extraDocs, setExtraDocs] = useState([]);

  // Temp Extra Doc Form States
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraType, setNewExtraType] = useState('image'); // 'image' or 'pdf'

  // Load persistent configurations scoped by the active mobile number on mount & screen focus
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // 🌟 Fetch active logged in user first
        const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
        
        // 🌟 Fetch from backend database
        let nameVal = '';
        let categoryVal = '';
        let licenseVal = '';
        let cityVal = '';
        let locVal = '';
        let docUriVal = null;
        let docTypeVal = null;
        let docNameVal = null;

        try {
          const response = await fetch(`${API_URL}/get_profile.php?mobile=${mobile}`);
          const resData = await response.json();
          if (resData.status === 'success' && resData.organization) {
            const org = resData.organization;
            nameVal = org.name;
            categoryVal = org.category;
            licenseVal = org.license;
            cityVal = org.city;
            locVal = `${org.city} • ${org.category}`;
            docUriVal = org.doc_uri;
            docTypeVal = org.doc_type;
            docNameVal = org.doc_name;
          }
        } catch (err) {
          console.log('Error pulling profile details from server: ', err);
        }

        // If server failed or organization wasn't found, use AsyncStorage or default fallback
        if (!nameVal) {
          const storedName = await AsyncStorage.getItem(`orgName_${mobile}`);
          const storedLoc = await AsyncStorage.getItem(`orgLocation_${mobile}`);
          const storedLicense = await AsyncStorage.getItem(`orgLicense_${mobile}`);
          const storedCategory = await AsyncStorage.getItem(`orgCategory_${mobile}`);
          const storedCity = await AsyncStorage.getItem(`orgCity_${mobile}`);
          const storedDocUri = await AsyncStorage.getItem(`orgDocUri_${mobile}`);
          const storedDocType = await AsyncStorage.getItem(`orgDocType_${mobile}`);
          const storedDocName = await AsyncStorage.getItem(`orgDocName_${mobile}`);

          nameVal = storedName || (mobile === '9840012345' ? 'Apollo Hospital' : 'New Organisation');
          locVal = storedLoc || (mobile === '9840012345' ? 'Chennai • Hospital' : 'Local City • NGO');
          licenseVal = storedLicense || (mobile === '9840012345' ? 'TN-MED-2024-00872' : `LIC-${mobile}-2026`);
          categoryVal = storedCategory || (mobile === '9840012345' ? 'Hospital' : (locVal.includes('•') ? locVal.split('•')[1].trim() : 'NGO'));
          cityVal = storedCity || (locVal.includes('•') ? locVal.split('•')[0].trim() : 'Chennai');
          docUriVal = storedDocUri;
          docTypeVal = storedDocType;
          docNameVal = storedDocName;
        }

        setOrgName(nameVal);
        setOrgLocation(locVal);
        setOrgLicense(licenseVal);
        setOrgCategory(categoryVal);
        setOrgCity(cityVal);
        setDocUri(docUriVal);
        setDocType(docTypeVal);
        setDocName(docNameVal);

        // Fetch remaining local UI configurations
        const storedPhoto = await AsyncStorage.getItem(`orgPhotoUri_${mobile}`);
        const storedExtra = await AsyncStorage.getItem(`extraDocs_${mobile}`);
        setOrgPhotoUri(storedPhoto);
        setExtraDocs(storedExtra ? JSON.parse(storedExtra) : []);
      } catch (e) {
        console.log('Error loading settings states: ', e);
      }
    };

    // Load initial data
    loadProfileData();

    // FOCUS refreshes: Force re-read of storage every time the Settings tab is clicked!
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
    });

    return unsubscribe;
  }, [navigation]);

  // Logout reset session
  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'false');
      // Do not clear the loggedInMobile here, we keep it as reference or let next login overwrite it!
    } catch (e) {
      console.log('Error clearing logout session: ', e);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  // Open full-screen edit modal
  const handleOpenEdit = () => {
    setTempName(orgName);
    setTempCity(orgCity);
    setShowEditModal(true);
  };

  // Save profile edits scoped by phone number
  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      return Alert.alert('Error', 'Organisation name cannot be empty.');
    }
    if (!tempCity.trim()) {
      return Alert.alert('Error', 'City details cannot be empty.');
    }

    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const newLoc = `${tempCity.trim()} • ${orgCategory}`;

      const response = await fetch(`${API_URL}/save_profile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mobile: mobile,
          name: tempName.trim(),
          city: tempCity.trim()
        })
      });

      const resData = await response.json();
      if (resData.status !== 'success') {
        return Alert.alert('Save Failed', resData.message || 'Unable to update profile on the server.');
      }

      setOrgName(tempName.trim());
      setOrgCity(tempCity.trim());
      setOrgLocation(newLoc);

      await AsyncStorage.setItem(`orgName_${mobile}`, tempName.trim());
      await AsyncStorage.setItem(`orgCity_${mobile}`, tempCity.trim());
      await AsyncStorage.setItem(`orgLocation_${mobile}`, newLoc);
      if (resData.latitude && resData.longitude) {
        await AsyncStorage.setItem(`orgLatitude_${mobile}`, resData.latitude.toString());
        await AsyncStorage.setItem(`orgLongitude_${mobile}`, resData.longitude.toString());
      }
      setShowEditModal(false);

    } catch (e) {
      console.log('Error saving profile changes: ', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  // Pick profile photo from gallery scoped by phone number
  const handleChangeProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photo gallery to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';

        setOrgPhotoUri(selectedUri);
        await AsyncStorage.setItem(`orgPhotoUri_${mobile}`, selectedUri);
      }
    } catch (err) {
      console.log('Error picking profile picture: ', err);
    }
  };

  // Smart Pre-compiled Document Picker using expo-image-picker scoped by phone number
  const handlePickDoc = async (format) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery permission to select the license document.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const defaultName = format === 'pdf' ? 'org_license_credential.pdf' : 'org_license_credential.jpg';
        const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';

        setDocUri(uri);
        setDocType(format);
        setDocName(defaultName);

        await AsyncStorage.setItem(`orgDocUri_${mobile}`, uri);
        await AsyncStorage.setItem(`orgDocType_${mobile}`, format);
        await AsyncStorage.setItem(`orgDocName_${mobile}`, defaultName);
      }
    } catch (err) {
      console.log('Error picking doc: ', err);
      Alert.alert('Error', 'Unable to load document.');
    }
  };

  // Remove License Document completely scoped by phone number
  const handleRemoveDoc = async () => {
    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';

      setDocUri(null);
      setDocType(null);
      setDocName(null);

      await AsyncStorage.removeItem(`orgDocUri_${mobile}`);
      await AsyncStorage.removeItem(`orgDocType_${mobile}`);
      await AsyncStorage.removeItem(`orgDocName_${mobile}`);
    } catch (e) {
      console.log('Error removing doc: ', e);
    }
  };

  // Pick and Add Extra Document scoped by phone number
  const handleAddExtraDoc = async () => {
    if (!newExtraName.trim()) {
      return Alert.alert('Missing Field', 'Please enter a name for your document.');
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery permission to select the document copy.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const extension = newExtraType === 'pdf' ? '.pdf' : '.jpg';
        const finalName = newExtraName.trim().replace(/\s+/g, '_') + extension;
        const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';

        const newDoc = {
          id: Date.now().toString(),
          name: finalName,
          type: newExtraType,
          uri: uri
        };

        const updated = [...extraDocs, newDoc];
        setExtraDocs(updated);
        await AsyncStorage.setItem(`extraDocs_${mobile}`, JSON.stringify(updated));

        // Reset states & close
        setNewExtraName('');
        setNewExtraType('image');
        setShowAddExtraModal(false);
      }
    } catch (err) {
      console.log('Error picking extra doc: ', err);
      Alert.alert('Error', 'Failed to pick additional document.');
    }
  };

  // Delete an Extra Document scoped by phone number
  const handleDeleteExtraDoc = async (id) => {
    try {
      const mobile = await AsyncStorage.getItem('loggedInMobile') || '9840012345';
      const updated = extraDocs.filter(doc => doc.id !== id);
      setExtraDocs(updated);
      await AsyncStorage.setItem(`extraDocs_${mobile}`, JSON.stringify(updated));
    } catch (e) {
      console.log('Error deleting extra doc: ', e);
    }
  };

  // Derive initials if no photo is selected
  const getInitials = (name) => {
    if (!name) return 'AH';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Settings</Text>
        <Text style={styles.topbarSub}>Organisation profile</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>

        {/* Profile Card Header */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleOpenEdit} activeOpacity={0.8}>
            {orgPhotoUri ? (
              <Image source={{ uri: orgPhotoUri }} style={styles.profileAvatarImage} />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{getInitials(orgName)}</Text>
              </View>
            )}

            {/* Quick edit indicator */}
            <View style={styles.avatarCameraBadge}>
              <Ionicons name="create" size={8} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{orgName}</Text>
            <View style={styles.profileSubRow}>
              <Text style={styles.profileSubText}>{orgLocation}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleOpenEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Settings Links Section */}
        <View style={styles.settingsGroup}>

          {/* Option: Push Notifications */}
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="notifications" size={18} color={COLORS.PRIMARY} />
              <Text style={styles.optionText}>Push notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: COLORS.PRIMARY }}
              thumbColor={notifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {/* Option: Biometric Lock */}
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="finger-print" size={18} color={COLORS.PRIMARY} />
              <Text style={styles.optionText}>Biometric lock</Text>
            </View>
            <Switch
              value={biometric}
              onValueChange={setBiometric}
              trackColor={{ false: '#767577', true: COLORS.PRIMARY }}
              thumbColor={biometric ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {/* Option: Manage Campaigns */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => navigation.navigate('Campaigns')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="megaphone" size={18} color={COLORS.PRIMARY} />
              <Text style={styles.optionText}>Manage campaigns</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Option: Org Documents */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowDocsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="document-text" size={18} color={COLORS.PRIMARY} />
              <Text style={styles.optionText}>Org documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Option: Logout */}
          <TouchableOpacity
            style={[styles.optionRow, styles.logoutRow]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="log-out" size={18} color="#E24B4A" />
              <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Immersive Keyboard-Proof Full-Screen Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          {/* Header */}
          <View style={styles.modalTopbar}>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalHeaderButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTopbarTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.modalHeaderButton}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.fullScreenForm} keyboardShouldPersistTaps="handled">

            {/* Avatar Circle Picker */}
            <View style={styles.avatarPickerContainer}>
              <TouchableOpacity onPress={handleChangeProfilePhoto} activeOpacity={0.8} style={styles.avatarTouch}>
                {orgPhotoUri ? (
                  <Image source={{ uri: orgPhotoUri }} style={styles.pickerAvatarImage} />
                ) : (
                  <View style={styles.pickerAvatarPlaceholder}>
                    <Text style={styles.pickerAvatarText}>{getInitials(tempName)}</Text>
                  </View>
                )}
                <View style={styles.pickerCameraBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarPickerLabel}>Tap to change organisation logo</Text>
            </View>

            {/* Input Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Organisation Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="e.g. Apollo Hospital"
                placeholderTextColor="#BBBBBB"
              />
            </View>

            {/* Input Location (City only) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location City</Text>
              <TextInput
                style={styles.fieldInput}
                value={tempCity}
                onChangeText={setTempCity}
                placeholder="e.g. Chennai"
                placeholderTextColor="#BBBBBB"
              />
            </View>

            {/* Read-Only License Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>License Number (Read-Only)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: '#F5F5F5', color: '#888888', borderColor: '#E5E5E5' }]}
                value={orgLicense}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            {/* Read-Only Category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category (Read-Only)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: '#F5F5F5', color: '#888888', borderColor: '#E5E5E5' }]}
                value={orgCategory}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            {/* Hint Box info */}
            <View style={styles.hintCard}>
              <Ionicons name="information-circle-outline" size={16} color="#888888" style={{ marginTop: 2 }} />
              <Text style={styles.hintText}>
                Your custom profile logo and verification details are displayed to local blood donors nearby during active collection drives.
              </Text>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Org Documents Repository Modal */}
      <Modal
        visible={showDocsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDocsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.docModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Organisation Documents</Text>
                <Text style={styles.modalSub}>Verified license credentials</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDocsModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.docModalPadding} showsVerticalScrollIndicator={true}>

              {/* PRIMARY DOCUMENT: Main License */}
              <Text style={styles.docSectionTitle}>Primary License Certificate</Text>
              {docUri ? (
                <View style={styles.docPreviewCard}>
                  {docType === 'pdf' ? (
                    <View style={styles.pdfCardContent}>
                      <Ionicons name="document" size={32} color={COLORS.PRIMARY} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.pdfName} numberOfLines={1}>{docName}</Text>
                        <Text style={styles.pdfSub}>Verified License (PDF Format)</Text>
                      </View>
                      <TouchableOpacity onPress={handleRemoveDoc} style={styles.trashPadding}>
                        <Ionicons name="trash-outline" size={18} color="#E24B4A" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imageCardContent}>
                      <Image source={{ uri: docUri }} style={styles.docImagePreview} />
                      <View style={styles.imageDocOverlay}>
                        <Text style={styles.imageDocName} numberOfLines={1}>{docName}</Text>
                        <TouchableOpacity onPress={handleRemoveDoc} style={styles.trashPadding}>
                          <Ionicons name="trash-outline" size={18} color="#E24B4A" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyDocWrapper}>
                  <Ionicons name="cloud-upload-outline" size={36} color="#CCCCCC" />
                  <Text style={styles.emptyDocText}>No License Certificate uploaded yet.</Text>
                  <Text style={styles.emptyDocSub}>
                    Please upload your active organisation license below in PDF or JPG format to maintain verification.
                  </Text>
                </View>
              )}

              {/* Upload actions panel for main document if empty */}
              {!docUri && (
                <View style={styles.uploadPanelRow}>
                  <TouchableOpacity
                    style={styles.uploadOptionButton}
                    onPress={() => handlePickDoc('image')}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="image-outline" size={18} color={COLORS.PRIMARY} />
                    <Text style={styles.uploadOptionText}>Upload JPG</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadOptionButton}
                    onPress={() => handlePickDoc('pdf')}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="document-attach-outline" size={18} color={COLORS.PRIMARY} />
                    <Text style={styles.uploadOptionText}>Upload PDF</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ➕ SECONDARY DOCUMENTS */}
              <View style={styles.extraDocsHeaderRow}>
                <Text style={styles.docSectionTitle}>Additional Certificates</Text>

                {/* Plus Icon to Add Extra Documents */}
                <TouchableOpacity
                  style={styles.addExtraIconBtn}
                  onPress={() => setShowAddExtraModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>

              {extraDocs.length > 0 ? (
                <View style={styles.extraDocsList}>
                  {extraDocs.map((item) => (
                    <View key={item.id} style={styles.docPreviewCard}>
                      {item.type === 'pdf' ? (
                        <View style={styles.pdfCardContent}>
                          <Ionicons name="document-text" size={32} color="#0C447C" />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.pdfName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.pdfSub}>Additional PDF Attachment</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteExtraDoc(item.id)} style={styles.trashPadding}>
                            <Ionicons name="trash-outline" size={18} color="#E24B4A" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.imageCardContent}>
                          <Image source={{ uri: item.uri }} style={styles.docImagePreview} />
                          <View style={styles.imageDocOverlay}>
                            <Text style={styles.imageDocName} numberOfLines={1}>{item.name}</Text>
                            <TouchableOpacity onPress={() => handleDeleteExtraDoc(item.id)} style={styles.trashPadding}>
                              <Ionicons name="trash-outline" size={18} color="#E24B4A" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptyExtraWrapper}
                  onPress={() => setShowAddExtraModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-outline" size={36} color="#AAAAAA" />
                  <Text style={styles.emptyExtraText}>No additional documents uploaded</Text>
                  <Text style={styles.emptyExtraSub}>{"Tap here or the '+' icon above to upload NOC, Tax ID, or extra certificates"}</Text>
                </TouchableOpacity>
              )}

              {/* Close docs repository button */}
              <TouchableOpacity
                style={styles.closeDocsButton}
                onPress={() => setShowDocsModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeDocsButtonText}>Close Document Center</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Inner Modal: Add Extra Document Form */}
      <Modal
        visible={showAddExtraModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddExtraModal(false)}
      >
        <View style={styles.innerModalOverlay}>
          <View style={styles.innerModalContent}>
            <View style={styles.innerHeader}>
              <Text style={styles.innerTitle}>Add Extra Document</Text>
              <TouchableOpacity onPress={() => setShowAddExtraModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>

            <View style={styles.innerForm}>
              <Text style={styles.innerLabel}>Document Label / Name</Text>
              <TextInput
                style={styles.innerInput}
                value={newExtraName}
                onChangeText={setNewExtraName}
                placeholder="e.g. NOC Certificate, Tax ID"
                placeholderTextColor="#BBBBBB"
              />

              <Text style={styles.innerLabel}>Select Document Format</Text>
              <View style={styles.formatWrapper}>
                <TouchableOpacity
                  style={[styles.formatBtn, newExtraType === 'image' && styles.formatBtnActive]}
                  onPress={() => setNewExtraType('image')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image" size={14} color={newExtraType === 'image' ? '#FFFFFF' : COLORS.PRIMARY} />
                  <Text style={[styles.formatBtnText, newExtraType === 'image' && styles.formatBtnTextActive]}>
                    JPG Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatBtn, newExtraType === 'pdf' && styles.formatBtnActive]}
                  onPress={() => setNewExtraType('pdf')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document" size={14} color={newExtraType === 'pdf' ? '#FFFFFF' : COLORS.PRIMARY} />
                  <Text style={[styles.formatBtnText, newExtraType === 'pdf' && styles.formatBtnTextActive]}>
                    PDF Copy
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.innerSaveButton}
                onPress={handleAddExtraDoc}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.innerSaveButtonText}>Select File & Upload</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.innerCancelButton}
                onPress={() => setShowAddExtraModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.innerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 30,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.RED_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: COLORS.PRIMARY,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.RED_TEXT,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  profileSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  profileSubText: {
    fontSize: 10,
    color: '#999999',
  },
  verifiedBadge: {
    backgroundColor: COLORS.GREEN_BG,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.GREEN_TEXT,
  },
  editButton: {
    padding: 6,
  },
  settingsGroup: {
    paddingTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8F8F8',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  logoutRow: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    color: '#E24B4A',
  },
  // Full-Screen Profile Editor Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalTopbar: {
    height: 56,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalHeaderButton: {
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: 44,
  },
  modalTopbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullScreenForm: {
    padding: 20,
  },
  avatarPickerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarTouch: {
    position: 'relative',
  },
  pickerAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: COLORS.PRIMARY,
  },
  pickerAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.RED_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  pickerAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.RED_TEXT,
  },
  pickerCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.PRIMARY,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPickerLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '600',
    marginTop: 10,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    backgroundColor: '#FAFAFA',
  },
  hintCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.LIGHT_GRAY,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 10,
  },
  hintText: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
    lineHeight: 1.4,
    fontWeight: '500',
  },
  // Documents Repository Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  docModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
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
  docModalPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  docSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.TEXT_DARK,
    marginVertical: 10,
    letterSpacing: 0.3,
  },
  emptyDocWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  emptyDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginTop: 8,
  },
  emptyDocSub: {
    fontSize: 9,
    color: '#999999',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.3,
  },
  docPreviewCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.LIGHT_GRAY,
    overflow: 'hidden',
    marginBottom: 14,
  },
  pdfCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  pdfName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  pdfSub: {
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
  },
  trashPadding: {
    padding: 6,
  },
  imageCardContent: {
    position: 'relative',
    height: 140,
  },
  docImagePreview: {
    width: '100%',
    height: '100%',
  },
  imageDocOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageDocName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  uploadPanelRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadOptionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    gap: 6,
  },
  uploadOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  // Extra / Secondary Documents Styles
  extraDocsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },
  addExtraIconBtn: {
    padding: 4,
  },
  extraDocsList: {
    marginBottom: 16,
  },
  emptyExtraWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  emptyExtraText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    marginTop: 6,
  },
  emptyExtraSub: {
    fontSize: 9,
    color: '#BBBBBB',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.3,
  },
  closeDocsButton: {
    backgroundColor: COLORS.PRIMARY,
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    marginTop: 10,
  },
  closeDocsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Inner Modal Style (Add Extra Document)
  innerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  innerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  innerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  innerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  innerForm: {
    padding: 16,
  },
  innerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  innerInput: {
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.TEXT_DARK,
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  formatWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  formatBtnActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  formatBtnTextActive: {
    color: '#FFFFFF',
  },
  innerSaveButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  innerSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  innerCancelButton: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    backgroundColor: '#F9F9F9',
  },
  innerCancelButtonText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
  },
});
