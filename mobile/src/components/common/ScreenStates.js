import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Unified loading state — replaces plain ActivityIndicator everywhere.
 */
export function LoadingState({ message = 'Loading...' }) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-3xl bg-teal-light items-center justify-center mb-4">
        <ActivityIndicator size="large" color="#35615D" />
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
          <Ionicons name={icon || 'folder-open-outline'} size={32} color="#9CA3AF" />
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
        <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
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
