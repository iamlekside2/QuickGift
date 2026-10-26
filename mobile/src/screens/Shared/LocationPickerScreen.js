import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, ActivityIndicator, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getCurrentCoordinates, reverseGeocode } from '../../utils/location';

// Default map centre: Lagos, Nigeria
const DEFAULT = { lat: 6.4531, lng: 3.3958 };

function buildHtml(lat, lng) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background:#EDEAE2; }
    /* strip Leaflet's default white box around a divIcon, show only the pin */
    .leaflet-div-icon { background: transparent; border: none; }
    .qg-pin svg { filter: drop-shadow(0 3px 3px rgba(0,0,0,0.3)); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    // Draggable orange pin (brand colour); its tip marks the chosen spot.
    var pinSvg = '<svg width="42" height="42" viewBox="0 0 24 24" fill="#E8632F" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>';
    var icon = L.divIcon({ html: pinSvg, className: 'qg-pin', iconSize: [42, 42], iconAnchor: [21, 40] });
    var marker = L.marker([${lat}, ${lng}], { draggable: true, autoPan: true, icon: icon }).addTo(map);

    function post(type) {
      var p = marker.getLatLng();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, lat: p.lat, lng: p.lng }));
    }
    // Dropping the pin, or tapping the map, sets the location.
    marker.on('dragend', function () { map.panTo(marker.getLatLng()); post('move'); });
    map.on('click', function (e) { marker.setLatLng(e.latlng); post('move'); });

    window.__setView = function (la, ln) { map.setView([la, ln], 16); marker.setLatLng([la, ln]); };
    // ensure the map fills its container after mount (RN WebView layout timing)
    setTimeout(function () { map.invalidateSize(); post('ready'); }, 300);
    setTimeout(function () { map.invalidateSize(); }, 800);
  </script>
</body>
</html>`;
}

export default function LocationPickerScreen({ navigation, route }) {
  const { onPick, initial, title = 'Set location' } = route.params || {};
  const start = initial && initial.lat ? initial : DEFAULT;

  const webRef = useRef(null);
  const geocodeTimer = useRef(null);

  const [center, setCenter] = useState({ lat: start.lat, lng: start.lng });
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  // Reverse-geocode the map centre (debounced) whenever the map settles
  const resolveAddress = useCallback((lat, lng) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    setResolving(true);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const name = await reverseGeocode(lat, lng);
        setAddress(name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } catch (e) {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setResolving(false);
      }
    }, 500);
  }, []);

  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'move' || data.type === 'ready') {
        setCenter({ lat: data.lat, lng: data.lng });
        resolveAddress(data.lat, data.lng);
      }
    } catch (e) { /* ignore */ }
  }, [resolveAddress]);

  const recenter = (lat, lng) => {
    webRef.current?.injectJavaScript(`window.__setView(${lat}, ${lng}); true;`);
  };

  const handleUseGps = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const c = await getCurrentCoordinates();
      if (!c) {
        Alert.alert('Location off', 'Please allow location access to jump to where you are.');
        return;
      }
      recenter(c.lat, c.lng);
    } catch (e) {
      Alert.alert('Location error', 'Could not get your current location.');
    } finally {
      setLocating(false);
    }
  };

  // Free OpenStreetMap address search (Photon) — debounced
  const onChangeQuery = (text) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text || text.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=6&lat=${center.lat}&lon=${center.lng}`,
          { headers: { 'Accept': 'application/json' } }
        );
        const json = await resp.json();
        const items = (json.features || []).map((f) => {
          const p = f.properties || {};
          const [lng, lat] = f.geometry.coordinates;
          const label = [p.name, p.street, p.district, p.city, p.state].filter(Boolean).join(', ');
          return { id: `${lat},${lng}`, label: label || p.name || 'Unknown place', lat, lng };
        });
        setResults(items);
      } catch (e) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const pickResult = (item) => {
    setQuery('');
    setResults([]);
    recenter(item.lat, item.lng);
  };

  const handleConfirm = () => {
    if (typeof onPick === 'function') {
      onPick({ lat: center.lat, lng: center.lng, address });
    }
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header + search */}
      <View
        className="bg-white px-4 pb-3"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 38, zIndex: 20 }}
      >
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-gray-800">{title}</Text>
        </View>

        <View className="flex-row items-center gap-2 bg-gray-100 rounded-2xl px-3.5 h-12">
          <Ionicons name="search" size={18} color="#9A948A" />
          <TextInput
            className="flex-1 text-[14px] text-gray-800"
            placeholder="Search for an address or area"
            placeholderTextColor="#9A948A"
            value={query}
            onChangeText={onChangeQuery}
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color="#1F4A45" />}
        </View>
      </View>

      {/* Search results overlay */}
      {results.length > 0 && (
        <View className="absolute left-0 right-0 bg-white z-10" style={{ top: Platform.OS === 'ios' ? 150 : 132, maxHeight: 260, elevation: 8 }}>
          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50"
                onPress={() => pickResult(item)}
              >
                <Ionicons name="location-outline" size={18} color="#6E6A63" />
                <Text className="flex-1 text-[13px] text-gray-700">{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <View className="flex-1">
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          source={{ html: buildHtml(start.lat, start.lng) }}
          style={{ flex: 1, backgroundColor: '#EDEAE2' }}
        />

        {/* The pin now lives on the map itself (draggable marker). */}

        {/* Use my location */}
        <TouchableOpacity
          onPress={handleUseGps}
          disabled={locating}
          className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white items-center justify-center"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 }}
        >
          {locating ? <ActivityIndicator size="small" color="#1F4A45" /> : <Ionicons name="locate" size={22} color="#1F4A45" />}
        </TouchableOpacity>
      </View>

      {/* Bottom confirm bar */}
      <View
        className="bg-white px-5 pt-4 pb-8"
        style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 8 }}
      >
        <Text className="text-[11px] font-semibold text-gray-400 mb-1">SELECTED LOCATION</Text>
        <View className="flex-row items-center gap-2 mb-4" style={{ minHeight: 22 }}>
          <Ionicons name="location" size={16} color="#E8632F" />
          {resolving ? (
            <Text className="text-[13px] text-gray-400">Finding address…</Text>
          ) : (
            <Text className="flex-1 text-[14px] font-semibold text-gray-800" numberOfLines={2}>
              {address || 'Drag the pin to set the exact spot'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          className="py-4 rounded-2xl items-center bg-teal"
          onPress={handleConfirm}
          style={{ shadowColor: '#1F4A45', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
        >
          <Text className="text-white text-base font-bold">Confirm location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
