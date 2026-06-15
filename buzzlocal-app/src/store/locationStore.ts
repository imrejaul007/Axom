import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for location store
export interface Location {
  id?: string;
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface VibeArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  crowdLevel: number;
  mood: string;
}

export interface VibePin {
  id: string;
  type: 'event' | 'offer' | 'place' | 'alert';
  lat: number;
  lng: number;
  data: Record<string, unknown>;
}

interface LocationState {
  currentLocation: Location | null;
  isLoadingLocation: boolean;
  locationPermission: 'granted' | 'denied' | 'undetermined';
  savedLocations: Location[];
  nearbyAreas: VibeArea[];
  nearbyPins: VibePin[];
  selectedArea: VibeArea | null;

  // Actions
  setCurrentLocation: (location: Location | null) => void;
  setLoadingLocation: (loading: boolean) => void;
  setLocationPermission: (permission: 'granted' | 'denied' | 'undetermined') => void;
  setNearbyAreas: (areas: VibeArea[]) => void;
  setNearbyPins: (pins: VibePin[]) => void;
  setSelectedArea: (area: VibeArea | null) => void;
  addSavedLocation: (location: Location) => void;
  removeSavedLocation: (locationId: string) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentLocation: null,
      isLoadingLocation: false,
      locationPermission: 'undetermined',
      savedLocations: [],
      nearbyAreas: [],
      nearbyPins: [],
      selectedArea: null,

      setCurrentLocation: (currentLocation) => set({ currentLocation }),

      setLoadingLocation: (isLoadingLocation) => set({ isLoadingLocation }),

      setLocationPermission: (locationPermission) => set({ locationPermission }),

      setNearbyAreas: (nearbyAreas) => set({ nearbyAreas }),

      setNearbyPins: (nearbyPins) => set({ nearbyPins }),

      setSelectedArea: (selectedArea) => set({ selectedArea }),

      addSavedLocation: (location) =>
        set((state) => ({
          savedLocations: [...state.savedLocations, location],
        })),

      removeSavedLocation: (locationId) =>
        set((state) => ({
          savedLocations: state.savedLocations.filter((l) => l.id === locationId),
        })),
    }),
    {
      name: 'buzzlocal-location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedLocations: state.savedLocations,
        locationPermission: state.locationPermission,
      }),
    }
  )
);
