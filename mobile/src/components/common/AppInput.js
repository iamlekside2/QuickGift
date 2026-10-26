import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TEAL = '#1F4A45';
const GRAY_200 = '#E6E2DB';
const GRAY_400 = '#9A948A';
const RED = '#D24B4B';
const GREEN = '#3E8E63';
const LABEL_CHIP = '#FFFFFF'; // chip behind the notched label (matches the white field)

/**
 * AppInput — outlined input with the label notched on the top border.
 *
 * Props: label, value, onChangeText, placeholder,
 *   type ('text'|'password'|'phone'|'email'|'number'|'multiline'|'search'),
 *   error, success, loading, disabled, icon, maxLength, onBlur, onFocus,
 *   autoFocus, containerStyle, inputRef.
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

  const handleFocus = (e) => { setFocused(true); onFocus?.(e); };
  const handleBlur = (e) => { setFocused(false); onBlur?.(e); };

  let borderColor = GRAY_200;
  if (error) borderColor = RED;
  else if (success) borderColor = GREEN;
  else if (focused) borderColor = TEAL;

  let keyboardType = 'default';
  if (type === 'phone') keyboardType = 'phone-pad';
  else if (type === 'email') keyboardType = 'email-address';
  else if (type === 'number') keyboardType = 'numeric';

  let autoCapitalize = 'sentences';
  if (type === 'email' || type === 'phone' || type === 'number') autoCapitalize = 'none';

  const isMultiline = type === 'multiline';
  const isPassword = type === 'password';
  const isPhone = type === 'phone';
  const isSearch = type === 'search';

  const showLabel = !!label && !isSearch;
  const labelColor = error ? RED : focused ? TEAL : GRAY_400;

  // With a notched label, show the placeholder only while focused (avoids showing
  // the field's name twice). Search has no label, so it always shows its placeholder.
  const effPlaceholder = isSearch ? placeholder : showLabel && !focused ? '' : placeholder;

  return (
    <View style={[{ marginBottom: error ? 4 : 16, marginTop: showLabel ? 8 : 0 }, containerStyle]}>
      <View
        style={{
          borderWidth: 1.5,
          borderColor,
          borderRadius: 14,
          backgroundColor: disabled ? '#F4F1EB' : '#FFFFFF',
          minHeight: isMultiline ? 104 : 58,
          flexDirection: 'row',
          alignItems: isMultiline ? 'flex-start' : 'center',
          paddingHorizontal: 16,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Notched label sitting on the top border */}
        {showLabel && (
          <Text
            style={{
              position: 'absolute',
              top: -9,
              left: 12,
              backgroundColor: LABEL_CHIP,
              paddingHorizontal: 6,
              fontSize: 11.5,
              fontWeight: '700',
              color: labelColor,
              zIndex: 1,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}

        {/* Left icon */}
        {icon && !isPhone && (
          <View style={{ marginRight: 10, marginTop: isMultiline ? 16 : 0 }}>
            <Ionicons name={icon} size={18} color={focused ? TEAL : GRAY_400} />
          </View>
        )}

        {/* Phone prefix */}
        {isPhone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#211F1C' }}>+234</Text>
            <View style={{ width: 1, height: 24, backgroundColor: '#EAE3D8', marginLeft: 10 }} />
          </View>
        )}

        {/* Search icon */}
        {isSearch && (
          <View style={{ marginRight: 8 }}>
            <Ionicons name="search" size={18} color={GRAY_400} />
          </View>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={disabled ? undefined : onChangeText}
          placeholder={effPlaceholder}
          placeholderTextColor="#B5AFA2"
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
            flex: 1,
            fontSize: 14,
            fontWeight: '600',
            color: '#211F1C',
            paddingVertical: isMultiline ? 14 : 0,
            minHeight: isMultiline ? 80 : undefined,
          }}
          accessibilityLabel={label || placeholder}
          accessibilityHint={error || undefined}
          {...rest}
        />

        {/* Right side: loading / success / password toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          {loading && <ActivityIndicator size="small" color={TEAL} />}
          {success && !loading && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
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
