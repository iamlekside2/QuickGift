import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';

// React Native does NOT synthesize weights from a single custom font family —
// each Plus Jakarta Sans weight is registered as its own family. This maps a
// numeric/keyword fontWeight to the correct registered family so the existing
// `font-semibold` / `fontWeight: '700'` styling across the app renders in the
// right Jakarta weight automatically, without touching every Text node.
const JAKARTA = {
  '100': 'PlusJakartaSans_200ExtraLight',
  '200': 'PlusJakartaSans_200ExtraLight',
  '300': 'PlusJakartaSans_300Light',
  '400': 'PlusJakartaSans_400Regular',
  normal: 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  bold: 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
  '900': 'PlusJakartaSans_800ExtraBold',
};

function patch(Component) {
  if (!Component || Component.__qgFontPatched) return;
  const orig = Component.render;
  if (typeof orig !== 'function') return;
  Component.__qgFontPatched = true;
  Component.render = function render(...args) {
    const el = orig.apply(this, args);
    if (!el) return el;
    const flat = StyleSheet.flatten(el.props?.style) || {};
    // Respect an explicit custom family (e.g. Instrument Serif titles).
    if (flat.fontFamily) return el;
    const weight = flat.fontWeight != null ? String(flat.fontWeight) : '400';
    const family = JAKARTA[weight] || JAKARTA['400'];
    return React.cloneElement(el, {
      style: [el.props.style, { fontFamily: family }],
    });
  };
}

// Call once, before the app renders.
export function applyGlobalFonts() {
  try {
    patch(Text);
    patch(TextInput);
  } catch (e) {
    // Non-fatal: text falls back to system font if patching ever fails.
  }
}
