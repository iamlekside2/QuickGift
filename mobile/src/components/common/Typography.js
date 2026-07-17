import React from 'react';
import { Text } from 'react-native';

// Instrument Serif families (registered in App.js).
const SERIF = 'InstrumentSerif_400Regular';
const SERIF_ITALIC = 'InstrumentSerif_400Regular_Italic';

/**
 * Serif headline with optional emphasized words rendered italic + terracotta,
 * matching the handoff pattern (e.g. "Gifts, delivered today." with "today").
 *
 * Props:
 *   text      — full headline string
 *   emphasis  — string | string[] of words/phrases to italicize in terracotta
 *   size      — font size (default 26 = screen title)
 *   color     — base ink color (default #211F1C)
 *   className, style — passthrough
 */
export function SerifHeadline({ text = '', emphasis = [], size = 26, color = '#211F1C', className, style, ...rest }) {
  const words = Array.isArray(emphasis) ? emphasis : [emphasis];
  const emphasized = words.filter(Boolean);

  if (emphasized.length === 0) {
    return (
      <Text className={className} style={[{ fontFamily: SERIF, fontSize: size, color, lineHeight: size * 1.12 }, style]} {...rest}>
        {text}
      </Text>
    );
  }

  // Split the text on the emphasized fragments, keeping them.
  const escaped = emphasized.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));

  return (
    <Text className={className} style={[{ fontFamily: SERIF, fontSize: size, color, lineHeight: size * 1.12 }, style]} {...rest}>
      {parts.map((part, i) =>
        emphasized.includes(part) ? (
          <Text key={i} style={{ fontFamily: SERIF_ITALIC, color: '#E8632F' }}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

/** Plain serif screen title (26px). */
export function ScreenTitle({ children, size = 26, color = '#211F1C', className, style, ...rest }) {
  return (
    <Text className={className} style={[{ fontFamily: SERIF, fontSize: size, color, lineHeight: size * 1.12 }, style]} {...rest}>
      {children}
    </Text>
  );
}

export const SERIF_FAMILY = SERIF;
export const SERIF_ITALIC_FAMILY = SERIF_ITALIC;
