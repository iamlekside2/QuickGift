import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch, ActivityIndicator, Modal, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { providersAPI } from '../../services/api';
import { apiError } from '../../utils/errors';
import { notifySuccess, notifyError } from '../../utils/haptics';

const TIME_OPTIONS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM',
];

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const BUFFER_OPTIONS = ['15 min', '30 min', '1 hr'];
const BUFFER_MINUTES = { '15 min': 15, '30 min': 30, '1 hr': 60 };
const bufferLabel = (minutes) => {
  const m = Number(minutes);
  if (m <= 15) return '15 min';
  if (m >= 60) return '1 hr';
  return '30 min';
};

const DEFAULT_SCHEDULE = {
  mon: { active: true, start: '9:00 AM', end: '5:00 PM' },
  tue: { active: true, start: '9:00 AM', end: '5:00 PM' },
  wed: { active: true, start: '9:00 AM', end: '5:00 PM' },
  thu: { active: true, start: '9:00 AM', end: '5:00 PM' },
  fri: { active: true, start: '9:00 AM', end: '5:00 PM' },
  sat: { active: false, start: '', end: '' },
  sun: { active: false, start: '', end: '' },
};

const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const displayDay = (d) =>
  d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// A saved blocked date is { date: 'YYYY-MM-DD', name, dates } (`dates` is the
// label shown here; `date` is what the booking screen checks).
const normaliseBlocked = (list) =>
  (Array.isArray(list) ? list : [])
    .map((b) => {
      if (typeof b === 'string') {
        const d = new Date(`${b.slice(0, 10)}T00:00:00`);
        return { date: b.slice(0, 10), name: 'Day off', dates: Number.isNaN(d.getTime()) ? b : displayDay(d) };
      }
      if (b && typeof b === 'object') {
        return { date: b.date || null, name: b.name || 'Day off', dates: b.dates || b.date || '' };
      }
      return null;
    })
    .filter(Boolean);

