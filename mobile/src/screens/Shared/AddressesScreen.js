import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/common/AppInput';


export default function AddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', name: '', address: '', city: '', phone: '' });

  const setDefault = (id) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const deleteAddress = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setAddresses(prev => prev.filter(a => a.id !== id));
      }},
    ]);
  };

  const handleAddAddress = () => {
    if (!newAddress.label || !newAddress.address) {
      Alert.alert('Missing Info', 'Please fill in at least a label and address.');
      return;
    }
    const addr = {
      id: Date.now().toString(),
      ...newAddress,
      isDefault: addresses.length === 0,
      icon: 'location',
    };
    setAddresses(prev => [...prev, addr]);
    setNewAddress({ label: '', name: '', address: '', city: '', phone: '' });
    setShowForm(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="bg-white px-5 pb-4"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
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
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Addresses</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-teal items-center justify-center"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Add Form */}
        {showForm && (
          <View
            className="mx-5 mt-4 bg-white rounded-2xl p-5"
            style={{
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
              borderWidth: 2,
              borderColor: '#35615D',
            }}
          >
            <Text className="text-base font-bold text-gray-800 mb-4">New Address</Text>
            <View className="gap-3">
              <AppInput
                label="Label"
                placeholder="e.g. Home, Office, Mom's"
                value={newAddress.label}
                onChangeText={(t) => setNewAddress({ ...newAddress, label: t })}
                type="text"
              />
              <AppInput
                label="Recipient Name"
                placeholder="Full name"
                value={newAddress.name}
                onChangeText={(t) => setNewAddress({ ...newAddress, name: t })}
                type="text"
                icon="person-outline"
              />
              <AppInput
                label="Address"
                placeholder="Street address"
                value={newAddress.address}
                onChangeText={(t) => setNewAddress({ ...newAddress, address: t })}
                type="text"
                icon="location-outline"
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AppInput
                    label="City"
                    placeholder="City"
                    value={newAddress.city}
                    onChangeText={(t) => setNewAddress({ ...newAddress, city: t })}
                    type="text"
                  />
                </View>
                <View className="flex-1">
                  <AppInput
                    label="Phone"
                    placeholder="Phone number"
                    value={newAddress.phone}
                    onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })}
                    type="phone"
                  />
                </View>
              </View>
              <TouchableOpacity
                className="bg-teal py-4 rounded-2xl items-center mt-1"
                style={{
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }}
                onPress={handleAddAddress}
              >
                <Text className="text-sm text-white font-bold">Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Address Cards */}
        <View className="px-5 pt-4 gap-3">
          {addresses.map((addr) => (
            <View
              key={addr.id}
              className="bg-white rounded-2xl p-4"
              style={{
                shadowColor: '#1F2937',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
                borderLeftWidth: 3,
                borderLeftColor: addr.isDefault ? '#35615D' : '#E5E7EB',
              }}
            >
              <View className="flex-row items-start">
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3.5"
                  style={{ backgroundColor: addr.isDefault ? '#E8F0EF' : '#F3F4F6' }}
                >
                  <Ionicons
                    name={`${addr.icon}-outline`}
                    size={20}
                    color={addr.isDefault ? '#35615D' : '#9CA3AF'}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[15px] font-bold text-gray-800">{addr.label}</Text>
                    {addr.isDefault && (
                      <View className="bg-teal-light px-2 py-0.5 rounded-full">
                        <Text className="text-[9px] text-teal font-bold">DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">{addr.name}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{addr.address}</Text>
                  <Text className="text-xs text-gray-400">{addr.city}</Text>
                  {addr.phone && (
                    <View className="flex-row items-center gap-1 mt-1.5">
                      <Ionicons name="call-outline" size={11} color="#9CA3AF" />
                      <Text className="text-[11px] text-gray-400">{addr.phone}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                {!addr.isDefault && (
                  <TouchableOpacity
                    className="flex-row items-center gap-1.5 px-3 py-2 bg-teal-light rounded-xl"
                    onPress={() => setDefault(addr.id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={14} color="#35615D" />
                    <Text className="text-[11px] text-teal font-bold">Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity className="flex-row items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl">
                  <Ionicons name="create-outline" size={14} color="#6B7280" />
                  <Text className="text-[11px] text-gray-500 font-semibold">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 px-3 py-2 bg-red-50 rounded-xl"
                  onPress={() => deleteAddress(addr.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text className="text-[11px] text-red-500 font-semibold">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {addresses.length === 0 && !showForm && (
          <View className="items-center mt-20 px-8">
            <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-5">
              <Ionicons name="location-outline" size={40} color="#3B82F6" />
            </View>
            <Text className="text-lg font-bold text-gray-800 mb-2">No saved addresses</Text>
            <Text className="text-sm text-gray-400 text-center leading-5">
              Add a delivery address to get started
            </Text>
          </View>
        )}

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
