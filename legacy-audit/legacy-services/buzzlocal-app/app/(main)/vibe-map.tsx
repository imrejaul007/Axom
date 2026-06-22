import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useLocationStore } from '@/store';

const { width, height } = Dimensions.get('window');

const MAP_LAYERS = [
  { id: 'all', label: 'All', icon: 'layers', color: COLORS.primary },
  { id: 'crowd', label: 'Crowd', icon: 'people', color: COLORS.heatmapHigh },
  { id: 'safety', label: 'Safety', icon: 'shield-checkmark', color: COLORS.success },
  { id: 'offers', label: 'Offers', icon: 'pricetag', color: COLORS.warning },
  { id: 'events', label: 'Events', icon: 'calendar', color: COLORS.accent },
  { id: 'emergency', label: 'Emergency', icon: 'alert-circle', color: COLORS.error },
  { id: 'transport', label: 'Transit', icon: 'train', color: COLORS.primary },
];

const OVERLAY_DATA = {
  safety: [
    { id: 's1', name: 'Safe Zone', latitude: 12.9352, longitude: 77.6245, type: 'safe_zone' as const, rating: 4.5 },
    { id: 's2', name: 'Safety Patrol', latitude: 12.9360, longitude: 77.6250, type: 'patrol' as const, rating: 4.8 },
  ],
  offers: [
    { id: 'o1', name: '50% Off Pizza', merchant: 'Domino\'s', latitude: 12.9355, longitude: 77.6230, type: 'deal' as const, discount: '50%' },
    { id: 'o2', name: 'Free Coffee', merchant: 'Starbucks', latitude: 12.9370, longitude: 77.6260, type: 'free' as const, discount: '100%' },
    { id: 'o3', name: 'Buy 1 Get 1', merchant: 'KFC', latitude: 12.9340, longitude: 77.6240, type: 'bogo' as const, discount: '50%' },
  ],
  events: [
    { id: 'e1', name: 'Food Festival', venue: 'Forum Mall', latitude: 12.9350, longitude: 77.6100, type: 'festival' as const, attendees: 500 },
    { id: 'e2', name: 'Live Music', venue: 'UB City', latitude: 12.9716, longitude: 77.5950, type: 'music' as const, attendees: 200 },
    { id: 'e3', name: 'Art Exhibition', venue: 'MG Road', latitude: 12.9759, longitude: 77.6056, type: 'exhibition' as const, attendees: 150 },
  ],
  emergency: [
    { id: 'em1', name: 'Police Station', latitude: 12.9355, longitude: 77.6200, type: 'police' as const, distance: '0.5 km' },
    { id: 'em2', name: 'Hospital', latitude: 12.9380, longitude: 77.6300, type: 'hospital' as const, distance: '1.2 km' },
    { id: 'em3', name: 'Fire Station', latitude: 12.9320, longitude: 77.6180, type: 'fire' as const, distance: '0.8 km' },
  ],
  transport: [
    { id: 't1', name: 'Metro Station', latitude: 12.9358, longitude: 77.6220, type: 'metro' as const, eta: '3 min' },
    { id: 't2', name: 'Bus Stop', latitude: 12.9365, longitude: 77.6255, type: 'bus' as const, eta: '2 min' },
    { id: 't3', name: 'Auto Stand', latitude: 12.9372, longitude: 77.6270, type: 'auto' as const, eta: '5 min' },
  ],
};

const MOCK_AREAS = [
  { id: '1', name: 'Koramangala', latitude: 12.9352, longitude: 77.6245, mood: 'busy' as const, crowdLevel: 4, trending: true, users: 127 },
  { id: '2', name: 'Indiranagar', latitude: 12.9716, longitude: 77.6403, mood: 'party' as const, crowdLevel: 5, trending: true, users: 89 },
  { id: '3', name: 'MG Road', latitude: 12.9759, longitude: 77.6056, mood: 'chill' as const, crowdLevel: 2, trending: false, users: 45 },
  { id: '4', name: 'HSR Layout', latitude: 12.9116, longitude: 77.6510, mood: 'family' as const, crowdLevel: 3, trending: false, users: 67 },
];

