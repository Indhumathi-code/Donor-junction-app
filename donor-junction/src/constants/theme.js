import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const COLORS = {
  PRIMARY: '#DA0037',
  SECONDARY: '#111111',
  BACKGROUND: '#FFFFFF',
  GRAY: '#999999',
  LIGHT_GRAY: '#f8f8f8',
  SUCCESS: '#27500A',
  INFO: '#0C447C'
};

const activeIp = '192.168.1.36';

export const API_URL = Platform.OS === 'web'
  ? 'http://localhost/Donor-junction-app/backend-full'
  : `http://${activeIp}/Donor-junction-app/backend-full`;
