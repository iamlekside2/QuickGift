import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, Dimensions, TouchableOpacity,
  Image, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ONBOARDING_SLIDES } from '../../constants/data';

const { width, height } = Dimensions.get('window');

const boxCover = require('../../../assets/images/box-cover.png');
const boxPackDown = require('../../../assets/images/box-pack-down.png');

// 3-color title: black (default), orange, teal
function HighlightedTitle({ text, orangeWords = [], tealWords = [] }) {
  const words = text.split(' ');
  return (
    <Text
      className="text-center leading-[38px]"
      style={{ fontSize: 28, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
    >
      {words.map((word, i) => {
        const isOrange = orangeWords.some((w) => word === w || word.startsWith(w));
        const isTeal = tealWords.some((w) => word === w || word.startsWith(w));
        return (
          <Text
            key={i}
            className={isOrange ? 'text-orange' : isTeal ? 'text-teal' : 'text-gray-800'}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

// Segmented progress bar
function ProgressBar({ current, total }) {
  return (
    <View className="flex-row gap-2 mx-5 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1 rounded-full ${i <= current ? 'bg-orange' : 'bg-gray-200'}`}
          style={{ flex: i <= current ? 2 : 1 }}
        />
      ))}
    </View>
  );
}

// Box cover position per slide - just above characters' heads
const COVER_POSITIONS = [
  { top: height * 0.04, left: 5, rotate: '-15deg' },
  { top: height * 0.02, right: 5, rotate: '30deg' },
  { top: height * 0.03, left: 8, rotate: '-10deg' },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  const renderSlide = ({ item, index }) => {
    const coverPos = COVER_POSITIONS[index] || COVER_POSITIONS[0];

    return (
      <View style={{ width }} className="flex-1">
        {/* Illustration area */}
        <View className="items-center justify-end" style={{ height: height * 0.52 }}>
          {/* Box pack down base */}
          <Image
            source={boxPackDown}
            className="absolute bottom-0"
            style={{ width: width, height: 100, resizeMode: 'stretch' }}
          />

          {/* Main illustration */}
          <Image
            source={item.image}
            className="z-10 mb-1"
            style={{ width: width * 0.85, height: height * 0.43, resizeMode: 'contain' }}
          />

          {/* Box cover lid */}
          <Image
            source={boxCover}
            className="absolute z-20"
            style={{
              width: 200,
              height: 120,
              resizeMode: 'contain',
              top: coverPos.top,
              left: coverPos.left,
              right: coverPos.right,
              transform: [{ rotate: coverPos.rotate }],
            }}
          />
        </View>

        {/* Text content */}
        <View className="flex-1 px-6 pt-2">
          <HighlightedTitle
            text={item.title}
            orangeWords={item.orangeWords}
            tealWords={item.tealWords}
          />
          <Text className="text-sm text-gray-500 text-center leading-[22px] mt-3">
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Top bar */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }} className="px-5">
        <ProgressBar current={currentIndex} total={ONBOARDING_SLIDES.length} />
        <TouchableOpacity className="self-end py-3 px-1" onPress={handleSkip}>
          <Text className="text-sm text-gray-400 font-semibold">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        className="flex-1"
      />

      {/* Bottom CTA */}
      <View className="px-6" style={{ paddingBottom: Platform.OS === 'ios' ? 50 : 32 }}>
        <TouchableOpacity
          className="bg-teal flex-row items-center justify-center py-[18px] rounded-2xl gap-2"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-bold">
            {isLastSlide ? 'Get Started' : 'Continue'}
          </Text>
          <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
