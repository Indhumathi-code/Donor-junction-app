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

<<<<<<< HEAD
const activeIp = '192.168.1.56';

export const API_URL = Platform.OS === 'web'
  ? 'http://192.168.1.56/Donor-junction-app/backend-full'
=======
const activeIp = '192.168.1.36';

export const API_URL = Platform.OS === 'web'
  ? 'http://localhost/Donor-junction-app/backend-full'
>>>>>>> 8c067bcbc847b8a339f2eb85142c9de00c93d7b6
  : `http://${activeIp}/Donor-junction-app/backend-full`;
