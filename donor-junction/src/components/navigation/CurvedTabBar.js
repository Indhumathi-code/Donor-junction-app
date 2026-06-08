import React, { useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TAB_HEIGHT = 65;
const CURVE_RADIUS = 35;
const leftStartX = (width / 2) - CURVE_RADIUS - 15;
const rightEndX = (width / 2) + CURVE_RADIUS + 15;

const getPath = (bottomInset) => {
  const totalHeight = TAB_HEIGHT + bottomInset;
  const center = width / 2;
  // Draw the SVG path starting from -width to 2*width so it can slide left and right
  return `
    M ${-width} 0
    L ${center - 60} 0
    C ${center - 25} 0, ${center - 25} 55, ${center} 55
    C ${center + 25} 55, ${center + 25} 0, ${center + 60} 0
    L ${width * 2} 0
    L ${width * 2} ${totalHeight}
    L ${-width} ${totalHeight}
    Z
  `;
};

const CurvedTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 15);
  const tabWidth = width / state.routes.length;
  
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Calculate the target X position to slide the curve and floating button
    const targetX = (state.index + 0.5) * tabWidth - (width / 2);
    // Use withTiming instead of withSpring to stop the "swinging" (bouncing) effect
    translateX.value = withTiming(targetX, { duration: 250 });
  }, [state.index, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }]
    };
  });

  // Get active icon name for the floating circle
  const activeRoute = state.routes[state.index];
  let activeIconName = '';
  if (activeRoute.name === 'Home') activeIconName = 'home';
  else if (activeRoute.name === 'Map') activeIconName = 'location';
  else if (activeRoute.name === 'Posts') activeIconName = 'document-text';
  else if (activeRoute.name === 'Chat') activeIconName = 'chatbubble';
  else if (activeRoute.name === 'Settings') activeIconName = 'person';

  return (
    <View style={styles.container}>
      {/* Animated SVG Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
        <Svg 
          width={width * 3} 
          height={TAB_HEIGHT + bottomInset} 
          viewBox={`${-width} 0 ${width * 3} ${TAB_HEIGHT + bottomInset}`}
          style={{ position: 'absolute', left: -width }}
        >
          {/* subtle shadow effect can be achieved by removing stroke or making it very light */}
          <Path d={getPath(bottomInset)} fill="#FFFFFF" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
        </Svg>
      </Animated.View>

      {/* Floating Active Circle */}
      <Animated.View style={[styles.activeCircleWrapper, { bottom: bottomInset + 15 }, animatedStyle]}>
        <View style={styles.activeCircle}>
           <Ionicons name={activeIconName} size={28} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { paddingBottom: bottomInset, height: TAB_HEIGHT + bottomInset }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          
          let iconName = '';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Map') iconName = 'location';
          else if (route.name === 'Posts') iconName = 'document-text';
          else if (route.name === 'Chat') iconName = 'chatbubble';
          else if (route.name === 'Settings') iconName = 'person';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity key={index} activeOpacity={0.8} onPress={onPress} style={styles.tab}>
              {/* Hide the inactive icon when this tab is selected, since it moves into the floating circle */}
              <View style={{ opacity: isFocused ? 0 : 1 }}>
                <Ionicons name={`${iconName}-outline`} size={24} color={COLORS.GRAY} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  activeCircleWrapper: {
    position: 'absolute',
    width: width, // Full width to center the circle naturally before translating
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    pointerEvents: 'none', // Let clicks pass through to tab buttons below
  },
  activeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    width: width,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default CurvedTabBar;
