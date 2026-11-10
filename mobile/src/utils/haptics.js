// Thin, crash-proof wrapper around expo-haptics. Every call is guarded so a
// device without a haptics engine (or a web build) never throws.
import * as Haptics from 'expo-haptics';

const safe = (fn) => {
  try {
    fn();
  } catch {
    /* no-op: haptics are a nice-to-have, never critical */
  }
};

/** Light tick for taps on buttons, cards and list rows. */
export const tapLight = () =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** Medium tick for primary actions (submit, pay, confirm). */
export const tapMedium = () =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** Success / error notification patterns. */
export const notifySuccess = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const notifyError = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
