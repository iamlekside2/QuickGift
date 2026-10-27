import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from './IconCompat';

// One status-bar inset for every header in the app (was 55/56/60 ad-hoc).
const TOP = Platform.select({ ios: 56, android: 38, default: 20 });

const TEAL = '#1F4A45';
const INK = '#211F1C';

/**
 * ScreenHeader — the single top bar used across the app.
 *
 * variant:
 *   'root'  — a tab landing screen. Teal band, title left-aligned. Back appears
 *             only when pushed (pass showBack={navigation.canGoBack()}).
 *   'stack' — a pushed screen (detail / form / cart). Light bar, back always
 *             shown, title left-aligned, optional right action.
 *   'home'  — bespoke greeting row: pass `left` (greeting block) and `right`.
 *
 * tone: 'teal' | 'light' — overrides the variant default (root/home=teal,
 *   stack=light).
 *
 * Props: title, subtitle, onBack, showBack, right (node), left (node, home),
 *   pb (bottom padding; larger when a search bar overlaps below), rounded
 *   (teal only, default true), center (center the title), children.
 */
export default function ScreenHeader({
  variant = 'root',
  tone,
  title,
  subtitle,
  onBack,
  showBack,
  right = null,
  left = null,
  pb = 18,
  rounded = true,
  center = false,
  children,
}) {
  const light = tone ? tone === 'light' : variant === 'stack';
  const backVisible = showBack ?? variant === 'stack';
  const centered = center;

  const fg = light ? INK : '#FFFFFF';
  const subFg = light ? 'rgba(33,31,28,0.55)' : 'rgba(255,255,255,0.7)';
  const bandStyle = light
    ? {
        backgroundColor: '#FFFFFF',
        shadowColor: INK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }
    : {
        backgroundColor: TEAL,
        borderBottomLeftRadius: rounded ? 28 : 0,
        borderBottomRightRadius: rounded ? 28 : 0,
      };

  const BackButton = (
    <TouchableOpacity
      className="w-10 h-10 rounded-[14px] items-center justify-center"
      style={{ backgroundColor: light ? '#F3F4F6' : 'rgba(255,255,255,0.15)' }}
      onPress={onBack}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="arrow-back" size={20} color={fg} />
    </TouchableOpacity>
  );

  return (
    <View className="px-5" style={[{ paddingTop: TOP, paddingBottom: pb }, bandStyle]}>
      {variant === 'home' ? (
        <View className="flex-row items-center justify-between">
          <View className="flex-1">{left}</View>
          {right}
        </View>
      ) : (
        <View className="flex-row items-center" style={{ minHeight: 40 }}>
          {backVisible ? BackButton : centered ? <View style={{ width: 40 }} /> : null}

          <View
            className={centered ? 'flex-1 items-center px-2' : 'flex-1'}
            style={{ marginLeft: backVisible && !centered ? 12 : 0 }}
          >
            <Text
              className="font-extrabold tracking-tight"
              style={{ fontSize: 20, color: fg }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-xs mt-0.5" style={{ color: subFg }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {right ? right : centered ? <View style={{ width: 40 }} /> : null}
        </View>
      )}

      {children}
    </View>
  );
}
