import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { weatherService, WeatherAlert, WeatherInsight } from '@/services/weather';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const MOCK_WEATHER = {
  temperature: 28,
  feelsLike: 31,
  condition: 'Partly Cloudy',
  conditionIcon: 'partly-sunny',
  humidity: 65,
  windSpeed: 12,
  uvIndex: 6,
  visibility: 10,
  aqi: 45,
  sunrise: '6:02 AM',
  sunset: '6:45 PM',
};

const MOCK_ALERTS: WeatherAlert[] = [
  {
    id: '1',
    sender: 'Weather Service',
    event: 'Heavy Rain Warning',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    description: 'Heavy rainfall expected between 4-8 PM. Possible waterlogging in low-lying areas.',
    severity: 'warning',
  },
];

const MOCK_INSIGHTS: WeatherInsight[] = [
  {
    type: 'outdoor',
    icon: 'walk',
    title: 'Great for Outdoors',
    description: 'Great weather for outdoor activities!',
    score: 85,
    message: 'Perfect conditions for outdoor fun',
    suggestions: ['Go for a walk', 'Visit a park', 'Outdoor sports'],
  },
  {
    type: 'dining',
    icon: 'restaurant',
    title: 'Dining Trends',
    description: 'People prefer cold drinks today',
    score: 70,
    message: 'Ice cream and cold beverages are trending',
    suggestions: ['Ice cream shops', 'Cold beverages', 'AC restaurants'],
  },
];

const MOCK_SUGGESTIONS = [
  '☀️ Beautiful day in Koramangala! What\'s everyone up to?',
  '🔥 It\'s 28°C! Best cold drinks spots nearby?',
  '🌧️ Rain expected later - indoor activity ideas?',
];

const getWeatherIcon = (icon: string): string => {
  const iconMap: Record<string, string> = {
    'sunny': 'sunny',
    'partly-sunny': 'partly-sunny',
    'cloudy': 'cloudy',
    'rainy': 'rainy',
    'thunderstorm': 'thunderstorm',
    'snow': 'snow',
  };
  return iconMap[icon] || 'sunny';
};

const getWeatherColor = (condition: string): [string, string] => {
  const colorMap: Record<string, [string, string]> = {
    'Sunny': ['#FFB300', '#FF8F00'],
    'Partly Cloudy': ['#64B5F6', '#1976D2'],
    'Cloudy': ['#90A4AE', '#546E7A'],
    'Rainy': ['#78909C', '#455A64'],
    'Thunderstorms': ['#546E7A', '#37474F'],
    'Clear': ['#4FC3F7', '#0288D1'],
    'default': ['#64B5F6', '#1976D2'],
  };
  return colorMap[condition] ?? colorMap['default'] ?? ['#64B5F6', '#1976D2'];
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'emergency': return '#EF4444';
    case 'warning': return '#F59E0B';
    case 'watch': return '#3B82F6';
    default: return '#6B7280';
  }
};

