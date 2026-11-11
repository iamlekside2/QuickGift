// Pick one photo from the device's library.
//
// Android opens the system photo picker, which needs no storage permission, so
// none is requested there (the app no longer declares the storage
// permissions). iOS still asks for photo-library access first.
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * @returns {Promise<{ uri: string } | { denied: true } | null>}
 *   the chosen photo, `{ denied: true }` when access was refused, or null when
 *   the user backed out.
 */
export async function pickImageFromLibrary(options = {}) {
  if (Platform.OS === 'ios') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { denied: true };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    ...options,
  });
  if (result.canceled || !result.assets?.length) return null;
  return { uri: result.assets[0].uri };
}

export default pickImageFromLibrary;
