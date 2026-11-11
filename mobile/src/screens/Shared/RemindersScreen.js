import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Platform, Switch, Modal, Alert,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '../../components/common/IconCompat';
import AppInput from '../../components/common/AppInput';
import { remindersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/errors';
import { tapLight, notifySuccess, notifyError } from '../../utils/haptics';
import { MONTHS, MONTHS_LONG, MONTH_MAX, formatDay } from '../../utils/dates';

const OCCASIONS = [
  { label: 'Birthday', icon: 'balloon-outline', color: '#E8632F' },
  { label: 'Anniversary', icon: 'heart-outline', color: '#7A5FA8' },
  { label: 'Graduation', icon: 'school-outline', color: '#4C7CB0' },
  { label: 'Wedding', icon: 'diamond-outline', color: '#D24B4B' },
  { label: 'Holiday', icon: 'snow-outline', color: '#3E8E63' },
  { label: 'Custom', icon: 'sparkles-outline', color: '#B8862E' },
];
const occasionStyle = (label) =>
  OCCASIONS.find((o) => o.label === label) || OCCASIONS[OCCASIONS.length - 1];

const LEAD_TIMES = [
  { value: 0, label: 'On the day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
];

const cardShadow = {
  shadowColor: '#211F1C',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

const urgency = (days) => {
  if (days <= 7) return { bg: 'bg-red-50', text: 'text-red-600', border: '#D24B4B' };
  if (days <= 30) return { bg: 'bg-orange-light', text: 'text-orange', border: '#E8632F' };
  return { bg: 'bg-teal-light', text: 'text-teal', border: '#1F4A45' };
};

const daysLabel = (days) => {
  if (days <= 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return days <= 7 ? `${days} days left` : `${days} days`;
};

const blankForm = () => {
  const now = new Date();
  return {
    id: null,
    occasion: 'Birthday',
    custom: '',
    person: '',
    month: now.getMonth() + 1,
    day: now.getDate(),
    daysBefore: 3,
  };
};

/**
 * Occasion reminders. Saved on the server, so they survive reinstalling the
 * app and follow the account to another phone. They repeat every year; a few
 * days before each one we send a notification and an email.
 */
export default function RemindersScreen({ navigation }) {
  const { isAuthenticated, isGuest, logout } = useAuth();
  const signedIn = !!isAuthenticated && !isGuest;
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(signedIn);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null = editor closed
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!signedIn) return;
    try {
      const res = await remindersAPI.list();
      setReminders(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      setError(apiError(err, 'We could not load your reminders. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [signedIn]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = (occasion = 'Birthday') => {
    tapLight();
    setForm({ ...blankForm(), occasion });
  };

  const openEdit = (r) => {
    tapLight();
    const preset = OCCASIONS.some((o) => o.label === r.occasion && o.label !== 'Custom');
    setForm({
      id: r.id,
      occasion: preset ? r.occasion : 'Custom',
      custom: preset ? '' : r.occasion,
      person: r.person_name,
      month: r.month,
      day: r.day,
      daysBefore: r.days_before,
    });
  };

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const occasionName = form ? (form.occasion === 'Custom' ? form.custom.trim() : form.occasion) : '';
  const canSave = !!form && form.person.trim().length > 0 && occasionName.length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      occasion: occasionName,
      person_name: form.person.trim(),
      month: form.month,
      day: form.day,
      days_before: form.daysBefore,
    };
    try {
      if (form.id) await remindersAPI.update(form.id, payload);
      else await remindersAPI.create(payload);
      notifySuccess();
      setForm(null);
      await load();
    } catch (err) {
      notifyError();
      Alert.alert('Reminder not saved', apiError(err, 'We could not save this reminder. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const id = form?.id;
    if (!id) return;
    Alert.alert('Delete reminder', 'Remove this reminder? You will no longer be notified about it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remindersAPI.remove(id);
            setForm(null);
            await load();
          } catch (err) {
            Alert.alert('Not deleted', apiError(err, 'We could not delete this reminder. Please try again.'));
          }
        },
      },
    ]);
  };

  const toggleActive = async (r) => {
    const next = !r.is_active;
    // Flip straight away, and put it back if the server says no.
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: next } : x)));
    try {
      await remindersAPI.update(r.id, { is_active: next });
    } catch (err) {
      setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !next } : x)));
      Alert.alert('Not changed', apiError(err, 'We could not update this reminder. Please try again.'));
    }
  };

  const header = (
    <View
      className="bg-white px-5 pb-4"
      style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, ...cardShadow }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Reminders</Text>
        </View>
        {signedIn ? (
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-teal items-center justify-center"
            style={{ shadowColor: '#1F4A45', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
            onPress={() => openNew()}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (!signedIn) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        {header}
        <View className="items-center mt-16 px-8">
          <View className="w-24 h-24 rounded-full bg-orange-light items-center justify-center mb-5">
            <Ionicons name="notifications-outline" size={40} color="#E8632F" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2">Sign in to save reminders</Text>
          <Text className="text-sm text-gray-400 text-center leading-5 mb-6">
            Save birthdays and anniversaries and we will remind you in time to send a gift.
          </Text>
          <TouchableOpacity className="bg-teal px-8 py-3.5 rounded-2xl" onPress={() => logout()}>
            <Text className="text-white font-bold text-[15px]">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const maxDay = form ? MONTH_MAX[form.month - 1] : 31;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {header}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#1F4A45"
          />
        }
      >
        {/* Quick add */}
        <View className="px-5 pt-5 pb-2">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Add</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ.label}
                className="items-center gap-1.5"
                activeOpacity={0.7}
                onPress={() => openNew(occ.label)}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: occ.color + '18' }}
                >
                  <Ionicons name={occ.icon} size={24} color={occ.color} />
                </View>
                <Text className="text-[10px] text-gray-500 font-semibold">{occ.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming */}
        <View className="px-5 pt-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming</Text>
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#1F4A45" />
            </View>
          ) : error ? (
            <View className="items-center py-8 px-6">
              <Text className="text-[13px] text-gray-500 text-center leading-5 mb-4">{error}</Text>
              <TouchableOpacity
                className="border-[1.5px] border-teal px-6 py-2.5 rounded-xl"
                onPress={() => { setLoading(true); load(); }}
              >
                <Text className="text-teal font-bold text-[13.5px]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : reminders.length === 0 ? (
            <View className="items-center mt-10 px-8 mb-6">
              <View className="w-24 h-24 rounded-full bg-orange-light items-center justify-center mb-5">
                <Ionicons name="notifications-outline" size={40} color="#E8632F" />
              </View>
              <Text className="text-lg font-bold text-gray-800 mb-2">No reminders yet</Text>
              <Text className="text-sm text-gray-400 text-center leading-5 mb-5">
                Add a birthday or anniversary and we will remind you in time to send a gift.
              </Text>
              <TouchableOpacity className="bg-teal px-6 py-3 rounded-2xl" onPress={() => openNew()}>
                <Text className="text-white font-bold text-[14px]">Add a reminder</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {reminders.map((r) => {
                const u = urgency(r.days_left);
                const occ = occasionStyle(r.occasion);
                return (
                  <TouchableOpacity
                    key={r.id}
                    activeOpacity={0.85}
                    onPress={() => openEdit(r)}
                    className="bg-white rounded-2xl p-4"
                    style={{
                      ...cardShadow,
                      borderLeftWidth: 3,
                      borderLeftColor: r.is_active ? u.border : '#EAE3D8',
                      opacity: r.is_active ? 1 : 0.6,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5"
                        style={{ backgroundColor: occ.color + '18' }}
                      >
                        <Ionicons name={occ.icon} size={22} color={occ.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-gray-800" numberOfLines={1}>{r.person_name}</Text>
                        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{r.occasion}</Text>
                        <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="calendar-outline" size={12} color="#9A948A" />
                            <Text className="text-[11px] text-gray-400">{formatDay(r.next_date, { year: false })}</Text>
                          </View>
                          <View className={`px-2 py-0.5 rounded-full ${u.bg}`}>
                            <Text className={`text-[10px] font-bold ${u.text}`}>{daysLabel(r.days_left)}</Text>
                          </View>
                        </View>
                      </View>
                      <View className="items-end gap-2">
                        <Switch
                          value={r.is_active}
                          onValueChange={() => toggleActive(r)}
                          trackColor={{ false: '#EAE3D8', true: '#1F4A45' }}
                          thumbColor="#fff"
                          style={{ transform: [{ scale: 0.75 }] }}
                        />
                        <TouchableOpacity
                          className="px-3 py-1.5 bg-teal-light rounded-lg"
                          onPress={() => navigation.navigate('Gifts')}
                        >
                          <Text className="text-[10px] text-teal font-bold">Send Gift</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* How it works */}
        <View className="mx-5 mt-6 mb-4">
          <View className="bg-orange-light rounded-2xl p-4 flex-row items-center gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-orange/10 items-center justify-center">
              <Ionicons name="bulb-outline" size={20} color="#E8632F" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800">How reminders work</Text>
              <Text className="text-xs text-gray-500 mt-0.5 leading-4">
                Reminders repeat every year. We notify you here and by email a few days before, so your gift arrives on time.
              </Text>
            </View>
          </View>
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      {/* Add / edit */}
      <Modal visible={!!form} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setForm(null)}>
        {form ? (
          <KeyboardAvoidingView
            className="flex-1 bg-white"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ paddingTop: Platform.OS === 'ios' ? 24 : 30 }}
          >
            <View className="flex-row items-center px-5 pb-4 border-b border-gray-100">
              <Text className="flex-1 text-lg font-bold text-gray-800">
                {form.id ? 'Edit reminder' : 'New reminder'}
              </Text>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                onPress={() => setForm(null)}
              >
                <Ionicons name="close" size={20} color="#6E6A63" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Occasion</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {OCCASIONS.map((occ) => {
                  const active = form.occasion === occ.label;
                  return (
                    <TouchableOpacity
                      key={occ.label}
                      className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 ${
                        active ? 'border-teal bg-teal-light/30' : 'border-gray-200 bg-gray-50'
                      }`}
                      onPress={() => set({ occasion: occ.label })}
                    >
                      <Ionicons name={occ.icon} size={15} color={active ? '#1F4A45' : '#9A948A'} />
                      <Text className={`text-[13px] font-bold ${active ? 'text-teal' : 'text-gray-500'}`}>{occ.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {form.occasion === 'Custom' ? (
                <AppInput
                  label="Name of the occasion"
                  value={form.custom}
                  onChangeText={(t) => set({ custom: t })}
                  placeholder="e.g. Naming ceremony"
                  maxLength={40}
                />
              ) : null}

              <AppInput
                label="Who is it for?"
                value={form.person}
                onChangeText={(t) => set({ person: t })}
                placeholder="e.g. Mum"
                icon="person-outline"
                maxLength={80}
              />

              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} className="mb-4">
                {MONTHS.map((m, i) => {
                  const active = form.month === i + 1;
                  return (
                    <TouchableOpacity
                      key={m}
                      className={`px-4 py-2.5 rounded-2xl border-2 ${active ? 'border-teal bg-teal-light/30' : 'border-gray-200 bg-gray-50'}`}
                      onPress={() => set({ month: i + 1, day: Math.min(form.day, MONTH_MAX[i]) })}
                    >
                      <Text className={`text-[13px] font-bold ${active ? 'text-teal' : 'text-gray-500'}`}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Day</Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => {
                  const active = form.day === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      className={`w-10 h-10 rounded-xl items-center justify-center border-2 ${
                        active ? 'border-teal bg-teal' : 'border-gray-200 bg-gray-50'
                      }`}
                      onPress={() => set({ day: d })}
                    >
                      <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-gray-600'}`}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-[12px] text-gray-400 mb-4">
                Every year on {form.day} {MONTHS_LONG[form.month - 1]}.
              </Text>

              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remind me</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {LEAD_TIMES.map((lt) => {
                  const active = form.daysBefore === lt.value;
                  return (
                    <TouchableOpacity
                      key={lt.value}
                      className={`px-3.5 py-2.5 rounded-2xl border-2 ${active ? 'border-teal bg-teal-light/30' : 'border-gray-200 bg-gray-50'}`}
                      onPress={() => set({ daysBefore: lt.value })}
                    >
                      <Text className={`text-[13px] font-bold ${active ? 'text-teal' : 'text-gray-500'}`}>{lt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {form.id ? (
                <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 mb-4" onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={16} color="#D24B4B" />
                  <Text className="text-[13.5px] font-bold" style={{ color: '#D24B4B' }}>Delete this reminder</Text>
                </TouchableOpacity>
              ) : null}
              <View className="h-6" />
            </ScrollView>

            <View className="px-5 pb-8 pt-4 border-t border-gray-100">
              <TouchableOpacity
                className={`h-14 rounded-2xl items-center justify-center ${canSave && !saving ? 'bg-teal' : 'bg-gray-200'}`}
                onPress={handleSave}
                disabled={!canSave || saving}
              >
                <Text className={`text-base font-bold ${canSave && !saving ? 'text-white' : 'text-gray-400'}`}>
                  {saving ? 'Saving…' : form.id ? 'Save changes' : 'Save reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </Modal>
    </View>
  );
}
