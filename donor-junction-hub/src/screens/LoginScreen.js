import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { COLORS, API_URL } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleLogin = async () => {
    if (!mobileNumber.trim()) {
      return Alert.alert('Missing Field', 'Please enter your mobile number.');
    }

    // Strip out spaces, dashes and underscores to standardize input
    const cleanedNumber = mobileNumber.replace(/[\s\-_]/g, '');

    if (cleanedNumber.length !== 10) {
      return Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
    }

    // Super Admin Secret Backdoor Redirection
    if (cleanedNumber === '6382073039') {
      if (!adminPassword.trim()) {
        return Alert.alert('Password Required', 'Please enter the Super Admin password.');
      }

      if (adminPassword === '123456') { // Super Admin Password
        setIsSuperAdminMode(false);
        setAdminPassword('');
        navigation.navigate('SuperAdmin');
      } else {
        Alert.alert('Access Denied', 'Incorrect Super Admin password.');
      }
      return;
    }

    try {
      console.log('Hub login request URL:', `${API_URL}/hub_login.php`, 'mobile:', cleanedNumber);

      const response = await fetch(`${API_URL}/hub_login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: cleanedNumber }),
      });

      const responseText = await response.text();
      let resData;
      try {
        resData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from server: ${responseText}`);
      }

      console.log('Hub login response:', response.status, resData);

      if (resData.status === 'success') {
        if (resData.exists) {
          const status = resData.org_status;

          if (status === 'declined') {
            return Alert.alert(
              "Registration Declined",
              "Your organization registration request has been declined by the Super Admin. You are not permitted to access the app.",
              [{ text: "OK" }]
            );
          }

          if (status === 'pending') {
            return Alert.alert(
              "Verification Pending",
              "Your organization registration request is currently under review by the Super Admin. Please wait for approval.",
              [{ text: "OK" }]
            );
          }

          const otp = resData.otp
            ? String(resData.otp).padStart(4, '0')
            : String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');

          if (!resData.otp) {
            console.warn('hub_login did not return an OTP from the server, generated a fallback OTP for local verification.');
          }

          navigation.navigate('OTP', { otpCode: otp, mobile: cleanedNumber });
        } else {
          navigation.navigate('Register', { mobileNumber: cleanedNumber });
        }
      } else {
        Alert.alert("Error", resData.message || "Something went wrong.");
      }
    } catch (e) {
      console.log('Error verifying mobile with server: ', e);
      Alert.alert('Connection Error', `Unable to connect to the server. Please check your connection or verify the backend URL: ${API_URL}/hub_login.php`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Header */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Login</Text>
        <Text style={styles.topbarSub}>Enter registered mobile number</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.phoneInputContainer}>
          <Text style={styles.phonePrefix}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={(text) => {
              // Strip out all non-numeric characters and cap at exactly 10 digits
              const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
              setMobileNumber(numericText);

              // Automatically activate Super Admin password prompt when 8888888888 is entered
              if (numericText === '6382073039') {
                setIsSuperAdminMode(true);
              } else {
                setIsSuperAdminMode(false);
                setAdminPassword('');
              }
            }}
            placeholder="Enter 10-Digit Number"
            maxLength={15} // Allow formatting characters on paste, which will be cleaned down to 10 digits
          />
        </View>

        {isSuperAdminMode && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Super Admin Password</Text>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholder="Enter password to access Super Admin"
              placeholderTextColor="#BBBBBB"
            />
          </View>
        )}

        <Text style={styles.infoText}>OTP will be sent via Fast2SMS</Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity

            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isSuperAdminMode ? 'Access Super Admin' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingVertical: 22,
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
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 6,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
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
  infoText: {
    fontSize: 10,
    color: '#BBBBBB',
    marginTop: 7,
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
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    marginTop: 6,
  },
  adminLink: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  adminLinkText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
