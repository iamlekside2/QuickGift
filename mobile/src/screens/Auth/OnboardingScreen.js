import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, Dimensions, TouchableOpacity, Image, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_SLIDES } from '../../constants/data';
import { SerifHeadline } from '../../components/common/Typography';

const ONBOARDING_SEEN_KEY = '@quickgift_onboarding_seen';
const { width, height } = Dimensions.get('window');

// Segmented progress bars — 28x4, filled = terracotta, rest = #E5DCC9.
function ProgressBars({ current, total }) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 28,
            height: 4,
            borderRadius: 2,
            backgroundColor: i <= current ? '#E8632F' : '#E5DCC9',
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const markSeen = async () => {
    try { await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true'); } catch {}
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      markSeen();
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    markSeen();
    navigation.replace('Login');
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  // The teal stage (illustration) is the full-bleed background; the cream sheet
  // is pinned to the bottom and holds progress + copy + CTAs, shared across slides.
  const renderStage = ({ item }) => (
    <View style={{ width }} className="items-center justify-center">
      {/* Cream disc holding the illustration */}
      <View
        className="items-center justify-center rounded-full bg-cream-warm"
        style={{
          width: 250,
          height: 250,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 30 },
          shadowOpacity: 0.25,
          shadowRadius: 60,
          elevation: 12,
        }}
      >
        <Image source={item.image} style={{ width: 190, height: 190, resizeMode: 'contain' }} />
      </View>
    </View>
  );

  const active = ONBOARDING_SLIDES[currentIndex] || ONBOARDING_SLIDES[0];

  return (
    <View className="flex-1 bg-teal">
      <StatusBar style="light" />

      {/* Decorative circles on the teal stage */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -60, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(232,99,47,0.14)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: height * 0.28, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(246,241,232,0.05)' }}
      />

      {/* Teal stage with the swipeable illustration */}
      <View style={{ height: height * 0.56 }} className="justify-center">
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={renderStage}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        />
      </View>

      {/* Cream bottom sheet */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-cream-warm"
        style={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: Platform.OS === 'ios' ? 44 : 28,
        }}
      >
        <ProgressBars current={currentIndex} total={ONBOARDING_SLIDES.length} />

        <SerifHeadline
          text={active.title}
          emphasis={active.emphasis}
          size={32}
          style={{ marginTop: 20 }}
        />

        <Text className="text-[14px] text-ink-soft leading-[21px] mt-3">
          {active.description}
        </Text>

        <View className="flex-row items-center gap-3 mt-7">
          <TouchableOpacity className="px-4 py-3" onPress={handleSkip} activeOpacity={0.7}>
            <Text className="text-[15px] text-ink-soft font-bold">Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-teal flex-row items-center justify-center gap-2"
            style={{
              height: 52,
              borderRadius: 16,
              shadowColor: '#1F4A45',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.26,
              shadowRadius: 24,
              elevation: 6,
            }}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text className="text-white text-[15px] font-bold">
              {isLastSlide ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
