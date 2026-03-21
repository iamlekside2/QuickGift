import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { chatsAPI } from '../../services/api';

export default function ChatScreen({ navigation, route }) {
  const { conversationId, otherName, otherAvatar, providerId, buyerId } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Determine current user's role in this conversation
  const isProvider = user?.role === 'provider';
  const myRole = isProvider ? 'provider' : 'buyer';

  useEffect(() => {
    loadMessages();
  }, []);

  // Poll for new messages every 5 seconds while screen is focused
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(async () => {
        try {
          const res = await chatsAPI.getMessages(conversationId);
          setMessages(res.data || []);
        } catch (err) {
          // Silently ignore polling errors
        }
      }, 10000);
      return () => clearInterval(interval);
    }, [conversationId])
  );

  const loadMessages = async () => {
    try {
      const res = await chatsAPI.getMessages(conversationId);
      setMessages(res.data || []);
    } catch (err) {
      console.log('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText('');
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_role: myRole,
      text: messageText,
      created_at: new Date().toISOString(),
      status: 'sending',
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await chatsAPI.sendMessage(conversationId, messageText, myRole);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...res.data, status: 'sent' } : m))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 86400000);

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const shouldShowDateHeader = (index) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].created_at).toDateString();
    const prev = new Date(messages[index - 1].created_at).toDateString();
    return curr !== prev;
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender_role === myRole;
    const showDate = shouldShowDateHeader(index);

    return (
      <View>
        {showDate && (
          <View className="items-center my-4">
            <View className="bg-gray-100 px-4 py-1.5 rounded-full">
              <Text className="text-[11px] text-gray-400 font-medium">
                {formatDateHeader(item.created_at)}
              </Text>
            </View>
          </View>
        )}
        <View className={`flex-row mb-2 px-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
          {!isMe && (
            <View className="w-8 h-8 rounded-xl bg-teal-light items-center justify-center mr-2 mt-1">
              <Text className="text-xs font-bold text-teal">{otherAvatar || '?'}</Text>
            </View>
          )}
          <View
            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              isMe ? 'bg-teal rounded-br-md' : 'bg-gray-100 rounded-bl-md'
            }`}
            style={isMe ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            } : undefined}
          >
            <Text className={`text-[15px] leading-5 ${isMe ? 'text-white' : 'text-gray-800'}`}>
              {item.text}
            </Text>
            <View className={`flex-row items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
              <Text className={`text-[10px] ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                {formatTime(item.created_at)}
              </Text>
              {isMe && item.status !== 'failed' && (
                <Ionicons
                  name={item.status === 'sending' ? 'time-outline' : 'checkmark-done'}
                  size={12}
                  color={item.status === 'read' ? '#fff' : 'rgba(255,255,255,0.5)'}
                />
              )}
              {isMe && item.status === 'failed' && (
                <Ionicons name="alert-circle" size={12} color="#EF4444" />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Fixed teal header */}
      <View
        className="bg-teal px-5 pb-4"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 36 }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
            <Text className="text-sm font-bold text-white">{otherAvatar || '?'}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-white" numberOfLines={1}>
              {otherName || 'Chat'}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Text className="text-[11px] text-white/60">Online</Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
            onPress={() => Alert.alert('Call', 'Voice calls coming soon!')}
          >
            <Ionicons name="call-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-10">
                <View className="w-16 h-16 rounded-2xl bg-teal-light items-center justify-center mb-4">
                  <Ionicons name="chatbubble-outline" size={28} color="#35615D" />
                </View>
                <Text className="text-base font-bold text-gray-800 mb-1">Start the conversation</Text>
                <Text className="text-sm text-gray-400 text-center">
                  Say hello and discuss your booking details.
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View
          className="flex-row items-end gap-2 px-4 bg-white"
          style={{
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 34 : 12,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
          }}
        >
          <TouchableOpacity
            className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center mb-0.5"
            onPress={() => Alert.alert('Attachments', 'File sharing coming soon!')}
          >
            <Ionicons name="add" size={22} color="#6B7280" />
          </TouchableOpacity>

          <View
            className="flex-1 flex-row items-end bg-gray-100 rounded-2xl px-4 py-2.5"
            style={{ minHeight: 44, maxHeight: 120 }}
          >
            <TextInput
              className="flex-1 text-[15px] text-gray-800"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              style={{ paddingTop: Platform.OS === 'ios' ? 2 : 0, paddingBottom: Platform.OS === 'ios' ? 2 : 0 }}
            />
          </View>

          <TouchableOpacity
            className={`w-11 h-11 rounded-2xl items-center justify-center mb-0.5 ${
              text.trim() ? 'bg-teal' : 'bg-gray-200'
            }`}
            onPress={handleSend}
            disabled={!text.trim()}
            style={text.trim() ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            } : undefined}
          >
            <Ionicons name="send" size={18} color={text.trim() ? '#fff' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
