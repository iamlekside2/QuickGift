import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '../components/common/IconCompat';

import ProviderDashboard from '../screens/Provider/ProviderDashboard';
import ProviderBookings from '../screens/Provider/ProviderBookings';
import ProviderSchedule from '../screens/Provider/ProviderSchedule';
import ProviderServices from '../screens/Provider/ProviderServices';
import ProviderReviews from '../screens/Provider/ProviderReviews';
import BookingDetail from '../screens/Provider/BookingDetail';
import ServiceForm from '../screens/Provider/ServiceForm';
import ProviderProducts from '../screens/Provider/ProviderProducts';
import ProductForm from '../screens/Provider/ProductForm';
import AvailabilityScreen from '../screens/Provider/AvailabilityScreen';
import ProviderNotifications from '../screens/Provider/ProviderNotifications';
import BusinessProfile from '../screens/Provider/BusinessProfile';
import EditBusinessProfile from '../screens/Provider/EditBusinessProfile';
import WalletScreen from '../screens/Wallet/WalletScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import HelpSupportScreen from '../screens/Shared/HelpSupportScreen';
import SettingsScreen from '../screens/Shared/SettingsScreen';
import EditProfileScreen from '../screens/Shared/EditProfileScreen';
import FeedbackScreen from '../screens/Shared/FeedbackScreen';

import ProviderOrdersScreen from '../screens/Provider/ProviderOrdersScreen';
import PrivacyPolicyScreen from '../screens/Shared/PrivacyPolicyScreen';
import TermsScreen from '../screens/Shared/TermsScreen';

import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import WithdrawScreen from '../screens/Wallet/WithdrawScreen';
import AddBankAccountScreen from '../screens/Wallet/AddBankAccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PROVIDER_SCREENS = [
  { name: 'BookingDetail', component: BookingDetail },
  { name: 'ProviderSchedule', component: ProviderSchedule },
  { name: 'ProviderServices', component: ProviderServices },
  { name: 'ProviderReviews', component: ProviderReviews },
  { name: 'ServiceForm', component: ServiceForm },
  { name: 'ProviderProducts', component: ProviderProducts },
  { name: 'ProductForm', component: ProductForm },
  { name: 'AvailabilityScreen', component: AvailabilityScreen },
  { name: 'ProviderNotifications', component: ProviderNotifications },
  { name: 'BusinessProfile', component: BusinessProfile },
  { name: 'EditBusinessProfile', component: EditBusinessProfile },
  { name: 'WalletScreen', component: WalletScreen },
  { name: 'HelpSupport', component: HelpSupportScreen },
  { name: 'Settings', component: SettingsScreen },
  { name: 'EditProfile', component: EditProfileScreen },
  { name: 'ChatScreen', component: ChatScreen },
  { name: 'WithdrawScreen', component: WithdrawScreen },
  { name: 'AddBankAccount', component: AddBankAccountScreen },
  { name: 'ProviderOrders', component: ProviderOrdersScreen },
  { name: 'PrivacyPolicy', component: PrivacyPolicyScreen },
  { name: 'Terms', component: TermsScreen },
  { name: 'Feedback', component: FeedbackScreen },
];

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={ProviderDashboard} />
      {PROVIDER_SCREENS.map((s) => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsMain" component={ProviderBookings} />
      <Stack.Screen name="BookingDetail" component={BookingDetail} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      {PROVIDER_SCREENS.map((s) => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
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
          backgroundColor: '#E8632F',
        }} />
      )}
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
}

export default function ProviderTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Bookings') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Wallet') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarActiveTintColor: '#E8632F',
        tabBarInactiveTintColor: '#4A4742',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        // Reserve the device's bottom safe-area so the tabs clear the Android
        // nav bar / iOS home indicator instead of sitting under them.
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EFE9DE',
          elevation: 0,
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      <Tab.Screen name="Wallet" component={WalletStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
