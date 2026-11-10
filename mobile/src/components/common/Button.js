import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/theme';
import { tapMedium } from '../../utils/haptics';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  haptic = true,
}) {
  const baseClasses = 'flex-row items-center justify-center rounded-[16px]';

  const variantClasses = {
    primary: 'bg-teal',
    secondary: 'bg-teal-light',
    outline: 'border-[1.5px] border-teal bg-transparent',
    ghost: 'bg-transparent',
    terracotta: 'bg-orange',
    danger: 'bg-transparent',
  };

  // Controls: 52px primary / 48px secondary per handoff.
  const sizeClasses = {
    sm: 'h-11 px-5',
    md: 'h-[52px] px-6',
    lg: 'h-[52px] px-7',
  };

  const textVariant = {
    primary: 'text-white',
    secondary: 'text-teal',
    outline: 'text-teal',
    ghost: 'text-teal',
    terracotta: 'text-white',
    danger: 'text-danger',
  };

  const textSizeClasses = {
    sm: 'text-[14px]',
    md: 'text-[15px]',
    lg: 'text-[15px]',
  };

  const tintedShadow = {
    primary: { shadowColor: COLORS.primary },
    terracotta: { shadowColor: COLORS.secondary },
  };

  const isSolid = variant === 'primary' || variant === 'terracotta';
  const inactive = disabled || loading;

  const handlePress = (e) => {
    if (inactive) return;
    if (haptic) tapMedium();
    onPress?.(e);
  };

  return (
    <Pressable
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} gap-2`}
      style={({ pressed }) => [
        isSolid && !disabled
          ? {
              ...tintedShadow[variant],
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.26,
              shadowRadius: 24,
              elevation: 6,
            }
          : {},
        { transform: [{ scale: pressed && !inactive ? 0.97 : 1 }], opacity: pressed && !inactive ? 0.95 : 1 },
        style,
      ]}
      onPress={handlePress}
      disabled={inactive}
    >
      {loading ? (
        <ActivityIndicator color={isSolid ? COLORS.textWhite : COLORS.primary} />
      ) : (
        <>
          {icon}
          <Text
            className={`font-bold ${textVariant[variant]} ${textSizeClasses[size]}`}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
