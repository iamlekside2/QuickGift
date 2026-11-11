import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '../../components/common/IconCompat';
import ScreenHeader from '../../components/common/ScreenHeader';
import { poolsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/errors';
import { tapLight, notifyError } from '../../utils/haptics';

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;

const STATUS = {
  open: { label: 'Collecting', bg: 'bg-teal-light', text: 'text-teal' },
  funding: { label: 'Fully paid', bg: 'bg-teal-light', text: 'text-teal' },
  funded: { label: 'Fully paid', bg: 'bg-teal-light', text: 'text-teal' },
  expired: { label: 'Closed, refunded', bg: 'bg-sand', text: 'text-ink-soft' },
  cancelled: { label: 'Cancelled, refunded', bg: 'bg-sand', text: 'text-ink-soft' },
};

const closesOn = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const shareGroupGift = async (pool) => {
  if (!pool?.share_url) return;
  try {
    await Share.share({
      message:
        `We are putting money together for ${pool.recipient_name ? `a gift for ${pool.recipient_name}` : 'a gift'}. ` +
        `Chip in whatever you can here. It takes a minute and you pay by card:\n\n${pool.share_url}`,
    });
  } catch {
    // The share sheet was dismissed or is unavailable.
  }
};

const shadow = { shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 };

/**
 * The group gifts this person has started: how much each has raised, who has
 * chipped in, the link to share, and a way to cancel one that is still open.
 */
export default function GroupGiftsScreen({ navigation }) {
  const { isAuthenticated, isGuest, logout } = useAuth();
  const signedIn = !!isAuthenticated && !isGuest;
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(signedIn);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);       // which card is expanded
  const [details, setDetails] = useState({});       // id -> contributions
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!signedIn) return;
    try {
      const res = await poolsAPI.mine();
      setPools(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      setError(apiError(err, 'We could not load your group gifts. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [signedIn]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (pool) => {
    tapLight();
    if (openId === pool.id) { setOpenId(null); return; }
    setOpenId(pool.id);
    try {
      const res = await poolsAPI.get(pool.id);
      setDetails((d) => ({ ...d, [pool.id]: res.data?.contributions || [] }));
    } catch {
      setDetails((d) => ({ ...d, [pool.id]: null }));
    }
  };

  const cancel = (pool) => {
    Alert.alert(
      'Cancel this group gift?',
      Number(pool.raised) > 0
        ? `Everyone who chipped in will be refunded to their card (${naira(pool.raised)} in total). This cannot be undone.`
        : 'The link will stop working. This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel group gift',
          style: 'destructive',
          onPress: async () => {
            setBusyId(pool.id);
            try {
              await poolsAPI.cancel(pool.id);
              await load();
            } catch (err) {
              notifyError();
              Alert.alert('Not cancelled', apiError(err, 'We could not cancel this group gift. Please try again.'));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="dark" />
      <ScreenHeader variant="stack" title="Group gifts" onBack={() => navigation.goBack()} />

      {!signedIn ? (
        <View className="items-center px-8 pt-16">
          <View className="w-24 h-24 rounded-full bg-teal-light items-center justify-center mb-5">
            <Ionicons name="people-outline" size={40} color="#1F4A45" />
          </View>
          <Text className="text-lg font-bold text-ink mb-2">Sign in to start a group gift</Text>
          <Text className="text-sm text-ink-soft text-center leading-5 mb-6">
            Split the cost of a gift with friends. They chip in by card from a link.
          </Text>
          <TouchableOpacity className="bg-teal px-8 h-[50px] rounded-[16px] items-center justify-center" onPress={() => logout()}>
            <Text className="text-white font-bold text-[15px]">Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1F4A45" />
          }
        >
          {loading ? (
            <View className="py-16 items-center"><ActivityIndicator color="#1F4A45" /></View>
          ) : error ? (
            <View className="items-center py-12 px-6">
              <Text className="text-[13px] text-ink-soft text-center leading-5 mb-4">{error}</Text>
              <TouchableOpacity className="border-[1.5px] border-teal px-6 py-2.5 rounded-xl" onPress={() => { setLoading(true); load(); }}>
                <Text className="text-teal font-bold text-[13.5px]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : pools.length === 0 ? (
            <View className="items-center px-6 pt-12">
              <View className="w-24 h-24 rounded-full bg-teal-light items-center justify-center mb-5">
                <Ionicons name="people-outline" size={40} color="#1F4A45" />
              </View>
              <Text className="text-lg font-bold text-ink mb-2">No group gifts yet</Text>
              <Text className="text-sm text-ink-soft text-center leading-5">
                Add a gift to your cart, tap Checkout and switch on "Split the cost with friends". You get a link to share, and friends chip in by card.
              </Text>
            </View>
          ) : (
            pools.map((pool) => {
              const st = STATUS[pool.status] || STATUS.open;
              const pct = pool.target > 0 ? Math.min(100, Math.round((pool.raised / pool.target) * 100)) : 0;
              const isOpen = pool.status === 'open';
              const expanded = openId === pool.id;
              const list = details[pool.id];
              return (
                <View key={pool.id} className="bg-white rounded-[20px] p-5 mb-3.5" style={shadow}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => toggle(pool)}>
                    <View className="flex-row items-start justify-between gap-3 mb-3">
                      <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={2}>{pool.title}</Text>
                      <View className={`px-2.5 py-1 rounded-full ${st.bg}`}>
                        <Text className={`text-[10.5px] font-bold ${st.text}`}>{st.label}</Text>
                      </View>
                    </View>

                    <View className="h-2.5 rounded-full bg-sand overflow-hidden">
                      <View className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                    </View>
                    <View className="flex-row items-baseline justify-between mt-2.5">
                      <Text className="text-[13px] text-ink-soft">
                        <Text className="text-[17px] font-extrabold text-ink">{naira(pool.raised)}</Text> raised
                      </Text>
                      <Text className="text-[13px] text-ink-soft">of {naira(pool.target)}</Text>
                    </View>
                    <Text className="text-[12px] text-ink-caption mt-1.5">
                      {pool.contributors || 0} {pool.contributors === 1 ? 'person has' : 'people have'} chipped in
                      {isOpen && closesOn(pool.deadline) ? ` · closes ${closesOn(pool.deadline)}` : ''}
                      {pool.order_number && !isOpen && pool.status !== 'expired' && pool.status !== 'cancelled' ? ` · order ${pool.order_number}` : ''}
                    </Text>
                  </TouchableOpacity>

                  {expanded ? (
                    <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#F5F0E7' }}>
                      {list === undefined ? (
                        <ActivityIndicator color="#1F4A45" />
                      ) : list === null ? (
                        <Text className="text-[12.5px] text-ink-soft">We could not load who chipped in.</Text>
                      ) : list.length === 0 ? (
                        <Text className="text-[12.5px] text-ink-soft">Nobody has chipped in yet. Share the link to get started.</Text>
                      ) : (
                        list.map((c, i) => (
                          <View key={`${c.name}-${i}`} className="flex-row items-center justify-between py-1.5">
                            <Text className="flex-1 text-[13px] text-ink" numberOfLines={1}>{c.name}</Text>
                            <Text className={`text-[13px] font-bold ${c.refunded ? 'text-ink-caption' : 'text-ink'}`}>
                              {naira(c.amount)}{c.refunded ? ' (refunded)' : ''}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  ) : null}

                  {isOpen ? (
                    <View className="flex-row gap-2.5 mt-4">
                      <TouchableOpacity
                        className="flex-1 bg-teal h-[46px] rounded-[14px] flex-row items-center justify-center gap-2"
                        onPress={() => { tapLight(); shareGroupGift(pool); }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="share-social" size={16} color="#fff" />
                        <Text className="text-[13.5px] font-bold text-white">Share link</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="px-5 h-[46px] rounded-[14px] items-center justify-center border-[1.5px] border-line-border"
                        onPress={() => cancel(pool)}
                        disabled={busyId === pool.id}
                      >
                        <Text className="text-[13.5px] font-bold text-ink-soft">
                          {busyId === pool.id ? 'Cancelling…' : 'Cancel'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
          <View className="h-[100px]" />
        </ScrollView>
      )}
    </View>
  );
}
