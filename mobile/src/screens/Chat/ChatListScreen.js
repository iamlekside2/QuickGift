import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { chatsAPI } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const isProvider = user?.role === 'provider';

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      const res = await chatsAPI.listConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.log('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }) => {
    const otherName = isProvider ? item.buyer_name : item.provider_name;
    const otherInitial = otherName?.charAt(0)?.toUpperCase() || '?';
    const hasUnread = item.unread_count > 0;

    return (
      <TouchableOpacity
        className={`flex-row items-center gap-3.5 px-5 py-4 ${hasUnread ? 'bg-teal-light/30' : ''}`}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('ChatScreen', {
          conversationId: item.id,
          otherName,
          otherAvatar: otherInitial,
          providerId: item.provider_id,
          buyerId: item.buyer_id,
        })}
      >
        {/* Avatar */}
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: hasUnread ? '#35615D' : '#35615D15' }}
        >
          <Text className={`text-lg font-bold ${hasUnread ? 'text-white' : 'text-teal'}`}>
            {otherInitial}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className={`text-[15px] ${hasUnread ? 'font-extrabold text-gray-800' : 'font-semibold text-gray-700'}`}>
              {otherName}
            </Text>
            <Text className={`text-xs ${hasUnread ? 'text-teal font-bold' : 'text-gray-400'}`}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text
              className={`text-sm flex-1 mr-3 ${hasUnread ? 'text-gray-600 font-medium' : 'text-gray-400'}`}
              numberOfLines={1}
            >
              {item.last_message}
            </Text>
            {hasUnread && (
              <View className="bg-teal rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5">
                <Text className="text-[10px] font-bold text-white">{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-10 pt-20">
      <View className="w-20 h-20 rounded-3xl bg-teal-light items-center justify-center mb-5">
        <Ionicons name="chatbubbles-outline" size={36} color="#35615D" />
      </View>
      <Text className="text-xl font-bold text-gray-800 mb-2">No messages yet</Text>
      <Text className="text-sm text-gray-400 text-center leading-5">
        {isProvider
          ? 'Your client conversations will appear here when they message you.'
          : 'Start a conversation with a service provider to see your messages here.'}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Fixed teal header */}
      <View
        className="bg-teal px-6 pb-5"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-extrabold text-white tracking-tight">Messages</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center">
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#35615D" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={EmptyState}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-50 ml-[82px]" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
