import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  TextInput,
  Modal,
  Image,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_URL } from '../constants/theme';

export default function SuperAdminScreen({ navigation }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('admins'); // 'admins', 'orgs', 'requests'
  
  // Active Admins list state
  const [admins, setAdmins] = useState([]);

  // Pending signup requests for Individual Users
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul.sharma@gmail.com',
      bloodGroup: 'O+',
      city: 'Chennai',
      role: 'Individual Donor',
      requestDate: '10 mins ago'
    },
    {
      id: 2,
      name: 'Sneha Patel',
      email: 'sneha.patel@yahoo.com',
      bloodGroup: 'A-',
      city: 'Coimbatore',
      role: 'Individual Donor',
      requestDate: '1 hr ago'
    },
    {
      id: 3,
      name: 'Vikranth Reddy',
      email: 'vikranth.reddy@outlook.com',
      bloodGroup: 'B+',
      city: 'Madurai',
      role: 'Individual Donor',
      requestDate: '4 hrs ago'
    }
  ]);

  // Pending signup requests for Hospitals/NGOs
  const [pendingOrgs, setPendingOrgs] = useState([]);

  // States for Edit Admin Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editOrgName, setEditOrgName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // States for Interactive Document Viewer Modal
  const [docViewerVisible, setDocViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Fetch pending organizations on screen load
  useEffect(() => {
    loadPendingOrganisations();
    loadActiveAdministrators();
  }, []);

  const loadPendingOrganisations = async () => {
    try {
      const response = await fetch(`${API_URL}/get_pending_organizations.php`);
      const resData = await response.json();

      if (resData.status === 'success' && resData.organizations) {
        setPendingOrgs(resData.organizations);
      } else {
        const stored = await AsyncStorage.getItem('pendingOrganisations');
        if (stored) {
          setPendingOrgs(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.log('Error loading pending organisations:', e);
      const stored = await AsyncStorage.getItem('pendingOrganisations');
      if (stored) {
        setPendingOrgs(JSON.parse(stored));
      }
    }
  };

  const loadActiveAdministrators = async () => {
    try {
      const response = await fetch(`${API_URL}/get_active_admins.php`);
      const resData = await response.json();

      if (resData.status === 'success' && resData.admins) {
        setAdmins(resData.admins);
      } else {
        const stored = await AsyncStorage.getItem('activeAdministrators');
        if (stored) {
          setAdmins(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.log('Error loading active administrators:', e);
      const stored = await AsyncStorage.getItem('activeAdministrators');
      if (stored) {
        setAdmins(JSON.parse(stored));
      }
    }
  };

  // Secure Super Admin Login
  const handleLogin = () => {
    if (!phone.trim()) {
      return Alert.alert('Missing Field', 'Please enter your Admin mobile number.');
    }
    if (!password.trim()) {
      return Alert.alert('Missing Field', 'Please enter your Super Admin password.');
    }

    const cleanedPhone = phone.replace(/[\s\-_+]/g, ''); // strip spaces, plus, dashes
    
    // Check credentials (allows the seeded admin number 9840012345 or generic admin 9999999999)
    if ((cleanedPhone === '9840012345' || cleanedPhone === '919840012345' || cleanedPhone === '9999999999') && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      Alert.alert(
        'Access Denied', 
        'Incorrect Admin phone number or password. Please try again.'
      );
      setPassword('');
    }
  };

  const confirmAction = (title, message, confirmText, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: confirmText, onPress: onConfirm }
      ]);
    }
  };

  // Handle Approve Organisation registration
  const handleApproveOrg = (org) => {
    confirmAction(
      'Approve Organisation',
      `Verify and approve license copy for "${org.name}"?`,
      'Verify & Approve',
      async () => {
        try {
          // 1. Set status to 'approved' in backend database
          console.log('SuperAdmin: Approving org with ID:', org.id, 'Mobile:', org.mobile);
          const response = await fetch(`${API_URL}/approve_organization.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: org.id,
              status: 'approved'
            })
          });
          const resData = await response.json();
          console.log('SuperAdmin: Approve response:', resData);
          if (resData.status !== 'success') {
            console.error('SuperAdmin: Approval failed:', resData.message);
            return Alert.alert('Error', resData.message || 'Could not approve organization.');
          }

          // Also sync with AsyncStorage for fallback
          await AsyncStorage.setItem(`orgStatus_${org.mobile}`, 'approved');

          // 2. Remove from pending list state and local fallback
          const updatedList = pendingOrgs.filter(item => item.id !== org.id);
          await AsyncStorage.setItem('pendingOrganisations', JSON.stringify(updatedList));
          setPendingOrgs(updatedList);

          // Ensure pending list and active admins refresh after approval
          await loadPendingOrganisations();
          await loadActiveAdministrators();

          // 3. Dynamic append to active organisation admin accounts table in database
          const email = `${org.name.toLowerCase().replace(/\s+/g, '')}@hospital.in`;
          const phone = `+91 ${org.mobile.substring(0, 5)} ${org.mobile.substring(5)}`;
          
          const adminResponse = await fetch(`${API_URL}/add_admin.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              adminName: 'Chief Medical Officer',
              orgName: org.name,
              email: email,
              phone: phone,
              status: 'Active',
              joinedDate: 'Approved Just Now'
            })
          });

          const adminRes = await adminResponse.json();
          if (adminRes.status === 'success') {
            setAdmins([adminRes.admin, ...admins]);
          }

          Alert.alert('Approved!', `"${org.name}" has been successfully approved! They can now proceed to the dashboard.`);
        } catch (e) {
          console.error('SuperAdmin: Approval exception:', e);
          Alert.alert('Network Error', 'Could not save the approval changes to the server.');
        }
      }
    );
  };

  // Handle Decline Organisation registration
  const handleDeclineOrg = (org) => {
    confirmAction(
      'Decline Organisation',
      `Reject registration request and decline license copy for "${org.name}"?`,
      'Reject',
      async () => {
        try {
          // 1. Set status to 'declined' in backend database
          console.log('SuperAdmin: Declining org with ID:', org.id, 'Mobile:', org.mobile);
          const response = await fetch(`${API_URL}/approve_organization.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: org.id,
              status: 'declined'
            })
          });
          const resData = await response.json();
          console.log('SuperAdmin: Decline response:', resData);
          if (resData.status !== 'success') {
            console.error('SuperAdmin: Decline failed:', resData.message);
            return Alert.alert('Error', resData.message || 'Could not decline organization.');
          }

          // Also sync with AsyncStorage for fallback
          await AsyncStorage.setItem(`orgStatus_${org.mobile}`, 'declined');

          // 2. Remove from pending list state and local fallback
          const updatedList = pendingOrgs.filter(item => item.id !== org.id);
          await AsyncStorage.setItem('pendingOrganisations', JSON.stringify(updatedList));
          setPendingOrgs(updatedList);

          // Refresh pending list after decline
          await loadPendingOrganisations();

          Alert.alert('Declined', `Registration request for "${org.name}" has been declined.`);
        } catch (e) {
          console.error('SuperAdmin: Decline exception:', e);
          Alert.alert('Network Error', 'Could not save the decline changes to the server.');
        }
      }
    );
  };

  // Handle Approve User Access
  const handleApproveUser = (id, name) => {
    confirmAction(
      'Approve Access',
      `Are you sure you want to approve ${name} to access the Donor Junction Hub app?`,
      'Approve',
      () => {
        setPendingRequests(pendingRequests.filter(req => req.id !== id));
        Alert.alert('Approved!', `${name} is now permitted to login and access the app.`);
      }
    );
  };

  // Handle Decline User Access
  const handleDeclineUser = (id, name) => {
    confirmAction(
      'Decline Request',
      `Are you sure you want to decline the registration request from ${name}?`,
      'Decline',
      () => {
        setPendingRequests(pendingRequests.filter(req => req.id !== id));
        Alert.alert('Declined', `Request from ${name} has been rejected.`);
      }
    );
  };

  // Toggle Admin Account Status
  const toggleAdminStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    confirmAction(
      'Update Admin Status',
      `Change this admin account's status to ${nextStatus}?`,
      'Change',
      async () => {
        try {
          const response = await fetch(`${API_URL}/toggle_admin_status.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: id,
              status: nextStatus
            })
          });
          const resData = await response.json();
          if (resData.status !== 'success') {
            return Alert.alert('Error', resData.message || 'Could not update admin status.');
          }

          const updatedAdmins = admins.map(admin => 
            admin.id === id ? { ...admin, status: nextStatus } : admin
          );
          setAdmins(updatedAdmins);
          await AsyncStorage.setItem('activeAdministrators', JSON.stringify(updatedAdmins));
        } catch (e) {
          console.log(e);
          Alert.alert('Network Error', 'Could not save the status update to the server.');
        }
      }
    );
  };

  // Open Edit Modal
  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setEditAdminName(admin.adminName);
    setEditOrgName(admin.orgName);
    setEditEmail(admin.email);
    setEditPhone(admin.phone);
    setEditModalVisible(true);
  };

  // Save Admin Edits
  const saveAdminEdits = async () => {
    if (!editAdminName.trim() || !editOrgName.trim() || !editEmail.trim() || !editPhone.trim()) {
      Alert.alert('Error', 'Please fill in all the details.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/edit_admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedAdmin.id,
          adminName: editAdminName.trim(),
          orgName: editOrgName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim()
        })
      });

      const resData = await response.json();
      if (resData.status !== 'success') {
        return Alert.alert('Error', resData.message || 'Could not update admin details.');
      }

      const updatedAdmins = admins.map(admin => 
        admin.id === selectedAdmin.id 
          ? { 
              ...admin, 
              adminName: editAdminName.trim(), 
              orgName: editOrgName.trim(), 
              email: editEmail.trim(), 
              phone: editPhone.trim() 
            }
          : admin
      );
      setAdmins(updatedAdmins);
      await AsyncStorage.setItem('activeAdministrators', JSON.stringify(updatedAdmins));

      setEditModalVisible(false);
      Alert.alert('Success', 'Admin account data updated successfully.');
    } catch (e) {
      console.log(e);
      Alert.alert('Network Error', 'Could not update admin details on the server.');
    }
  };

  // Render vault lock screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.lockBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.lockBackText}>Back to Welcome</Text>
        </TouchableOpacity>

        <View style={styles.lockCard}>
          <View style={styles.lockHeader}>
            <View style={styles.lockIconOuter}>
              <Ionicons name="shield-lock" size={32} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.lockTitle}>SUPER ADMIN ACCESS</Text>
            <Text style={styles.lockSubtitle}>
              Donor Junction Hub System Authorization Required.
            </Text>
          </View>

          {/* Admin Mobile Input */}
          <View style={styles.lockInputGroup}>
            <Text style={styles.lockInputLabel}>Admin Mobile Number</Text>
            <View style={styles.lockInputWrapper}>
              <Ionicons name="call-outline" size={16} color="#888888" style={styles.lockInputIcon} />
              <TextInput
                style={[styles.lockTextInput, { letterSpacing: 0 }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 98400 12345"
                placeholderTextColor="#555555"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Admin Password Input */}
          <View style={[styles.lockInputGroup, { marginTop: 14 }]}>
            <Text style={styles.lockInputLabel}>Super Admin Password</Text>
            <View style={styles.lockInputWrapper}>
              <Ionicons name="key-outline" size={16} color="#888888" style={styles.lockInputIcon} />
              <TextInput
                style={styles.lockTextInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="#555555"
                secureTextEntry={true}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.lockSubmitBtn} 
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.lockSubmitText}>Authorize Session</Text>
          </TouchableOpacity>

          <Text style={styles.lockHint}>{"Hint: Phone: \"98400 12345\" • Password: \"admin123\""}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topbarTitle}>Super Admin Dashboard</Text>
            <Text style={styles.topbarSub}>Control panel & app maintenance</Text>
          </View>
        </View>
        
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
          <Text style={styles.securityText}>Root Mode</Text>
        </View>
      </View>

      {/* 3 Tabs High-End Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'admins' && styles.activeTabButton]}
          onPress={() => setActiveTab('admins')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="people" 
            size={14} 
            color={activeTab === 'admins' ? '#FFFFFF' : '#888888'} 
          />
          <Text style={[styles.tabText, activeTab === 'admins' && styles.activeTabText]}>
            Admins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'orgs' && styles.activeTabButton]}
          onPress={() => setActiveTab('orgs')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="business" 
            size={14} 
            color={activeTab === 'orgs' ? '#FFFFFF' : '#888888'} 
          />
          <Text style={[styles.tabText, activeTab === 'orgs' && styles.activeTabText]}>
            Verify Orgs
          </Text>
          {pendingOrgs.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{pendingOrgs.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'requests' && styles.activeTabButton]}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="person-add" 
            size={14} 
            color={activeTab === 'requests' ? '#FFFFFF' : '#888888'} 
          />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Verify Users
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content Scroll */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        
        {/* Tab 1: Manage Admins */}
        {activeTab === 'admins' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Administrators</Text>
              <Text style={styles.sectionCount}>{admins.length} Total</Text>
            </View>

            {admins.map((admin) => (
              <View key={admin.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.orgInfo}>
                    <Ionicons name="business" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.orgName}>{admin.orgName}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: admin.status === 'Active' ? COLORS.GREEN_BG : COLORS.RED_BG }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: admin.status === 'Active' ? COLORS.GREEN_TEXT : COLORS.RED_TEXT }
                    ]}>
                      {admin.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Person:</Text>
                  <Text style={styles.detailValue}>{admin.adminName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Address:</Text>
                  <Text style={styles.detailValue}>{admin.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Phone:</Text>
                  <Text style={styles.detailValue}>{admin.phone}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registered:</Text>
                  <Text style={styles.detailValue}>{admin.joinedDate}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.editBtn} 
                    onPress={() => openEditModal(admin)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={13} color={COLORS.PRIMARY} />
                    <Text style={styles.editBtnText}>Edit Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.statusToggleBtn, admin.status === 'Active' ? styles.suspendBtn : styles.activateBtn]} 
                    onPress={() => toggleAdminStatus(admin.id, admin.status)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={admin.status === 'Active' ? "ban" : "checkmark-circle"} 
                      size={13} 
                      color={admin.status === 'Active' ? '#C82333' : '#1D9E75'} 
                    />
                    <Text style={[
                      styles.statusToggleText, 
                      { color: admin.status === 'Active' ? '#C82333' : '#1D9E75' }
                    ]}>
                      {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab 2: Approve Organisations */}
        {activeTab === 'orgs' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Organisation Verification Queue</Text>
              <Text style={styles.sectionCount}>{pendingOrgs.length} Pending</Text>
            </View>

            {pendingOrgs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>All NGO/Hospital licenses approved!</Text>
              </View>
            ) : (
              pendingOrgs.map((org) => (
                <View key={org.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.orgInfo}>
                      <Ionicons name="business" size={18} color={COLORS.PRIMARY} />
                      <View>
                        <Text style={styles.orgName}>{org.name}</Text>
                        <Text style={styles.orgCategory}>{org.category} • Licensed</Text>
                      </View>
                    </View>
                    <Text style={styles.pendingBadgeText}>PENDING</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>License Reg No:</Text>
                    <Text style={[styles.detailValue, { fontWeight: '700', color: COLORS.PRIMARY }]}>{org.license}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Registered Mobile:</Text>
                    <Text style={styles.detailValue}>+91 {org.mobile}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location City:</Text>
                    <Text style={styles.detailValue}>{org.city}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address Details:</Text>
                    <Text style={[styles.detailValue, { fontSize: 10, color: '#666' }]}>{org.address}</Text>
                  </View>

                  {/* Document Attachment Interactive Trigger */}
                  <TouchableOpacity 
                    style={styles.docMockCard}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedDoc(org);
                      setDocViewerVisible(true);
                    }}
                  >
                    <Ionicons name="document-text" size={18} color={COLORS.PRIMARY} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docMockTitle}>
                        {org.docUri ? 'uploaded_license_copy.jpg' : 'gov_license_credential.jpg'}
                      </Text>
                      <Text style={styles.docMockSize}>Tap to view official license document</Text>
                    </View>
                    <View style={styles.docViewIcon}>
                      <Ionicons name="eye" size={14} color={COLORS.PRIMARY} />
                    </View>
                  </TouchableOpacity>

                  {/* Approve/Decline actions */}
                  <View style={styles.approvalActionRow}>
                    <TouchableOpacity 
                      style={styles.declineBtn} 
                      onPress={() => handleDeclineOrg(org)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={14} color="#C82333" />
                      <Text style={styles.declineText}>Reject License</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.approveBtn} 
                      onPress={() => {
                        setSelectedDoc(org);
                        setDocViewerVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye" size={14} color="#FFFFFF" />
                      <Text style={styles.approveText}>View & Verify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 3: Approve Users */}
        {activeTab === 'requests' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>User Registration Approvals</Text>
              <Text style={styles.sectionCount}>{pendingRequests.length} Pending</Text>
            </View>

            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>All signup requests approved!</Text>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                      <Ionicons name="person-circle" size={24} color="#888" />
                      <View>
                        <Text style={styles.userName}>{req.name}</Text>
                        <Text style={styles.userRole}>{req.role}</Text>
                      </View>
                    </View>
                    <Text style={styles.timeLabel}>{req.requestDate}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email Address:</Text>
                    <Text style={styles.detailValue}>{req.email}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Blood group:</Text>
                    <View style={styles.bloodBadge}>
                      <Text style={styles.bloodText}>{req.bloodGroup}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City / Location:</Text>
                    <Text style={styles.detailValue}>{req.city}</Text>
                  </View>

                  <View style={styles.approvalActionRow}>
                    <TouchableOpacity 
                      style={styles.declineBtn} 
                      onPress={() => handleDeclineUser(req.id, req.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={14} color="#C82333" />
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.approveBtn} 
                      onPress={() => handleApproveUser(req.id, req.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                      <Text style={styles.approveText}>Approve Access</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Admin Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Admin Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Organisation Name</Text>
              <TextInput
                style={styles.textInput}
                value={editOrgName}
                onChangeText={setEditOrgName}
                placeholder="Enter organisation name"
              />

              <Text style={styles.inputLabel}>Admin Contact Name</Text>
              <TextInput
                style={styles.textInput}
                value={editAdminName}
                onChangeText={setEditAdminName}
                placeholder="Enter admin name"
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelModalBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.saveModalBtn}
                onPress={saveAdminEdits}
                activeOpacity={0.7}
              >
                <Text style={styles.saveModalText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive License Document Viewer Modal */}
      <Modal
        visible={docViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDocViewerVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerContainer}>
            <View style={styles.viewerHeader}>
              <View style={styles.viewerHeaderLeft}>
                <Ionicons name="document-text" size={18} color={COLORS.PRIMARY} />
                <View>
                  <Text style={styles.viewerTitle} numberOfLines={1}>
                    {selectedDoc?.name || 'License Document'}
                  </Text>
                  <Text style={styles.viewerSub}>Official Verification File</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewerCloseBtn} 
                onPress={() => setDocViewerVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.viewerBody}>
              {selectedDoc?.docUri ? (
                <Image 
                  source={{ uri: selectedDoc.docUri }} 
                  style={styles.viewerImage} 
                  resizeMode="contain" 
                />
              ) : (
                /* High-fidelity Government-styled License Certificate View */
                <View style={styles.certificateContainer}>
                  <View style={styles.certInnerBorder}>
                    <Text style={styles.certGovTitle}>GOVERNMENT OF INDIA</Text>
                    <Text style={styles.certSubTitle}>DEPARTMENT OF HEALTH & FAMILY WELFARE</Text>
                    
                    <View style={styles.certDivider} />
                    
                    <Text style={styles.certSubText}>This is to certify that the facility listed below:</Text>
                    
                    <Text style={styles.certOrgNameText}>{selectedDoc?.name}</Text>
                    <Text style={styles.certCategoryText}>{selectedDoc?.category} Directory</Text>
                    <Text style={styles.certAddressText}>{selectedDoc?.address || selectedDoc?.city}</Text>

                    <View style={styles.certLicenseRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.certMetaLabel}>LICENSE NUMBER</Text>
                        <Text style={styles.certMetaValue}>{selectedDoc?.license}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <Text style={styles.certMetaLabel}>STATUS</Text>
                        <Text style={[styles.certMetaValue, { color: '#1D9E75' }]}>VERIFIED VALID</Text>
                      </View>
                    </View>

                    <View style={styles.certSignatureRow}>
                      <View style={styles.certSignContainer}>
                        <Text style={styles.certSignText}>Dr. Anjali Sen</Text>
                        <View style={styles.certSignLine} />
                        <Text style={styles.certSignLabel}>Director of Health Services</Text>
                      </View>
                      
                      <View style={styles.certStamp}>
                        <Ionicons name="ribbon-sharp" size={18} color="#C82333" style={styles.certStampIcon} />
                        <Text style={styles.certStampText}>APPROVED</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.viewerFooter}>
              <TouchableOpacity 
                style={styles.viewerVerifyBtn}
                onPress={() => {
                  if (!selectedDoc) {
                    Alert.alert('Error', 'No organization selected for verification.');
                    return;
                  }
                  handleApproveOrg(selectedDoc);
                  setDocViewerVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.viewerVerifyText}>Verify & Approve</Text>
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
    backgroundColor: COLORS.SECONDARY,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topbarLeft: {
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
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  securityBadge: {
    backgroundColor: '#1D9E75',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  securityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  activeTabButton: {
    backgroundColor: COLORS.PRIMARY,
    elevation: 1,
  },
  tabText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#777777',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  badgeCount: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  sectionCount: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orgName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  orgCategory: {
    fontSize: 9,
    color: '#888888',
    marginTop: 1,
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.AMBER_TEXT,
    backgroundColor: COLORS.AMBER_BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3.5,
  },
  detailLabel: {
    fontSize: 11,
    color: '#777777',
  },
  detailValue: {
    fontSize: 11,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
    textAlign: 'right',
  },
  docMockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ECECEC',
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  docMockTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  docMockSize: {
    fontSize: 8.5,
    color: '#888888',
    marginTop: 1,
  },
  docViewIcon: {
    backgroundColor: 'rgba(218, 0, 55, 0.08)',
    borderRadius: 10,
    padding: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 10,
    gap: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: COLORS.PRIMARY,
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  suspendBtn: {
    borderColor: '#C82333',
    backgroundColor: '#FFF5F5',
  },
  activateBtn: {
    borderColor: '#1D9E75',
    backgroundColor: '#F3FCF8',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  userRole: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
  },
  timeLabel: {
    fontSize: 9,
    color: '#BBBBBB',
  },
  bloodBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  bloodText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  approvalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 10,
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#C82333',
    backgroundColor: '#FFF5F5',
  },
  declineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C82333',
  },
  approveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1D9E75',
  },
  approveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  modalBody: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.TEXT_DARK,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    marginTop: 16,
    gap: 10,
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#999',
  },
  cancelModalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  saveModalBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveModalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lockContainer: {
    flex: 1,
    backgroundColor: '#0F0F11',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockBackBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  lockBackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lockCard: {
    backgroundColor: '#17171C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#26262E',
    padding: 24,
    gap: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  lockHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  lockIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(218, 0, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 0, 55, 0.3)',
  },
  lockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 11,
    color: '#8A8A93',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  lockInputGroup: {
    gap: 8,
  },
  lockInputLabel: {
    fontSize: 10,
    color: '#8A8A93',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lockInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#32323D',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  lockInputIcon: {
    marginRight: 8,
  },
  lockTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 4,
  },
  lockSubmitBtn: {
    backgroundColor: COLORS.PRIMARY,
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  lockSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  lockHint: {
    fontSize: 9,
    color: '#55555C',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Document Viewer Modal Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  viewerContainer: {
    backgroundColor: '#1E1E24',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#32323D',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#17171C',
    borderBottomWidth: 0.5,
    borderBottomColor: '#26262E',
  },
  viewerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  viewerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewerSub: {
    fontSize: 9,
    color: '#8A8A93',
    marginTop: 1,
  },
  viewerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D2D37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    padding: 16,
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17171C',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  viewerFooter: {
    padding: 12,
    backgroundColor: '#17171C',
    borderTopWidth: 0.5,
    borderTopColor: '#26262E',
  },
  viewerVerifyBtn: {
    backgroundColor: '#1D9E75',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewerVerifyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Certificate Layout Styles
  certificateContainer: {
    backgroundColor: '#FCFAF2',
    width: '100%',
    height: '100%',
    padding: 10,
    borderRadius: 8,
  },
  certInnerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#C5A059',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  certGovTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1C1C1C',
    letterSpacing: 1.5,
  },
  certSubTitle: {
    fontSize: 7,
    fontWeight: '600',
    color: '#555555',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  certDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#C5A059',
    marginVertical: 10,
  },
  certSubText: {
    fontSize: 8,
    color: '#666666',
    fontStyle: 'italic',
  },
  certOrgNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8E1B1D',
    marginTop: 10,
    textAlign: 'center',
  },
  certCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#444444',
    marginTop: 2,
  },
  certAddressText: {
    fontSize: 8,
    color: '#777777',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 11,
    paddingHorizontal: 16,
  },
  certLicenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E2DEC6',
    paddingVertical: 6,
    marginTop: 18,
  },
  certMetaLabel: {
    fontSize: 7,
    color: '#888888',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  certMetaValue: {
    fontSize: 9,
    fontWeight: '800',
    color: '#222222',
    marginTop: 2,
  },
  certSignatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    flex: 1,
  },
  certSignContainer: {
    alignItems: 'center',
  },
  certSignText: {
    fontSize: 9.5,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#1C1C1C',
  },
  certSignLine: {
    width: 90,
    height: 0.5,
    backgroundColor: '#888888',
    marginVertical: 3,
  },
  certSignLabel: {
    fontSize: 7,
    color: '#888888',
  },
  certStamp: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#C82333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  certStampIcon: {
    marginBottom: 1,
  },
  certStampText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#C82333',
  },
});
