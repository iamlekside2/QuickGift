import React from 'react';
import { Pressable } from 'react-native';
import { tapLight } from '../../utils/haptics';

/**
 * Drop-in replacement for TouchableOpacity that adds a subtle press-in scale and
 * a light haptic tick, so taps feel responsive like a native app. Accepts the
 * same className / style / onPress props; `style` may be an object or a
 * ({ pressed }) => style function.
 */
export default function Tap({
  onPress,
  haptic = true,
  scale = 0.97,
  disabled = false,
  className,
  style,
  children,
  ...rest
}) {
  const handlePress = (e) => {
    if (disabled) return;
    if (haptic) tapLight();
    onPress?.(e);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      className={className}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed && !disabled ? scale : 1 }],
          opacity: pressed && !disabled ? 0.92 : 1,
        },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
