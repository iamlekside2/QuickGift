import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/common/AppInput';
import { reviewsAPI } from '../../services/api';

export default function WriteReviewScreen({ navigation, route }) {
  const { targetType = 'product', targetId, targetName = '' } = route.params || {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }

    try {
      setSubmitting(true);
      await reviewsAPI.create({
        target_type: targetType,
        target_id: targetId,
        rating,
        comment: comment.trim(),
      });
      Alert.alert('Review submitted!', '', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.log('Error submitting review:', err);
      Alert.alert('Error', 'Could not submit review. Please try again.');
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
          shadowColor: '#1F2937',
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
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-gray-800">Leave a Review</Text>
      </View>

      <View className="flex-1 px-5 pt-6">
        {/* Target name */}
        <Text className="text-base font-bold text-gray-800 mb-1">{targetName}</Text>
        <Text className="text-xs text-gray-400 mb-6">
          {targetType === 'product' ? 'Product Review' : 'Provider Review'}
        </Text>

        {/* Star rating */}
        <Text className="text-sm font-semibold text-gray-600 mb-3">Your Rating</Text>
        <View className="flex-row gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? '#FD8950' : '#D1D5DB'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment */}
        <AppInput
          label="Comment (optional)"
          value={comment}
          onChangeText={setComment}
          type="multiline"
          placeholder="Share your experience..."
          maxLength={500}
        />

        {/* Submit button */}
        <TouchableOpacity
          className={`mt-4 py-4 rounded-2xl items-center ${submitting ? 'bg-teal/60' : 'bg-teal'}`}
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
