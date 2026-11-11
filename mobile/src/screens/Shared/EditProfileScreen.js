import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { pickImageFromLibrary } from '../../utils/pickImage';
import { useAuth } from '../../context/AuthContext';
import { uploadAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';
import { apiError } from '../../utils/errors';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || 'Lagos');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);

  const handlePickImage = async () => {
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
      if (picked.denied) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile photo.');
        return;
      }

      const uri = picked.uri;
      setUploading(true);

      const response = await uploadAPI.image(uri);
      const url = response.data.url;

      await updateProfile({ avatar_url: url });
      setAvatarUrl(url);
      Alert.alert('Success', 'Profile photo updated!');
    } catch (err) {
      const message = apiError(err, 'Failed to upload photo.');
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Fields', 'Please enter your full name.');
      return;
    }
    try {
      setSaving(true);
      await updateProfile({
        // The phone number is the sign-in identity and cannot be changed
        // here, so it is not sent. An empty email is left as it is.
        full_name: fullName.trim(),
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        city: city.trim(),
      });
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const message = apiError(err, 'Something went wrong.');
      Alert.alert('Update Failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View
        className="px-5 pb-4 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#211F1C" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#1F4A45" />
            ) : (
              <Text className="text-base text-teal font-semibold">Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center mb-6">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-20 h-20 rounded-full"
              style={{ backgroundColor: '#EAE3D8' }}
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-teal items-center justify-center">
              <Text className="text-white text-3xl font-bold">{fullName.charAt(0) || 'U'}</Text>
            </View>
          )}
          <TouchableOpacity className="mt-2" onPress={handlePickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#1F4A45" />
            ) : (
              <Text className="text-sm text-teal font-medium">Change Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <AppInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            type="text"
          />

          <AppInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+234..."
            type="phone"
            disabled
          />
          <Text className="text-[12px] text-gray-400 -mt-2 mb-3">
            You sign in with this number, so it cannot be changed here.
          </Text>

          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            type="email"
          />

          <AppInput
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Lagos"
            type="text"
            icon="location-outline"
          />
        </View>

        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-10 ${saving ? 'bg-teal/70' : 'bg-teal'}`}
          style={{
            shadowColor: '#1F4A45',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Save Changes</Text>
          )}
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
