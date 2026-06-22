/**
 * Crisis Map - View active crisis zones and resources
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const CRISIS_TYPES = [
  { id: 'flood', label: 'Flood', color: '#3B82F6', icon: 'water' },
  { id: 'fire', label: 'Fire', color: '#EF4444', icon: 'flame' },
  { id: 'earthquake', label: 'Earthquake', color: '#F97316', icon: 'bonfire' },
  { id: 'medical', label: 'Medical', color: '#EC4899', icon: 'medkit' },
  { id: 'accident', label: 'Accident', color: '#FBBF24', icon: 'car' },
  { id: 'evacuation', label: 'Evacuation', color: '#8B5CF6', icon: 'walk' },
];

const MOCK_CRISIS_ZONES = [
  {
    id: '1',
    type: 'flood',
    lat: 12.9350,
    lng: 77.6245,
    title: 'Flood Alert - Low-lying Areas',
    severity: 'high',
    description: 'Water level rising in low-lying areas. Evacuate immediately.',
    resources: ['Rescue boats', 'Medical tents', 'Shelter buses'],
    shelters: [
      { name: 'Community Hall A', capacity: 200, current: 45 },
      { name: 'School Shelter B', capacity: 150, current: 120 },
    ],
  },
  {
    id: '2',
    type: 'fire',
    lat: 12.9580,
    lng: 77.6080,
    title: 'Building Fire - Industrial Area',
    severity: 'critical',
    description: 'Active fire at warehouse. Avoid area. Road closures in effect.',
    resources: ['Fire trucks', 'Ambulances', 'Police'],
    shelters: [],
  },
  {
    id: '3',
    type: 'medical',
    lat: 12.9450,
    lng: 77.6100,
    title: 'Health Emergency - Water Contamination',
    severity: 'medium',
    description: 'Contaminated water supply affecting 3 neighborhoods.',
    resources: ['Water trucks', 'Medical teams', 'Water testing kits'],
    shelters: [],
  },
];

const EVACUATION_ROUTES = [
  {
    id: '1',
    from: { lat: 12.9350, lng: 77.6245 },
    to: { lat: 12.9400, lng: 77.6100 },
    color: '#10B981',
  },
];

export default function CrisisMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['flood', 'fire', 'earthquake', 'medical', 'accident', 'evacuation']);
  const [selectedZone, setSelectedZone] = useState<unknown>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
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

  const getZoneColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F97316';
      case 'medium':
        return '#FBBF24';
      default:
        return '#6B7280';
    }
  };

  const filteredZones = MOCK_CRISIS_ZONES.filter((zone) => selectedTypes.includes(zone.type));

  const handleZonePress = (zone) => {
    setSelectedZone(zone);
    mapRef.current?.animateToRegion({
      latitude: zone.lat,
      longitude: zone.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const handleVolunteer = () => {
    router.push('/crisis/volunteer');
  };

  const handleCheckIn = () => {
    router.push('/crisis/checkin');
  };

  const handleResources = () => {
    router.push('/crisis/resources');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading crisis map...</Text>
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
        <Text style={styles.headerTitle}>Crisis Map</Text>
        <View style={styles.alertBadge}>
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.alertCount}>{MOCK_CRISIS_ZONES.length}</Text>
        </View>
      </View>

      {/* Crisis Type Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CRISIS_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterChip,
                !selectedTypes.includes(type.id) && styles.filterChipInactive,
              ]}
              onPress={() => toggleType(type.id)}
            >
              <Ionicons
                name={type.icon as any}
                size={14}
                color={selectedTypes.includes(type.id) ? '#fff' : type.color}
              />
              <Text
                style={[
                  styles.filterChipText,
                  !selectedTypes.includes(type.id) && { color: type.color },
                ]}
              >
                {type.label}
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
            latitude: location?.lat || 12.9450,
            longitude: location?.lng || 77.6100,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {filteredZones.map((zone) => {
            const typeInfo = CRISIS_TYPES.find((t) => t.id === zone.type);
            return (
              <React.Fragment key={zone.id}>
                <Marker
                  coordinate={{ latitude: zone.lat, longitude: zone.lng }}
                  onPress={() => handleZonePress(zone)}
                >
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: typeInfo?.color || COLORS.error },
                    ]}
                  >
                    <Ionicons name={typeInfo?.icon as any} size={18} color="#fff" />
                  </View>
                </Marker>
                <Circle
                  center={{ latitude: zone.lat, longitude: zone.lng }}
                  radius={500}
                  fillColor={`${typeInfo?.color || COLORS.error}20`}
                  strokeColor={typeInfo?.color || COLORS.error}
                  strokeWidth={2}
                />
              </React.Fragment>
            );
          })}

          {showRoutes &&
            EVACUATION_ROUTES.map((route) => (
              <Polyline
                key={route.id}
                coordinates={[
                  { latitude: route.from.lat, longitude: route.from.lng },
                  { latitude: route.to.lat, longitude: route.to.lng },
                ]}
                strokeColor={route.color}
                strokeWidth={4}
                lineDashPattern={[10, 5]}
              />
            ))}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControl} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapControl, showRoutes && styles.mapControlActive]}
            onPress={() => setShowRoutes(!showRoutes)}
          >
            <Ionicons name="navigate" size={22} color={showRoutes ? '#fff' : COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981', borderStyle: 'dashed' }]} />
            <Text style={styles.legendText}>Evacuation Route</Text>
          </View>
        </View>
      </View>

      {/* Selected Zone Info */}
      {selectedZone && (
        <View style={styles.zoneInfo}>
          <View style={styles.zoneHeader}>
            <View
              style={[
                styles.zoneSeverity,
                { backgroundColor: getZoneColor((selectedZone as any).severity) },
              ]}
            >
              <Text style={styles.zoneSeverityText}>
                {(selectedZone as any).severity.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedZone(null)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.zoneTitle}>{(selectedZone as any).title}</Text>
          <Text style={styles.zoneDescription}>{(selectedZone as any).description}</Text>

          {(selectedZone as any).shelters?.length > 0 && (
            <View style={styles.sheltersSection}>
              <Text style={styles.sheltersTitle}>Nearby Shelters</Text>
              {((selectedZone as any).shelters || []).map((shelter: any, index: number) => (
                <View key={index} style={styles.shelterRow}>
                  <Ionicons name="bed" size={16} color={COLORS.success} />
                  <Text style={styles.shelterName}>{shelter.name}</Text>
                  <Text style={styles.shelterCapacity}>
                    {shelter.current}/{shelter.capacity}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.zoneActions}>
            <TouchableOpacity style={styles.zoneAction} onPress={handleCheckIn}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.zoneActionText}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoneAction} onPress={handleVolunteer}>
              <Ionicons name="hand-left" size={24} color={COLORS.primary} />
              <Text style={styles.zoneActionText}>Volunteer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoneAction} onPress={handleResources}>
              <Ionicons name="cube" size={24} color={COLORS.warning} />
              <Text style={styles.zoneActionText}>Resources</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

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
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  alertCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    gap: 4,
  },
  filterChipInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
  },
  mapControls: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    gap: SPACING.sm,
  },
  mapControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  mapControlActive: {
    backgroundColor: COLORS.primary,
  },
  legend: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  legendRow: {
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
  zoneInfo: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '40%',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  zoneSeverity: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  zoneSeverityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#fff',
  },
  zoneTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  zoneDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sheltersSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sheltersTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  shelterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: 2,
  },
  shelterName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  shelterCapacity: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  zoneActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  zoneAction: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  zoneActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