export default function AvailabilityScreen({ navigation }) {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [buffer, setBuffer] = useState('30 min');
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState({ dayKey: null, field: null }); // field: 'start' or 'end'
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Load what is saved on the server.
  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await providersAPI.getAvailability();
      const data = res.data || {};
      const merged = {};
      DAYS.forEach(({ key }) => {
        const saved = data.schedule?.[key];
        merged[key] = saved && typeof saved === 'object'
          ? { active: !!saved.active, start: saved.start || '', end: saved.end || '' }
          : { ...DEFAULT_SCHEDULE[key] };
      });
      setSchedule(merged);
      setBuffer(bufferLabel(data.buffer_minutes ?? 30));
      setBlockedDates(normaliseBlocked(data.blocked_dates));
    } catch (e) {
      setLoadError(apiError(e, 'We could not load your availability.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // The next 60 days, for choosing a day off.
  const upcomingDays = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return { iso: isoDay(d), label: displayDay(d) };
  }), []);

  const openTimePicker = (dayKey, field) => {
    setTimePickerTarget({ dayKey, field });
    setTimePickerVisible(true);
  };

  const selectTime = (time) => {
    const { dayKey, field } = timePickerTarget;
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: time },
    }));
    setTimePickerVisible(false);
  };

  const toggleDay = (key) => {
    setSchedule((prev) => {
      const day = prev[key];
      const active = !day.active;
      return {
        ...prev,
        // A day switched on needs hours to show.
        [key]: {
          active,
          start: active ? day.start || '9:00 AM' : day.start,
          end: active ? day.end || '5:00 PM' : day.end,
        },
      };
    });
  };

  const addBlockedDate = (day) => {
    setDatePickerVisible(false);
    setBlockedDates((prev) =>
      prev.some((b) => b.date === day.iso)
        ? prev
        : [...prev, { date: day.iso, name: 'Day off', dates: day.label }].sort((a, b) =>
          String(a.date || '').localeCompare(String(b.date || ''))),
    );
  };

  const removeBlockedDate = (index) => {
    setBlockedDates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (saving) return;
    // Each working day needs an opening time before its closing time.
    const bad = DAYS.find(({ key }) => {
      const day = schedule[key];
      if (!day.active) return false;
      const start = TIME_OPTIONS.indexOf(day.start);
      const end = TIME_OPTIONS.indexOf(day.end);
      return start < 0 || end < 0 || end <= start;
    });
    if (bad) {
      Alert.alert('Check your hours', `${bad.label} needs a closing time that is later than its opening time.`);
      return;
    }
    try {
      setSaving(true);
      await providersAPI.saveAvailability({
        schedule,
        buffer_minutes: BUFFER_MINUTES[buffer] || 30,
        blocked_dates: blockedDates,
      });
      notifySuccess();
      Alert.alert('Availability Saved', 'Your working hours have been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      notifyError();
      Alert.alert('Not saved', apiError(e, 'We could not save your availability. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View
      style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
      className="px-5 pb-4 bg-white"
    >
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#211F1C" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Availability</Text>
      </View>
    </View>
  );

  // Never show (or let the provider save over) hours we could not load.
  if (loading || loadError) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        {header}
        <View className="flex-1 items-center justify-center px-8">
          {loading ? (
            <ActivityIndicator size="large" color="#1F4A45" />
          ) : (
            <>
              <Ionicons name="cloud-offline-outline" size={44} color="#9A948A" />
              <Text className="text-base font-bold text-gray-800 mt-3 text-center">Could not load your availability</Text>
              <Text className="text-sm text-gray-400 mt-1 text-center">{loadError}</Text>
              <TouchableOpacity className="bg-teal px-6 py-3 rounded-2xl mt-4" onPress={load}>
                <Text className="text-sm text-white font-bold">Try Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      {header}

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Working Hours */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Working Hours</Text>
        <View className="gap-2 mb-6">
          {DAYS.map((day) => {
            const daySchedule = schedule[day.key];
            return (
              <View
                key={day.key}
                className="flex-row items-center rounded-2xl p-3.5 bg-white"
                style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, opacity: daySchedule.active ? 1 : 0.7 }}
              >
                <Switch
                  value={daySchedule.active}
                  onValueChange={() => toggleDay(day.key)}
                  trackColor={{ false: '#EAE3D8', true: '#1F4A45' }}
                  thumbColor="#fff"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
                <Text className={`text-sm font-bold w-24 ml-2 ${
                  daySchedule.active ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {day.label}
                </Text>
                {daySchedule.active ? (
                  <View className="flex-1 flex-row items-center justify-end gap-2">
                    <TouchableOpacity
                      className="bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-100"
                      onPress={() => openTimePicker(day.key, 'start')}
                    >
                      <Text className="text-xs text-gray-700">{daySchedule.start}</Text>
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-400">to</Text>
                    <TouchableOpacity
                      className="bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-100"
                      onPress={() => openTimePicker(day.key, 'end')}
                    >
                      <Text className="text-xs text-gray-700">{daySchedule.end}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="flex-1 text-xs text-gray-400 text-right">Closed</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Buffer Time */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Buffer Between Appointments</Text>
        <View className="bg-gray-100 rounded-2xl p-1 flex-row gap-1 mb-6">
          {BUFFER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={`flex-1 py-3 rounded-xl items-center ${
                buffer === opt ? 'bg-teal' : ''
              }`}
              style={buffer === opt ? { shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}}
              onPress={() => setBuffer(opt)}
            >
              <Text className={`text-sm font-bold ${
                buffer === opt ? 'text-white' : 'text-gray-400'
              }`}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Blocked Dates */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Blocked Dates</Text>
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4 mb-2 gap-3"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          onPress={() => setDatePickerVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={22} color="#1F4A45" />
          <Text className="text-sm text-teal font-bold">Add holiday or time off</Text>
        </TouchableOpacity>

        {blockedDates.length === 0 ? (
          <View className="items-center py-4 mb-4">
            <Text className="text-sm text-gray-400">No blocked dates</Text>
          </View>
        ) : (
          blockedDates.map((blocked, index) => (
            <View
              key={blocked.date || index}
              className="flex-row items-center bg-white rounded-2xl p-4 mb-2 gap-3"
              style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderLeftWidth: 3, borderLeftColor: '#E8632F' }}
            >
              <Ionicons name="calendar-outline" size={18} color="#E8632F" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800">{blocked.name}</Text>
                <Text className="text-xs text-gray-400">{blocked.dates}</Text>
              </View>
              <TouchableOpacity onPress={() => removeBlockedDate(index)}>
                <Ionicons name="close-circle" size={20} color="#9A948A" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Save */}
        <TouchableOpacity
          className="bg-teal py-4 rounded-2xl items-center mb-10 mt-4"
          style={{ opacity: saving ? 0.7 : 1 }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Save Availability</Text>
          )}
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>

      {/* Day-off Picker Modal */}
      <Modal visible={datePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <View className="bg-white rounded-t-3xl pt-4 pb-8 px-5" style={{ maxHeight: 460 }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-800">Choose a day off</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={22} color="#9A948A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={upcomingDays}
              keyExtractor={(item) => item.iso}
              renderItem={({ item }) => {
                const taken = blockedDates.some((b) => b.date === item.iso);
                return (
                  <TouchableOpacity
                    className="py-3.5 px-4 rounded-xl mb-1 flex-row items-center justify-between"
                    disabled={taken}
                    onPress={() => addBlockedDate(item)}
                  >
                    <Text className={`text-sm font-semibold ${taken ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.label}
                    </Text>
                    {taken ? <Text className="text-xs text-gray-300">Blocked</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={timePickerVisible} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setTimePickerVisible(false)}
        >
          <View className="bg-white rounded-t-3xl pt-4 pb-8 px-5" style={{ maxHeight: 420 }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-800">
                Select {timePickerTarget.field === 'start' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                <Ionicons name="close" size={22} color="#9A948A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected =
                  timePickerTarget.dayKey &&
                  schedule[timePickerTarget.dayKey]?.[timePickerTarget.field] === item;
                return (
                  <TouchableOpacity
                    className={`py-3.5 px-4 rounded-xl mb-1 ${isSelected ? 'bg-teal' : ''}`}
                    onPress={() => selectTime(item)}
                  >
                    <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
