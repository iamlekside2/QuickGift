import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { chatsAPI } from '../../services/api';

// Fold a fresh server list into what is on screen without losing the
// messages that only exist locally (still sending, or failed to send).
const mergeMessages = (current, incoming) => {
  const server = Array.isArray(incoming) ? incoming : [];
  const serverIds = new Set(server.map((m) => m.id));
  const localOnly = current.filter(
    (m) => !serverIds.has(m.id) && (m.status === 'sending' || m.status === 'failed'),
  );
  if (!localOnly.length) return server;
  return [...server, ...localOnly].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
};

export default function ChatScreen({ navigation, route }) {
  const { conversationId, otherName, otherAvatar, providerId, buyerId } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Determine current user's role in this conversation
  // (the server decides it the same way: the buyer is whoever opened the thread)
  const isProvider = user?.role === 'provider';
  const myRole = buyerId
    ? (user?.id === buyerId ? 'buyer' : 'provider')
    : (isProvider ? 'provider' : 'buyer');

  useEffect(() => {
    loadMessages();
  }, []);

  // Poll for new messages every 10 seconds while screen is focused
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(async () => {
        try {
          const res = await chatsAPI.getMessages(conversationId);
          setMessages((prev) => mergeMessages(prev, res.data));
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
      setMessages((prev) => mergeMessages(prev, res.data));
    } catch (err) {
      console.log('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sends `messageText`. `retryOf` is the failed local message being resent.
  const sendText = async (messageText, retryOf) => {
    if (!messageText || sending) return;
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_role: myRole,
      text: messageText,
      created_at: new Date().toISOString(),
      status: 'sending',
    };
    setMessages((prev) => [...prev.filter((m) => m.id !== retryOf), tempMsg]);

    try {
      const res = await chatsAPI.sendMessage(conversationId, messageText);
      setMessages((prev) => {
        // A poll may already have delivered the saved message.
        const already = prev.some((m) => m.id === res.data?.id);
        return already
          ? prev.filter((m) => m.id !== tempMsg.id)
          : prev.map((m) => (m.id === tempMsg.id ? { ...res.data, status: 'sent' } : m));
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const messageText = text.trim();
    if (!messageText || sending) return;
    setText('');
    sendText(messageText);
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
              shadowColor: '#1F4A45',
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
                <Ionicons name="alert-circle" size={12} color="#D24B4B" />
              )}
            </View>
          </View>
        </View>
        {isMe && item.status === 'failed' && (
          <TouchableOpacity className="items-end px-4 mb-2 -mt-1" onPress={() => sendText(item.text, item.id)}>
            <Text className="text-[11px] font-bold text-red-500">Not sent. Tap to try again</Text>
          </TouchableOpacity>
        )}
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
            <ActivityIndicator size="large" color="#1F4A45" />
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
                  <Ionicons name="chatbubble-outline" size={28} color="#1F4A45" />
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
            borderTopColor: '#F0ECE3',
          }}
        >
          <TouchableOpacity
            className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center mb-0.5"
            onPress={() => Alert.alert('Attachments', 'File sharing coming soon!')}
          >
            <Ionicons name="add" size={22} color="#6E6A63" />
          </TouchableOpacity>

          <View
            className="flex-1 flex-row items-end bg-gray-100 rounded-2xl px-4 py-2.5"
            style={{ minHeight: 44, maxHeight: 120 }}
          >
            <TextInput
              className="flex-1 text-[15px] text-gray-800"
              placeholder="Type a message..."
              placeholderTextColor="#9A948A"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
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
              shadowColor: '#1F4A45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            } : undefined}
          >
            <Ionicons name="send" size={18} color={text.trim() ? '#fff' : '#9A948A'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
