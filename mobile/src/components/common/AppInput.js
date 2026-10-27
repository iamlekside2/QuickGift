import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from './IconCompat';

const TEAL = '#1F4A45';
const INK = '#211F1C';
const GRAY_400 = '#9A948A';
const RED = '#D24B4B';
const GREEN = '#3E8E63';
const FILL = '#F1EEE8';       // soft cream fill (resting)
const FILL_FOCUS = '#FFFFFF'; // lifts to white on focus
const DIVIDER = '#E4DDD1';

// Small, reliably-rendering Nigeria flag (emoji flags don't render on Windows/web).
function NigeriaFlag() {
  return (
    <View style={{ width: 20, height: 14, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ flex: 1, backgroundColor: '#008751' }} />
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
      <View style={{ flex: 1, backgroundColor: '#008751' }} />
    </View>
  );
}

/**
 * AppInput — soft-filled input: label ABOVE the field, cream fill, no hard
 * border at rest, placeholder always visible, subtle teal lift on focus.
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

  // Resting = soft fill, no border. Focus = white + teal border. States tint it.
  let borderColor = 'transparent';
  let borderWidth = 0;
  let bg = FILL;
  if (error) { borderColor = RED; borderWidth = 1.5; bg = '#FCF4F3'; }
  else if (success) { borderColor = GREEN; borderWidth = 1.5; bg = FILL_FOCUS; }
  else if (focused) { borderColor = TEAL; borderWidth = 1.5; bg = FILL_FOCUS; }

  const labelColor = error ? RED : focused ? TEAL : GRAY_400;

  return (
    <View style={[{ marginBottom: error ? 6 : 16 }, containerStyle]}>
      {showLabel && (
        <Text
          style={{ fontSize: 12.5, fontWeight: '600', color: labelColor, marginBottom: 7, marginLeft: 2 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          borderWidth,
          borderColor,
          borderRadius: 14,
          backgroundColor: disabled ? '#F4F1EB' : bg,
          minHeight: isMultiline ? 108 : 52,
          flexDirection: 'row',
          alignItems: isMultiline ? 'flex-start' : 'center',
          paddingHorizontal: 14,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Left icon */}
        {icon && !isPhone && (
          <View style={{ marginRight: 10, marginTop: isMultiline ? 16 : 0 }}>
            <Ionicons name={icon} size={18} color={focused ? TEAL : GRAY_400} />
          </View>
        )}

        {/* Phone prefix: flag + +234 */}
        {isPhone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <NigeriaFlag />
            <Text style={{ fontSize: 15, fontWeight: '700', color: INK, marginLeft: 7 }}>+234</Text>
            <View style={{ width: 1, height: 22, backgroundColor: DIVIDER, marginLeft: 10 }} />
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
          placeholder={placeholder}
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
            fontSize: 15,
            fontWeight: '600',
            color: INK,
            paddingVertical: isMultiline ? 14 : 0,
            minHeight: isMultiline ? 80 : undefined,
            outlineStyle: 'none', // web: kill the default focus ring (we style our own)
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
          <Ionicons name="alert-circle" size={13} color={RED} />
          <Text style={{ fontSize: 11, color: RED, fontWeight: '500', marginLeft: 4 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