export default function VibeMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { currentLocation, setCurrentLocation, locationPermission } = useLocationStore();
  const [activeLayer, setActiveLayer] = useState('all');
  const [selectedArea, setSelectedArea] = useState<typeof MOCK_AREAS[0] | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<unknown>(null);
  const [showOverlayPanel, setShowOverlayPanel] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'party': return '🔥';
      case 'busy': return '💃';
      case 'chill': return '😌';
      case 'family': return '👨‍👩‍👧';
      default: return '📍';
    }
  };

  const getOverlayIcon = (type: string) => {
    switch (type) {
      case 'safe_zone': return 'shield-checkmark';
      case 'patrol': return 'shield';
      case 'deal': return 'pricetag';
      case 'free': return 'gift';
      case 'bogo': return 'cart';
      case 'festival': return 'musical-notes';
      case 'music': return 'musical-note';
      case 'exhibition': return 'image';
      case 'police': return 'shield';
      case 'hospital': return 'medkit';
      case 'fire': return 'flame';
      case 'metro': return 'train';
      case 'bus': return 'bus';
      case 'auto': return 'car';
      default: return 'location';
    }
  };

  const getOverlayColor = (type: string, layer: string) => {
    if (layer === 'safety') return COLORS.success;
    if (layer === 'offers') return COLORS.warning;
    if (layer === 'emergency') return COLORS.error;
    if (layer === 'transport') return COLORS.primary;
    if (layer === 'events') return COLORS.accent;
    return COLORS.textSecondary;
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'party': return COLORS.accent;
      case 'busy': return COLORS.warning;
      case 'chill': return COLORS.success;
      case 'family': return COLORS.info;
      default: return COLORS.textMuted;
    }
  };

  const getHeatmapColor = (crowdLevel: number) => {
    if (crowdLevel <= 2) return COLORS.heatmapLow;
    if (crowdLevel <= 3) return COLORS.heatmapMedium;
    return COLORS.heatmapHigh;
  };

  const handleMarkerPress = (area: typeof MOCK_AREAS[0]) => {
    setSelectedArea(area);
    mapRef.current?.animateToRegion({
      latitude: area.latitude,
      longitude: area.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  };

  const defaultRegion = {
    latitude: currentLocation?.lat || 12.9716,
    longitude: currentLocation?.lng || 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vibe Map</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={defaultRegion}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={darkMapStyle}
        >
          {/* Area Heatmap Circles */}
          {activeLayer === 'crowd' && MOCK_AREAS.map((area) => (
            <Circle
              key={`circle-${area.id}`}
              center={{ latitude: area.latitude, longitude: area.longitude }}
              radius={1000}
              fillColor={getHeatmapColor(area.crowdLevel) + '30'}
              strokeColor={getHeatmapColor(area.crowdLevel) + '60'}
              strokeWidth={2}
            />
          ))}

          {/* Safety Overlays */}
          {(activeLayer === 'all' || activeLayer === 'safety') && OVERLAY_DATA.safety.map((item) => (
            <Marker
              key={`safety-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => {
                setSelectedOverlay(item);
                setShowOverlayPanel(true);
              }}
            >
              <View style={styles.overlayMarker}>
                <View style={[styles.overlayIconContainer, { backgroundColor: getOverlayColor(item.type, 'safety') + '30' }]}>
                  <Ionicons name={getOverlayIcon(item.type) as any} size={14} color={getOverlayColor(item.type, 'safety')} />
                </View>
              </View>
            </Marker>
          ))}

          {/* Offers Overlays */}
          {(activeLayer === 'all' || activeLayer === 'offers') && OVERLAY_DATA.offers.map((item) => (
            <Marker
              key={`offer-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => {
                setSelectedOverlay(item);
                setShowOverlayPanel(true);
              }}
            >
              <View style={styles.overlayMarker}>
                <View style={[styles.overlayIconContainer, { backgroundColor: getOverlayColor(item.type, 'offers') + '30' }]}>
                  <Ionicons name={getOverlayIcon(item.type) as any} size={14} color={getOverlayColor(item.type, 'offers')} />
                </View>
              </View>
            </Marker>
          ))}

          {/* Events Overlays */}
          {(activeLayer === 'all' || activeLayer === 'events') && OVERLAY_DATA.events.map((item) => (
            <Marker
              key={`event-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => {
                setSelectedOverlay(item);
                setShowOverlayPanel(true);
              }}
            >
              <View style={styles.overlayMarker}>
                <View style={[styles.overlayIconContainer, { backgroundColor: getOverlayColor(item.type, 'events') + '30' }]}>
                  <Ionicons name={getOverlayIcon(item.type) as any} size={14} color={getOverlayColor(item.type, 'events')} />
                </View>
              </View>
            </Marker>
          ))}

          {/* Emergency Overlays */}
          {(activeLayer === 'all' || activeLayer === 'emergency') && OVERLAY_DATA.emergency.map((item) => (
            <Marker
              key={`emergency-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => {
                setSelectedOverlay(item);
                setShowOverlayPanel(true);
              }}
            >
              <View style={styles.overlayMarker}>
                <View style={[styles.overlayIconContainer, { backgroundColor: getOverlayColor(item.type, 'emergency') + '30' }]}>
                  <Ionicons name={getOverlayIcon(item.type) as any} size={14} color={getOverlayColor(item.type, 'emergency')} />
                </View>
              </View>
            </Marker>
          ))}

          {/* Transport Overlays */}
          {(activeLayer === 'all' || activeLayer === 'transport') && OVERLAY_DATA.transport.map((item) => (
            <Marker
              key={`transport-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => {
                setSelectedOverlay(item);
                setShowOverlayPanel(true);
              }}
            >
              <View style={styles.overlayMarker}>
                <View style={[styles.overlayIconContainer, { backgroundColor: getOverlayColor(item.type, 'transport') + '30' }]}>
                  <Ionicons name={getOverlayIcon(item.type) as any} size={14} color={getOverlayColor(item.type, 'transport')} />
                </View>
              </View>
            </Marker>
          ))}

          {/* Area Markers */}
          {activeLayer === 'crowd' && MOCK_AREAS.map((area) => (
            <Marker
              key={area.id}
              coordinate={{ latitude: area.latitude, longitude: area.longitude }}
              onPress={() => handleMarkerPress(area)}
              tracksViewChanges={false}
            >
              <View style={[
                styles.markerContainer,
                selectedArea?.id === area.id && styles.markerSelected,
              ]}>
                <View style={[
                  styles.markerDot,
                  { backgroundColor: getMoodColor(area.mood) },
                ]}>
                  <Text style={styles.markerEmoji}>{getMoodEmoji(area.mood)}</Text>
                </View>
                {area.trending && (
                  <View style={styles.trendingBadge}>
                    <Ionicons name="flash" size={8} color={COLORS.text} />
                  </View>
                )}
              </View>
            </Marker>
          ))}
        </MapView>

        {/* AI Mood Card Overlay */}
        <View style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <View style={styles.moodIconContainer}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.moodTitle}>AI Insight</Text>
          </View>
          <Text style={styles.moodDescription}>
            {selectedArea ? (
              <>
                <Text style={{ color: getMoodColor(selectedArea.mood), fontWeight: '600' }}>
                  {selectedArea.name}
                </Text>
                {' is '}{selectedArea.mood}{' with '}
                <Text style={{ fontWeight: '600' }}>{selectedArea.users}</Text> people nearby.
              </>
            ) : (
              'Tap a marker to see area insights'
            )}
          </Text>
          {selectedArea && (
            <View style={styles.moodActions}>
              <TouchableOpacity style={styles.moodAction}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.moodActionText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moodAction}>
                <Ionicons name="qr-code" size={14} color={COLORS.primary} />
                <Text style={styles.moodActionText}>Check In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Layer Toggle */}
        <View style={styles.layerToggle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MAP_LAYERS.map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  activeLayer === layer.id && { backgroundColor: layer.color + '30', borderColor: layer.color },
                ]}
                onPress={() => setActiveLayer(layer.id)}
              >
                <Ionicons
                  name={layer.icon as any}
                  size={16}
                  color={activeLayer === layer.id ? layer.color : COLORS.textMuted}
                />
                <Text style={[
                  styles.layerLabel,
                  activeLayer === layer.id && { color: layer.color },
                ]}>
                  {layer.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => {
            if (currentLocation) {
              mapRef.current?.animateToRegion({
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 500);
            }
          }}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Overlay Detail Panel */}
        {showOverlayPanel && selectedOverlay && (
          <View style={styles.overlayPanel}>
            <TouchableOpacity
              style={styles.closeOverlayButton}
              onPress={() => {
                setShowOverlayPanel(false);
                setSelectedOverlay(null);
              }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.overlayPanelHeader}>
              <View style={[styles.overlayPanelIcon, { backgroundColor: getOverlayColor((selectedOverlay as any).type, activeLayer) + '20' }]}>
                <Ionicons name={getOverlayIcon((selectedOverlay as any).type) as any} size={24} color={getOverlayColor((selectedOverlay as any).type, activeLayer)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.overlayPanelTitle}>{(selectedOverlay as any).name}</Text>
                {'merchant' in (selectedOverlay as any) && (
                  <Text style={styles.overlayPanelSubtitle}>{(selectedOverlay as any).merchant}</Text>
                )}
                {'venue' in (selectedOverlay as any) && (
                  <Text style={styles.overlayPanelSubtitle}>{(selectedOverlay as any).venue}</Text>
                )}
              </View>
            </View>

            <View style={styles.overlayPanelMeta}>
              {'rating' in (selectedOverlay as any) && (
                <View style={styles.overlayMetaBadge}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={styles.overlayMetaText}>{(selectedOverlay as any).rating}</Text>
                </View>
              )}
              {'discount' in (selectedOverlay as any) && (
                <View style={[styles.overlayMetaBadge, { backgroundColor: COLORS.successLight }]}>
                  <Text style={[styles.overlayMetaText, { color: COLORS.success, fontWeight: '600' }]}>
                    {(selectedOverlay as any).discount} OFF
                  </Text>
                </View>
              )}
              {'attendees' in (selectedOverlay as any) && (
                <View style={styles.overlayMetaBadge}>
                  <Ionicons name="people" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.overlayMetaText}>{(selectedOverlay as any).attendees} attending</Text>
                </View>
              )}
              {'distance' in (selectedOverlay as any) && (
                <View style={styles.overlayMetaBadge}>
                  <Ionicons name="navigate" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.overlayMetaText}>{(selectedOverlay as any).distance}</Text>
                </View>
              )}
              {'eta' in (selectedOverlay as any) && (
                <View style={styles.overlayMetaBadge}>
                  <Ionicons name="time" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.overlayMetaText}>{(selectedOverlay as any).eta} away</Text>
                </View>
              )}
            </View>

            <View style={styles.overlayPanelActions}>
              <TouchableOpacity style={[styles.overlayActionButton, styles.overlayActionPrimary]}>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={[styles.overlayActionText, styles.overlayActionTextPrimary]}>Navigate</Text>
              </TouchableOpacity>
              {'discount' in (selectedOverlay as any) && (
                <TouchableOpacity style={[styles.overlayActionButton, styles.overlayActionSecondary]}>
                  <Ionicons name="qr-code" size={18} color={COLORS.primary} />
                  <Text style={[styles.overlayActionText, styles.overlayActionTextSecondary]}>Claim</Text>
                </TouchableOpacity>
              )}
              {activeLayer === 'emergency' && (
                <TouchableOpacity style={[styles.overlayActionButton, { backgroundColor: COLORS.error }]}>
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={[styles.overlayActionText, styles.overlayActionTextPrimary]}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Area List */}
      <View style={styles.areaList}>
        <Text style={styles.areaListTitle}>Nearby Areas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOCK_AREAS.map((area) => (
            <TouchableOpacity
              key={area.id}
              style={[
                styles.areaCard,
                selectedArea?.id === area.id && styles.areaCardSelected,
              ]}
              onPress={() => handleMarkerPress(area)}
            >
              <View style={[styles.areaMoodBadge, { backgroundColor: getMoodColor(area.mood) + '20' }]}>
                <Text style={styles.areaMoodEmoji}>{getMoodEmoji(area.mood)}</Text>
              </View>
              <Text style={styles.areaName}>{area.name}</Text>
              <View style={styles.areaMeta}>
                <Text style={styles.areaUsers}>{area.users} active</Text>
                {area.trending && (
                  <View style={styles.trendingTag}>
                    <Ionicons name="trending-up" size={10} color={COLORS.accent} />
                  </View>
                )}
              </View>
              <View style={styles.crowdDots}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.crowdDot,
                      { backgroundColor: level <= area.crowdLevel ? getMoodColor(area.mood) : COLORS.surfaceLight },
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d4a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f1a' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterButton: {
    padding: SPACING.xs,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  markerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  markerEmoji: {
    fontSize: 16,
  },
  trendingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCard: {
    position: 'absolute',
    bottom: 60,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  moodIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  moodTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  moodDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  moodActions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  moodAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  moodActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  layerToggle: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  layerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  recenterButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface + 'F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  areaList: {
    paddingVertical: SPACING.md,
  },
  areaListTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  areaCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginLeft: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  areaCardSelected: {
    borderColor: COLORS.primary,
  },
  areaMoodBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  areaMoodEmoji: {
    fontSize: 18,
  },
  areaName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  areaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  areaUsers: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  trendingTag: {
    marginLeft: 4,
  },
  crowdDots: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  crowdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  overlayMarker: {
    alignItems: 'center',
  },
  overlayIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  overlayPanel: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overlayPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  overlayPanelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  overlayPanelTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  overlayPanelSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  overlayPanelMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  overlayMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  overlayMetaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  overlayPanelActions: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  overlayActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  overlayActionPrimary: {
    backgroundColor: COLORS.primary,
  },
  overlayActionSecondary: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overlayActionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  overlayActionTextPrimary: {
    color: '#fff',
  },
  overlayActionTextSecondary: {
    color: COLORS.text,
  },
  closeOverlayButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  },
  unifiedToggle: {
    position: 'absolute',
    top: 56,
    left: SPACING.md,
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    flexDirection: 'row',
    gap: 2,
  },
  unifiedToggleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  unifiedToggleText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  unifiedToggleTextActive: {
    color: '#fff',
  },
});
