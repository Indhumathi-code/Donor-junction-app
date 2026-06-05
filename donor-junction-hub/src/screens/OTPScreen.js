import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function OTPScreen({ route, navigation }) {
  const { otpCode = '0000', mobile = '' } = route.params || {};
  const normalizedMobile = mobile ? mobile.replace(/[^0-9]/g, '') : '';

  const [code, setCode] = useState('');
  const textInputRef = useRef(null);

  // Focus the input and simulate SMS arrival on screen load
  useEffect(() => {
    // Small delay to ensure the native component has mounted
    const focusTimeout = setTimeout(() => {
      textInputRef.current?.focus();
    }, 150);

    // Simulate SMS notification popup via native alert
    const smsTimeout = setTimeout(() => {
      Alert.alert(
        "💬 Fast2SMS Gateway",
        `SMS received: Your Donor Junction verification OTP code is: ${otpCode}`,
        [
          {
            text: "Copy & Autofill",
            onPress: () => {
              setCode(otpCode);
              // Auto-focus again
              textInputRef.current?.focus();
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ],
        { cancelable: true }
      );
    }, 600);

    return () => {
      clearTimeout(focusTimeout);
      clearTimeout(smsTimeout);
    };
  }, [otpCode]);

  const handleVerify = async () => {
    if (code === otpCode) {
      try {
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // Standardize and register number
        const cleaned = mobile.replace(/[\s\-_]/g, '');
        if (cleaned) {
          // 🌟 Save active logged-in mobile number to scope profiles uniquely!
          await AsyncStorage.setItem('loggedInMobile', cleaned);

          const stored = await AsyncStorage.getItem('registeredNumbers');
          let registeredList = stored ? JSON.parse(stored) : [];
          if (!registeredList.includes(cleaned)) {
            registeredList.push(cleaned);
            await AsyncStorage.setItem('registeredNumbers', JSON.stringify(registeredList));
          }
        }
      } catch (e) {
        console.log('Error saving verification session: ', e);
      }
      navigation.replace('MainTabs');
    } else {
      Alert.alert(
        "Invalid OTP",
        "The verification code you entered is incorrect. Please try again.",
        [
          {
            text: "Retry",
            onPress: () => {
              setCode('');
              textInputRef.current?.focus();
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Banner */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Verify OTP</Text>
        <Text style={styles.topbarSub}>Sent to +91 {normalizedMobile || 'XXXXXXXXXX'}</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.label}>Enter 4-digit OTP</Text>

        {/* Hidden inputs to handle standard native keyboard */}
        <TextInput
          ref={textInputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={4}
          value={code}
          onChangeText={setCode}
          caretHidden
        />

        {/* OTP Input Boxes Row - clicking anywhere focuses the keyboard */}
        <TouchableOpacity
          style={styles.otpRow}
          onPress={() => textInputRef.current?.focus()}
          activeOpacity={0.9}
        >
          <View style={[styles.otpBox, code.length >= 1 ? styles.otpBoxFilled : styles.otpBoxDim]}>
            <Text style={[styles.otpNumber, code.length < 1 && styles.otpNumberDim]}>
              {code[0] || '_'}
            </Text>
          </View>
          <View style={[styles.otpBox, code.length >= 2 ? styles.otpBoxFilled : styles.otpBoxDim]}>
            <Text style={[styles.otpNumber, code.length < 2 && styles.otpNumberDim]}>
              {code[1] || '_'}
            </Text>
          </View>
          <View style={[styles.otpBox, code.length >= 3 ? styles.otpBoxFilled : styles.otpBoxDim]}>
            <Text style={[styles.otpNumber, code.length < 3 && styles.otpNumberDim]}>
              {code[2] || '_'}
            </Text>
          </View>
          <View style={[styles.otpBox, code.length >= 4 ? styles.otpBoxFilled : styles.otpBoxDim]}>
            <Text style={[styles.otpNumber, code.length < 4 && styles.otpNumberDim]}>
              {code[3] || '_'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.timerText}>Resend OTP in 28s</Text>
        
        {/* Development Helper: Show OTP on screen */}
        <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.PRIMARY, fontWeight: 'bold' }}>
          [Dev Tool] Your OTP is: {otpCode || 'Not available'}
        </Text>

        {/* Local Storage MMKV Banner */}
        <View style={styles.mmkvBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#0C447C" />
          <Text style={styles.mmkvText}>Session saved automatically via MMKV</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleVerify}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Verify & Enter Dashboard</Text>
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 10,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  otpBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: COLORS.PRIMARY,
  },
  otpBoxDim: {
    borderColor: '#DDDDDD',
  },
  otpNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  otpNumberDim: {
    color: '#CCCCCC',
  },
  timerText: {
    fontSize: 10,
    color: '#BBBBBB',
    textAlign: 'center',
    marginTop: 12,
  },
  mmkvBanner: {
    marginTop: 18,
    backgroundColor: COLORS.BLUE_BG,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mmkvText: {
    fontSize: 11,
    color: COLORS.BLUE_TEXT,
    fontWeight: '500',
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
});
