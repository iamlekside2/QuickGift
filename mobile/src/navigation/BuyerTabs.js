import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/Home/HomeScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import HelpSupportScreen from '../screens/Shared/HelpSupportScreen';
import SettingsScreen from '../screens/Shared/SettingsScreen';
import EditProfileScreen from '../screens/Shared/EditProfileScreen';
import FavouritesScreen from '../screens/Shared/FavouritesScreen';
import RemindersScreen from '../screens/Shared/RemindersScreen';
import AddressesScreen from '../screens/Shared/AddressesScreen';
import ReferFriendScreen from '../screens/Shared/ReferFriendScreen';

import GiftsHomeScreen from '../screens/Gifts/GiftsHomeScreen';
import GiftsListScreen from '../screens/Gifts/GiftsListScreen';
import GiftDetailScreen from '../screens/Gifts/GiftDetailScreen';
import RecipientDetailsScreen from '../screens/Gifts/RecipientDetailsScreen';
import PaymentScreen from '../screens/Gifts/PaymentScreen';

import BeautyHomeScreen from '../screens/Beauty/BeautyHomeScreen';
import ProvidersListScreen from '../screens/Beauty/ProvidersListScreen';
import ProviderProfileScreen from '../screens/Beauty/ProviderProfileScreen';
import BookingScreen from '../screens/Beauty/BookingScreen';

import WriteReviewScreen from '../screens/Shared/WriteReviewScreen';
import RaiseDisputeScreen from '../screens/Shared/RaiseDisputeScreen';

import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import PaystackWebView from '../screens/Shared/PaystackWebView';
import PrivacyPolicyScreen from '../screens/Shared/PrivacyPolicyScreen';
import TermsScreen from '../screens/Shared/TermsScreen';
import WithdrawScreen from '../screens/Wallet/WithdrawScreen';
import AddBankAccountScreen from '../screens/Wallet/AddBankAccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="GiftsHome" component={GiftsHomeScreen} />
      <Stack.Screen name="GiftsList" component={GiftsListScreen} />
      <Stack.Screen name="GiftDetail" component={GiftDetailScreen} />
      <Stack.Screen name="RecipientDetails" component={RecipientDetailsScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="BeautyHome" component={BeautyHomeScreen} />
      <Stack.Screen name="ProvidersList" component={ProvidersListScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="PaystackWebView" component={PaystackWebView} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="RaiseDispute" component={RaiseDisputeScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="WalletScreen" component={WalletScreen} />
      <Stack.Screen name="WithdrawScreen" component={WithdrawScreen} />
      <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="ReferFriend" component={ReferFriendScreen} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="WithdrawScreen" component={WithdrawScreen} />
      <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused, color }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <View style={{
          position: 'absolute',
          top: -13,
          width: 20,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#35615D',
        }} />
      )}
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Wallet') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarActiveTintColor: '#35615D',
        tabBarInactiveTintColor: '#B0B8C1',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Wallet" component={WalletStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
