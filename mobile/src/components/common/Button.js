import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

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
}) {
  const baseClasses = 'flex-row items-center justify-center';

  const variantClasses = {
    primary: 'bg-teal',
    secondary: 'bg-gray-100',
    outline: 'border-[1.5px] border-teal bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'py-2.5 px-5 rounded-xl',
    md: 'py-3.5 px-6 rounded-xl',
    lg: 'py-4 px-7 rounded-2xl',
  };

  const textVariant = {
    primary: 'text-white',
    secondary: 'text-gray-800',
    outline: 'text-teal',
    ghost: 'text-teal',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-[15px]',
    lg: 'text-base',
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} gap-2`}
      style={[
        variant === 'primary' && !disabled ? {
          shadowColor: '#35615D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        } : {},
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#35615D'} />
      ) : (
        <>
          {icon}
          <Text
            className={`font-semibold ${textVariant[variant]} ${textSizeClasses[size]}`}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