export default function WeatherScreen() {
  const router = useRouter();
  const [weather, setWeather] = useState(MOCK_WEATHER);
  const [location, setLocation] = useState('Koramangala, Bangalore');
  const [coordinates, setCoordinates] = useState({ lat: 12.9352, lng: 77.6245 });
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<WeatherAlert[]>(MOCK_ALERTS);
  const [insights, setInsights] = useState<WeatherInsight[]>(MOCK_INSIGHTS);
  const [suggestions, setSuggestions] = useState<string[]>(MOCK_SUGGESTIONS);

  const gradientColors = getWeatherColor(weather.condition);

  const loadWeather = useCallback(async () => {
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };
        setCoordinates(coords);

        // Get weather
        const weatherData = await weatherService.getCurrentWeather(coords.lat, coords.lng);
        setWeather({
          temperature: weatherData.temperature,
          feelsLike: weatherData.feelsLike,
          condition: weatherData.conditionMain || weatherData.condition,
          conditionIcon: getWeatherIcon(weatherService.getIconName(weatherData.conditionIcon)),
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          uvIndex: 6,
          visibility: weatherData.visibility,
          aqi: 45,
          sunrise: weatherData.sunrise,
          sunset: weatherData.sunset,
        });

        // Get alerts
        const weatherAlerts = await weatherService.getAlerts(coords.lat, coords.lng);
        setAlerts(weatherAlerts);

        // Get insights
        const intelData = await weatherService.getWeatherIntelligence(coords.lat, coords.lng);
        if (intelData.insights.length > 0) {
          setInsights(intelData.insights);
        }

        // Get post suggestions
        const postSuggestions = await weatherService.getPostSuggestions(weatherData, weatherData.city || 'your area');
        setSuggestions(postSuggestions);
      }
    } catch (error) {
      console.error('Failed to load weather:', error);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  }, [loadWeather]);

  const handleShareWeather = async () => {
    try {
      await Share.share({
        title: 'Check the weather in ' + location,
        message: `Current weather in ${location}:\n\n${weather.temperature}°C, ${weather.condition}\n\nShared via BuzzLocal`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCreatePost = (suggestion: string) => {
    router.push({
      pathname: '/create',
      params: { suggestion },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.locationText}>{location}</Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareWeather}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            {/* Alerts */}
            {alerts.length > 0 && (
              <View style={styles.alertsContainer}>
                {alerts.map((alert) => (
                  <TouchableOpacity
                    key={alert.id}
                    style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.severity) }]}
                  >
                    <Ionicons
                      name={alert.severity === 'emergency' ? 'warning' : 'alert-circle'}
                      size={20}
                      color={getSeverityColor(alert.severity)}
                    />
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>{alert.event}</Text>
                      <Text style={styles.alertDescription}>{alert.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Main Temperature */}
            <View style={styles.mainTemp}>
              <Text style={styles.temperature}>{weather.temperature}°</Text>
              <Text style={styles.condition}>{weather.condition}</Text>
              <Text style={styles.feelsLike}>Feels like {weather.feelsLike}°</Text>
            </View>

            {/* Weather Insights */}
            {insights.length > 0 && (
              <View style={styles.insightsContainer}>
                {insights.map((insight, index) => (
                  <View key={index} style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <Ionicons
                        name={
                          insight.type === 'outdoor' ? 'walk' :
                          insight.type === 'dining' ? 'restaurant' :
                          insight.type === 'traffic' ? 'car' :
                          insight.type === 'events' ? 'calendar' : 'sunny'
                        }
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.insightScore}>{insight.score || 100}%</Text>
                    </View>
                    <Text style={styles.insightMessage}>{insight.message || insight.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Post Suggestions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Create a Post</Text>
                <TouchableOpacity onPress={() => router.push('/create')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => handleCreatePost(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    <View style={styles.createButton}>
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                      <Text style={styles.createButtonText}>Create</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Hourly Forecast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hourly Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {MOCK_WEATHER && [
                  { time: 'Now', temp: weather.temperature, icon: weather.conditionIcon, precipitation: 10 },
                  { time: '2PM', temp: weather.temperature + 1, icon: 'sunny', precipitation: 5 },
                  { time: '3PM', temp: weather.temperature + 2, icon: 'sunny', precipitation: 0 },
                  { time: '4PM', temp: weather.temperature + 1, icon: 'partly-sunny', precipitation: 20 },
                  { time: '5PM', temp: weather.temperature, icon: 'cloudy', precipitation: 40 },
                  { time: '6PM', temp: weather.temperature - 1, icon: 'rainy', precipitation: 70 },
                ].map((hour, index) => (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>{hour.time}</Text>
                    <Ionicons name={getWeatherIcon(hour.icon) as any} size={24} color="#fff" />
                    <Text style={styles.hourlyTemp}>{hour.temp}°</Text>
                    <View style={styles.precipContainer}>
                      <Ionicons name="water" size={12} color="#90CAF9" />
                      <Text style={styles.precipText}>{hour.precipitation}%</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 7-Day Forecast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7-Day Forecast</Text>
              <View style={styles.dailyList}>
                {[
                  { day: 'Today', high: weather.temperature + 2, low: weather.temperature - 4, icon: weather.conditionIcon, precip: 10 },
                  { day: 'Tomorrow', high: weather.temperature + 3, low: weather.temperature - 3, icon: 'sunny', precip: 5 },
                  { day: 'Wednesday', high: weather.temperature - 1, low: weather.temperature - 5, icon: 'rainy', precip: 80 },
                  { day: 'Thursday', high: weather.temperature - 2, low: weather.temperature - 6, icon: 'rainy', precip: 60 },
                  { day: 'Friday', high: weather.temperature + 1, low: weather.temperature - 4, icon: 'cloudy', precip: 30 },
                  { day: 'Saturday', high: weather.temperature + 2, low: weather.temperature - 3, icon: 'partly-sunny', precip: 15 },
                  { day: 'Sunday', high: weather.temperature + 3, low: weather.temperature - 2, icon: 'sunny', precip: 5 },
                ].map((day, index) => (
                  <View key={index} style={styles.dailyItem}>
                    <Text style={styles.dailyDay}>{day.day}</Text>
                    <Ionicons name={getWeatherIcon(day.icon) as any} size={20} color="#fff" />
                    <View style={styles.precipContainer}>
                      <Ionicons name="water" size={12} color="#90CAF9" />
                      <Text style={styles.precipText}>{day.precip}%</Text>
                    </View>
                    <Text style={styles.dailyHigh}>{day.high}°</Text>
                    <Text style={styles.dailyLow}>{day.low}°</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Weather Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="water" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>Humidity</Text>
                <Text style={styles.statValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flag" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>Wind</Text>
                <Text style={styles.statValue}>{weather.windSpeed} km/h</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="sunny" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>UV Index</Text>
                <Text style={styles.statValue}>{weather.uvIndex}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="eye" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>Visibility</Text>
                <Text style={styles.statValue}>{weather.visibility} km</Text>
              </View>
            </View>

            {/* Air Quality */}
            <View style={styles.aqiCard}>
              <View style={styles.aqiHeader}>
                <Text style={styles.aqiTitle}>Air Quality Index</Text>
                <View style={styles.aqiBadge}>
                  <Text style={styles.aqiBadgeText}>
                    {weather.aqi <= 50 ? 'Good' : weather.aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                  </Text>
                </View>
              </View>
              <View style={styles.aqiBar}>
                <View style={[styles.aqiFill, { width: `${(weather.aqi / 200) * 100}%` }]} />
              </View>
              <View style={styles.aqiLabels}>
                <Text style={styles.aqiLabel}>0</Text>
                <Text style={styles.aqiLabel}>50</Text>
                <Text style={styles.aqiLabel}>100</Text>
                <Text style={styles.aqiLabel}>150</Text>
                <Text style={styles.aqiLabel}>200</Text>
              </View>
            </View>

            {/* Sun Times */}
            <View style={styles.sunCard}>
              <View style={styles.sunItem}>
                <Ionicons name="sunny" size={28} color="#FFD54F" />
                <View style={styles.sunInfo}>
                  <Text style={styles.sunLabel}>Sunrise</Text>
                  <Text style={styles.sunTime}>{weather.sunrise}</Text>
                </View>
              </View>
              <View style={styles.sunDivider} />
              <View style={styles.sunItem}>
                <Ionicons name="moon" size={28} color="#90CAF9" />
                <View style={styles.sunInfo}>
                  <Text style={styles.sunLabel}>Sunset</Text>
                  <Text style={styles.sunTime}>{weather.sunset}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  locationText: {
    color: '#fff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginHorizontal: SPACING.xs,
  },
  alertsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
  },
  alertContent: { flex: 1, marginLeft: SPACING.sm },
  alertTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#fff' },
  alertDescription: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  mainTemp: { alignItems: 'center', paddingVertical: SPACING.lg },
  temperature: { fontSize: 96, fontWeight: '200', color: '#fff' },
  condition: { fontSize: FONT_SIZE.xl, fontWeight: '500', color: '#fff' },
  feelsLike: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.xs },
  insightsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  insightCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightScore: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: '#fff',
  },
  insightMessage: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: '#fff' },
  seeAll: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.7)' },
  suggestionCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    width: 200,
  },
  suggestionText: { fontSize: FONT_SIZE.sm, color: '#fff', lineHeight: 20 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  createButtonText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginLeft: 4 },
  hourlyItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    minWidth: 50,
  },
  hourlyTime: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' },
  hourlyIcon: { marginVertical: SPACING.xs },
  hourlyTemp: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#fff' },
  precipContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  precipText: { fontSize: FONT_SIZE.xs, color: '#90CAF9', marginLeft: 2 },
  dailyList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  dailyDay: { flex: 1, fontSize: FONT_SIZE.md, color: '#fff', fontWeight: '500' },
  dailyHigh: { fontSize: FONT_SIZE.md, color: '#fff', fontWeight: '600', width: 35, textAlign: 'right' },
  dailyLow: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.6)', width: 35, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  statCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  statLabel: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.7)', marginTop: SPACING.xs },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: '#fff', marginTop: 2 },
  aqiCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  aqiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  aqiTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#fff' },
  aqiBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  aqiBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: '#fff' },
  aqiBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  aqiFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  aqiLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  aqiLabel: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.5)' },
  sunCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  sunItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sunInfo: { marginLeft: SPACING.sm },
  sunLabel: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.7)' },
  sunTime: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#fff' },
  sunDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: SPACING.md },
  bottomPadding: { height: 100 },
});
