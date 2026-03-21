import React, { createContext, useContext, useState, useCallback } from 'react';
import { getCurrentCoordinates, reverseGeocode } from '../utils/location';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [areaName, setAreaName] = useState(null); // "Lekki"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  const refreshLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCurrentCoordinates();

      if (!result) {
        setHasPermission(false);
        setError('Location permission denied');
        setLoading(false);
        return null;
      }

      setHasPermission(true);
      setCoords(result);

      // Reverse geocode to get area name
      const name = await reverseGeocode(result.lat, result.lng);
      if (name) setAreaName(name);

      setLoading(false);
      return { ...result, areaName: name };
    } catch (e) {
      setError(e.message || 'Failed to get location');
      setLoading(false);
      return null;
    }
  }, []);

  // Set coordinates manually (e.g. from saved profile or area picker)
  const setManualLocation = useCallback((lat, lng, name) => {
    setCoords({ lat, lng });
    if (name) setAreaName(name);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        areaName,
        loading,
        error,
        hasPermission,
        refreshLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
