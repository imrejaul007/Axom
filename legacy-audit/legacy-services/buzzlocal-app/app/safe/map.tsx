/**
 * Safe Zone Map - View safe zones and safety features
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const SAFE_ZONE_TYPES = [
  { type: 'police', icon: 'shield-checkmark', color: '#3B82F6', label: 'Police Stations' },
  { type: 'hospital', icon: 'medkit', color: '#EF4444', label: 'Hospitals' },
  { type: 'fire', icon: 'flame', color: '#F97316', label: 'Fire Stations' },
  { type: 'women_shelter', icon: 'women', color: '#EC4899', label: 'Women Shelters' },
  { type: 'safe_zone', icon: 'checkmark-circle', color: '#10B981', label: 'Safe Zones' },
];

const MOCK_SAFE_ZONES: Array<{id: string; type: string; lat: number; lng: number; name: string; distance: number}> = [
  { id: '1', type: 'police', lat: 12.9716, lng: 77.5946, name: 'Cubbon Park Police Station', distance: 0.5 },
  { id: '2', type: 'hospital', lat: 12.9756, lng: 77.5976, name: 'Manipal Hospital', distance: 0.8 },
  { id: '3', type: 'safe_zone', lat: 12.9696, lng: 77.5916, name: 'MG Road Safe Zone', distance: 0.3 },
  { id: '4', type: 'women_shelter', lat: 12.9786, lng: 77.5996, name: 'Women Safety Center', distance: 1.2 },
  { id: '5', type: 'fire', lat: 12.9636, lng: 77.5876, name: 'Fire Station Brigade Road', distance: 1.5 },
  { id: '6', type: 'safe_zone', lat: 12.9716, lng: 77.6016, name: 'Commercial Street Safe', distance: 0.7 },
];

type SafeZone = typeof MOCK_SAFE_ZONES[0];

export default function SafeZoneMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['safe_zone', 'police', 'hospital']);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getZoneIcon = (type: string) => {
    const zone = SAFE_ZONE_TYPES.find((z) => z.type === type);
    return zone?.icon || 'location';
  };

  const getZoneColor = (type: string) => {
    const zone = SAFE_ZONE_TYPES.find((z) => z.type === type);
    return zone?.color || COLORS.primary;
  };

  const handleZonePress = (zone) => {
    setSelectedZone(zone);
  };

  const handleNavigate = () => {
    if (selectedZone) {
      Alert.alert('Navigation', `Would open maps to: ${selectedZone.name}`);
    }
  };

  const handleCall = () => {
    if (selectedZone) {
      Alert.alert('Call', `Would call: ${selectedZone.name}`);
    }
  };

  const filteredZones = MOCK_SAFE_ZONES.filter((zone) => selectedTypes.includes(zone.type));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Zones</Text>
        <TouchableOpacity onPress={() => router.push('/safe/sos')}>
          <View style={styles.sosButton}>
            <Ionicons name="warning" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SAFE_ZONE_TYPES.map((zone) => (
            <TouchableOpacity
              key={zone.type}
              style={[
                styles.filterChip,
                selectedTypes.includes(zone.type) && { backgroundColor: zone.color },
              ]}
              onPress={() => toggleType(zone.type)}
            >
              <Ionicons
                name={zone.icon as any}
                size={16}
                color={selectedTypes.includes(zone.type) ? '#fff' : zone.color}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedTypes.includes(zone.type) && { color: '#fff' },
                ]}
              >
                {zone.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location?.lat || 12.9716,
            longitude: location?.lng || 77.5946,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {filteredZones.map((zone) => (
            <React.Fragment key={zone.id}>
              <Marker
                coordinate={{ latitude: zone.lat, longitude: zone.lng }}
                onPress={() => handleZonePress(zone)}
              >
                <View style={[styles.marker, { backgroundColor: getZoneColor(zone.type) }]}>
                  <Ionicons name={getZoneIcon(zone.type) as any} size={16} color="#fff" />
                </View>
              </Marker>
              {zone.type === 'safe_zone' && (
                <Circle
                  center={{ latitude: zone.lat, longitude: zone.lng }}
                  radius={100}
                  fillColor={`${getZoneColor(zone.type)}30`}
                  strokeColor={getZoneColor(zone.type)}
                  strokeWidth={2}
                />
              )}
            </React.Fragment>
          ))}
        </MapView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Safe Zone</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Danger Area</Text>
          </View>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Selected Zone Info */}
      {selectedZone && (
        <View style={styles.zoneInfo}>
          <View style={styles.zoneHeader}>
            <View style={[styles.zoneIcon, { backgroundColor: getZoneColor(selectedZone.type) }]}>
              <Ionicons name={getZoneIcon(selectedZone.type) as any} size={20} color="#fff" />
            </View>
            <View style={styles.zoneDetails}>
              <Text style={styles.zoneName}>{selectedZone.name}</Text>
              <Text style={styles.zoneDistance}>{selectedZone.distance} km away</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedZone(null)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.zoneActions}>
            <TouchableOpacity style={styles.zoneAction} onPress={handleNavigate}>
              <Ionicons name="navigate" size={24} color={COLORS.primary} />
              <Text style={styles.zoneActionText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoneAction} onPress={handleCall}>
              <Ionicons name="call" size={24} color={COLORS.success} />
              <Text style={styles.zoneActionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoneAction}
              onPress={() => router.push('/safe/sos')}
            >
              <Ionicons name="warning" size={24} color={COLORS.error} />
              <Text style={styles.zoneActionText}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const ScrollView = require('react-native').ScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  sosButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    gap: 6,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  legend: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  locationButton: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  zoneInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  zoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  zoneDetails: {
    flex: 1,
  },
  zoneName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  zoneDistance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  zoneActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  zoneAction: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  zoneActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
