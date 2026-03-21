import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TEAL = '#35615D';
const GRAY_200 = '#E5E7EB';
const GRAY_400 = '#9CA3AF';
const GRAY_500 = '#6B7280';
const RED = '#EF4444';
const GREEN = '#10B981';

/**
 * AppInput — unified input component for QuickGift.
 *
 * Props:
 *   label        — floating label text
 *   value        — controlled value
 *   onChangeText — value change handler
 *   placeholder  — placeholder (shown when focused + empty)
 *   type         — 'text' | 'password' | 'phone' | 'email' | 'number' | 'multiline' | 'search'
 *   error        — error message string (shows red state)
 *   success      — boolean (shows green state + checkmark)
 *   loading      — boolean (shows spinner)
 *   disabled     — boolean
 *   icon         — Ionicons name for left icon
 *   maxLength    — max character count
 *   onBlur       — blur handler
 *   onFocus      — focus handler
 *   autoFocus    — boolean
 *   containerStyle — extra style for outer wrapper
 *   inputRef     — ref forwarding
 */
export default function AppInput({
  label = '',
  value = '',
  onChangeText,
  placeholder = '',
  type = 'text',
  error = '',
  success = false,
  loading = false,
  disabled = false,
  icon,
  maxLength,
  onBlur,
  onFocus,
  autoFocus = false,
  containerStyle,
  inputRef,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const hasValue = value && value.length > 0;
  const isUp = focused || hasValue;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isUp ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isUp]);

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  // Border color
  let borderColor = GRAY_200;
  if (error) borderColor = RED;
  else if (success) borderColor = GREEN;
  else if (focused) borderColor = TEAL;

  // Keyboard type
  let keyboardType = 'default';
  if (type === 'phone') keyboardType = 'phone-pad';
  else if (type === 'email') keyboardType = 'email-address';
  else if (type === 'number') keyboardType = 'numeric';

  // Auto-capitalize
  let autoCapitalize = 'sentences';
  if (type === 'email') autoCapitalize = 'none';
  else if (type === 'phone' || type === 'number') autoCapitalize = 'none';

  const isMultiline = type === 'multiline';
  const isPassword = type === 'password';
  const isPhone = type === 'phone';
  const isSearch = type === 'search';

  // Floating label position
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isMultiline ? 16 : 18, 6],
  });
  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 11],
  });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GRAY_400, focused ? TEAL : GRAY_500],
  });

  return (
    <View style={[{ marginBottom: error ? 4 : 16 }, containerStyle]}>
      <View
        style={[
          {
            borderWidth: 1.5,
            borderColor,
            borderRadius: 16,
            backgroundColor: disabled ? '#F3F4F6' : '#FAFAFA',
            minHeight: isMultiline ? 100 : 56,
            flexDirection: 'row',
            alignItems: isMultiline ? 'flex-start' : 'center',
            paddingHorizontal: 16,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {/* Left icon */}
        {icon && !isPhone && (
          <View style={{ marginRight: 10, marginTop: isMultiline ? 18 : 0 }}>
            <Ionicons name={icon} size={18} color={focused ? TEAL : GRAY_400} />
          </View>
        )}

        {/* Phone prefix */}
        {isPhone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <Text style={{ fontSize: 16 }}>🇳🇬</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginLeft: 4 }}>+234</Text>
            <View style={{ width: 1, height: 24, backgroundColor: '#E5E7EB', marginLeft: 10 }} />
          </View>
        )}

        {/* Search icon */}
        {isSearch && (
          <View style={{ marginRight: 8 }}>
            <Ionicons name="search" size={18} color={GRAY_400} />
          </View>
        )}

        {/* Input area */}
        <View style={{ flex: 1, justifyContent: isMultiline ? 'flex-start' : 'center' }}>
          {/* Floating label */}
          {label && !isSearch ? (
            <Animated.Text
              style={{
                position: 'absolute',
                left: 0,
                top: labelTop,
                fontSize: labelSize,
                color: error ? RED : labelColor,
                fontWeight: '600',
                zIndex: 1,
              }}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          ) : null}

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={disabled ? undefined : onChangeText}
            placeholder={focused || isSearch ? placeholder : ''}
            placeholderTextColor="#D1D5DB"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={isPassword && !showPassword}
            editable={!disabled}
            multiline={isMultiline}
            maxLength={maxLength}
            autoFocus={autoFocus}
            onFocus={handleFocus}
            onBlur={handleBlur}
            textAlignVertical={isMultiline ? 'top' : 'center'}
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#1F2937',
              paddingTop: label && !isSearch ? 20 : isMultiline ? 12 : 0,
              paddingBottom: isMultiline ? 12 : 0,
              minHeight: isMultiline ? 80 : undefined,
              flex: 1,
            }}
            accessibilityLabel={label || placeholder}
            accessibilityHint={error || undefined}
            {...rest}
          />
        </View>

        {/* Right side: loading / success / password toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          {loading && <ActivityIndicator size="small" color={TEAL} />}
          {success && !loading && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
          {isPassword && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={GRAY_400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error message */}
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 4 }}>
          <Ionicons name="alert-circle" size={13} color={RED} />
          <Text style={{ fontSize: 11, color: RED, fontWeight: '500', marginLeft: 4 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
