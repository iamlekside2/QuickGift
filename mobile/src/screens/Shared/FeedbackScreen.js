import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import AppInput from '../../components/common/AppInput';
import { feedbackAPI } from '../../services/api';
import appConfig from '../../../app.json';

const APP_VERSION = appConfig?.expo?.version || null;

const CATEGORIES = [
  { key: 'suggestion', label: 'Suggestion', icon: 'bulb-outline' },
  { key: 'complaint', label: 'Complaint', icon: 'sad-outline' },
  { key: 'service', label: 'Service issue', icon: 'construct-outline' },
  { key: 'bug', label: 'Bug', icon: 'bug-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function FeedbackScreen({ navigation }) {
  const [category, setCategory] = useState('suggestion');
  const [rating, setRating] = useState(0); // optional
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const text = message.trim();
    if (text.length < 3) {
      Alert.alert('Tell us more', 'Please enter a short message so we can help.');
      return;
    }

    try {
      setSubmitting(true);
      await feedbackAPI.submit({
        message: text,
        category,
        rating: rating > 0 ? rating : undefined,
        app_version: APP_VERSION || undefined,
      });
      Alert.alert(
        'Thank you! 🙏',
        "Your feedback has been sent. We read every message and use it to improve QuickGift.",
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not send your feedback. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="bg-white px-5 pb-4 flex-row items-center gap-3"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#211F1C" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-gray-800">Send Feedback</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
        <Text className="text-[13px] text-gray-500 mb-6 leading-5">
          Not happy with something, or have an idea? Tell us what's on your mind — it goes straight to the team.
        </Text>

        {/* Category */}
        <Text className="text-sm font-semibold text-gray-600 mb-3">What's it about?</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                activeOpacity={0.7}
                className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border ${
                  active ? 'bg-teal border-teal' : 'bg-white border-gray-200'
                }`}
              >
                <Ionicons name={c.icon} size={15} color={active ? '#fff' : '#6E6A63'} />
                <Text className={`text-[12.5px] font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Optional satisfaction rating */}
        <Text className="text-sm font-semibold text-gray-600 mb-3">
          How's your experience so far? <Text className="text-gray-400 font-normal">(optional)</Text>
        </Text>
        <View className="flex-row gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star === rating ? 0 : star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={34}
                color={star <= rating ? '#E8632F' : '#B5AFA2'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <AppInput
          label="Your message"
          value={message}
          onChangeText={setMessage}
          type="multiline"
          placeholder="Share the details..."
          maxLength={2000}
        />

        {/* Submit */}
        <TouchableOpacity
          className={`mt-4 mb-10 py-4 rounded-2xl items-center ${submitting ? 'bg-teal/60' : 'bg-teal'}`}
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            shadowColor: '#1F4A45',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">Send Feedback</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
