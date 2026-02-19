import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const MENU_ITEMS = [
  { icon: 'wallet-outline', label: 'Wallet', sub: '₦0.00 balance', screen: 'Wallet' },
  { icon: 'heart-outline', label: 'Favourites', sub: 'Saved gifts & providers' },
  { icon: 'notifications-outline', label: 'Reminders', sub: 'Birthday & event alerts' },
  { icon: 'location-outline', label: 'Addresses', sub: 'Delivery addresses' },
  { icon: 'people-outline', label: 'Refer a Friend', sub: 'Earn ₦500 per referral' },
  { icon: 'help-circle-outline', label: 'Help & Support', sub: 'FAQs and chat support' },
  { icon: 'settings-outline', label: 'Settings', sub: 'Account preferences' },
];

export default function ProfileScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>G</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Guest User</Text>
          <Text style={styles.userPhone}>Sign in for full experience</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Gifts Sent</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>QuickGift v1.0.0</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.sizes.title, fontWeight: '800', color: COLORS.text },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginHorizontal: SPACING.xl, padding: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, ...SHADOWS.md, marginBottom: SPACING.xl,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  userPhone: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  editBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.xxl,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  menu: { paddingHorizontal: SPACING.xl, gap: SPACING.xs },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center',
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  menuSub: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, marginTop: SPACING.xxl, paddingVertical: SPACING.lg,
  },
  logoutText: { fontSize: FONTS.sizes.lg, color: COLORS.error, fontWeight: '600' },
  version: {
    textAlign: 'center', fontSize: FONTS.sizes.sm, color: COLORS.textLight, marginTop: SPACING.md,
  },
});
