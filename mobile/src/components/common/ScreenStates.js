import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from './IconCompat';

/**
 * Shimmer skeleton block — a soft pulsing placeholder.
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const opacity = React.useRef(new Animated.Value(0.45)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#E7E2D8', opacity }, style]} />;
}

/**
 * Home loading skeleton — card-shaped placeholders instead of a spinner.
 */
export function HomeSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
      <Skeleton width={150} height={20} radius={6} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 28 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ width: 165 }}>
            <Skeleton width={165} height={120} radius={22} style={{ marginBottom: 10 }} />
            <Skeleton width={120} height={13} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={13} />
          </View>
        ))}
      </View>
      <Skeleton width={120} height={20} radius={6} style={{ marginBottom: 14 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Skeleton width={52} height={52} radius={16} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Unified loading state — replaces plain ActivityIndicator everywhere.
 */
export function LoadingState({ message = 'Loading...' }) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-3xl bg-teal-light items-center justify-center mb-4">
        <ActivityIndicator size="large" color="#1F4A45" />
      </View>
      <Text className="text-sm text-gray-400 font-medium">{message}</Text>
    </View>
  );
}

/**
 * Unified empty state — consistent across all lists.
 * @param {string} icon - Ionicons name
 * @param {string} emoji - emoji (used if no icon)
 * @param {string} title - bold title
 * @param {string} subtitle - gray subtitle
 * @param {string} actionLabel - optional button text
 * @param {function} onAction - optional button handler
 */
export function EmptyState({
  icon,
  emoji,
  title = 'Nothing here yet',
  subtitle = '',
  actionLabel,
  onAction,
}) {
  return (
    <View className="items-center py-16 px-8">
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
        {emoji ? (
          <Text style={{ fontSize: 36 }}>{emoji}</Text>
        ) : (
          <Ionicons name={icon || 'folder-open-outline'} size={32} color="#9A948A" />
        )}
      </View>
      <Text className="text-lg font-bold text-gray-800 mb-1 text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-sm text-gray-400 text-center leading-5">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          className="mt-5 bg-teal px-6 py-3 rounded-2xl"
          onPress={onAction}
        >
          <Text className="text-sm font-bold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/**
 * Unified error state — retry button included.
 */
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}) {
  return (
    <View className="items-center py-16 px-8">
      <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4">
        <Ionicons name="alert-circle-outline" size={36} color="#D24B4B" />
      </View>
      <Text className="text-lg font-bold text-gray-800 mb-1">Oops!</Text>
      <Text className="text-sm text-gray-400 text-center leading-5">{message}</Text>
      {onRetry ? (
        <TouchableOpacity
          className="mt-5 bg-teal px-6 py-3 rounded-2xl"
          onPress={onRetry}
        >
          <Text className="text-sm font-bold text-white">Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
