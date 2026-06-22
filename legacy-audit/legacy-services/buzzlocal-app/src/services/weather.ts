import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
const MIND_SERVICE_URL = process.env.EXPO_PUBLIC_MIND_URL || 'https://rez-mind.onrender.com';

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  condition: string;
  conditionIcon: string;
  conditionMain: string;
  sunrise: string;
  sunset: string;
  city: string;
  country: string;
  timestamp: number;
  rain?: { '1h'?: number };
}

export interface HourlyForecast {
  time: string;
  temp: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

export interface DailyForecast {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  precipitation: number;
  humidity: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherAlert {
  id: string;
  sender: string;
  event: string;
  start: string;
  end: string;
  description: string;
  severity: 'watch' | 'warning' | 'emergency';
}

export interface AirQuality {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}

export interface WeatherInsight {
  type: 'traffic' | 'outdoor' | 'shopping' | 'dining' | 'events';
  score: number; // 0-100
  message: string;
  suggestions: string[];
}

class WeatherService {
  private cache: Map<string, { data; timestamp: number }> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private lastIntelligenceUpdate = 0;
  private updateInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current weather
   */
  async getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
    const cacheKey = `current_${lat.toFixed(2)}_${lng.toFixed(2)}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${WEATHER_API_BASE}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: WEATHER_API_KEY,
          units: 'metric',
        },
      });

      const data = response.data;
      const weather: CurrentWeather = {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility / 1000,
        windSpeed: Math.round(data.wind.speed * 3.6),
        windDeg: data.wind.deg,
        clouds: data.clouds.all,
        condition: data.weather[0].description,
        conditionIcon: data.weather[0].icon,
        conditionMain: data.weather[0].main,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        city: data.name,
        country: data.sys.country,
        timestamp: Date.now(),
      };

      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });

      // Send to REZ Mind for insights
      this.sendToMind(weather, lat, lng);

      return weather;
    } catch (error) {
      console.error('Weather API error:', error);
      // Return mock data if API fails
      return this.getMockWeather();
    }
  }

  /**
   * Send weather data to REZ Mind for location intelligence
   */
  private async sendToMind(weather: CurrentWeather, lat: number, lng: number): Promise<void> {
    // Throttle updates
    if (Date.now() - this.lastIntelligenceUpdate < this.updateInterval) {
      return;
    }

    try {
      // Get user ID from storage
      const userData = await AsyncStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : 'anonymous';

      // Send weather event to REZ Mind
      await axios.post(`${MIND_SERVICE_URL}/events`, {
        type: 'weather_observation',
        userId,
        data: {
          temperature: weather.temperature,
          feelsLike: weather.feelsLike,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          condition: weather.conditionMain,
          clouds: weather.clouds,
          city: weather.city,
          country: weather.country,
        },
        location: {
          latitude: lat,
          longitude: lng,
        },
        timestamp: Date.now(),
      });

      // Store in local intelligence
      await this.storeWeatherIntelligence(weather, lat, lng);

      this.lastIntelligenceUpdate = Date.now();
    } catch (error) {
      console.error('Failed to send weather to REZ Mind:', error);
    }
  }

  /**
   * Store weather intelligence locally
   */
  private async storeWeatherIntelligence(weather: CurrentWeather, lat: number, lng: number): Promise<void> {
    try {
      const key = `weather_intel_${lat.toFixed(2)}_${lng.toFixed(2)}`;
      const data = {
        weather,
        location: { lat, lng },
        updatedAt: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store weather intelligence:', error);
    }
  }

  /**
   * Get weather intelligence from local storage
   */
  async getWeatherIntelligence(lat: number, lng: number): Promise<{
    weather: CurrentWeather | null;
    insights: WeatherInsight[];
    lastUpdated: number;
  }> {
    try {
      const key = `weather_intel_${lat.toFixed(2)}_${lng.toFixed(2)}`;
      const data = await AsyncStorage.getItem(key);

      if (data) {
        const parsed = JSON.parse(data);
        return {
          weather: parsed.weather,
          insights: this.generateInsights(parsed.weather),
          lastUpdated: parsed.updatedAt,
        };
      }
    } catch (error) {
      console.error('Failed to get weather intelligence:', error);
    }

    return {
      weather: null,
      insights: [],
      lastUpdated: 0,
    };
  }

  /**
   * Generate insights based on weather
   */
  private generateInsights(weather: CurrentWeather): WeatherInsight[] {
    const insights: WeatherInsight[] = [];

    // Outdoor activities
    if (weather.conditionMain === 'Clear' && weather.temperature >= 20 && weather.temperature <= 30) {
      insights.push({
        type: 'outdoor',
        score: 90,
        message: 'Perfect weather for outdoor activities!',
        suggestions: ['Go for a walk', 'Visit a park', 'Outdoor sports'],
      });
    } else if (weather.conditionMain === 'Rain' || weather.conditionMain === 'Thunderstorm') {
      insights.push({
        type: 'outdoor',
        score: 20,
        message: 'Not ideal for outdoor activities',
        suggestions: ['Indoor activities', 'Visit a cafe', 'Movie time'],
      });
    }

    // Traffic
    if (((weather.rain ?? {})["1h"] || 0) > 5 || weather.clouds > 80) {
      insights.push({
        type: 'traffic',
        score: 40,
        message: 'Weather may affect traffic conditions',
        suggestions: ['Leave early', 'Use public transport', 'Plan alternate routes'],
      });
    } else {
      insights.push({
        type: 'traffic',
        score: 85,
        message: 'Good driving conditions',
        suggestions: ['Normal commute', 'Good time for delivery'],
      });
    }

    // Dining
    if (weather.temperature > 28) {
      insights.push({
        type: 'dining',
        score: 70,
        message: 'Hot weather - people prefer cold drinks & AC',
        suggestions: ['Ice cream shops', 'Cold beverages', 'AC restaurants'],
      });
    } else if (((weather.rain ?? {})["1h"] || 0) > 2) {
      insights.push({
        type: 'dining',
        score: 80,
        message: 'Rainy day = cozy dining',
        suggestions: ['Hot food', 'Soup restaurants', 'Indoor dining'],
      });
    }

    // Shopping
    if (((weather.rain ?? {})["1h"] || 0) > 3 || weather.conditionMain === 'Thunderstorm') {
      insights.push({
        type: 'shopping',
        score: 90,
        message: 'Indoor shopping is popular today',
        suggestions: ['Mall visits', 'Window shopping', 'Online orders'],
      });
    }

    // Events
    if (weather.conditionMain === 'Clear' && weather.temperature < 30) {
      insights.push({
        type: 'events',
        score: 95,
        message: 'Great weather for outdoor events!',
        suggestions: ['Outdoor concerts', 'Food festivals', 'Markets'],
      });
    }

    return insights;
  }

  /**
   * Get weather-based post suggestions
   */
  async getPostSuggestions(weather: CurrentWeather, area: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Weather-specific suggestions
    switch (weather.conditionMain) {
      case 'Clear':
        suggestions.push(`☀️ Beautiful sunny day in ${area}! What's everyone up to?`);
        suggestions.push(`🌅 Golden hour vibes in ${area}. Share your photos!`);
        if (weather.temperature > 30) {
          suggestions.push(`🔥 It's ${weather.temperature}°C in ${area}! Best AC places?`);
        }
        break;

      case 'Clouds':
        suggestions.push(`☁️ Overcast skies in ${area}. Perfect weather for a walk!`);
        suggestions.push(`🌤️ Nice cloudy weather in ${area} today!`);
        break;

      case 'Rain':
        suggestions.push(`🌧️ Rainy day in ${area}. Cozy spots to hang out?`);
        suggestions.push(`☔ Rain check! What's your favorite rainy day activity in ${area}?`);
        suggestions.push(`🍜 Perfect weather for hot soup or biryani in ${area}!`);
        break;

      case 'Thunderstorm':
        suggestions.push(`⛈️ Storm incoming in ${area}! Stay safe everyone!`);
        suggestions.push(`🌩️ Thunderstorm alert! Share indoor activity ideas for ${area}`);
        break;

      case 'Mist':
      case 'Fog':
        suggestions.push(`🌫️ Misty morning in ${area}. Stay visible!`);
        suggestions.push(`🥶 Foggy ${area} today. Coffee weather!`);
        break;
    }

    // Temperature-specific
    if (weather.temperature > 35) {
      suggestions.push(`🥵 ${weather.temperature}°C! Ice cream spots in ${area}?`);
      suggestions.push(`🧊 Beat the heat! Best cold drinks in ${area}?`);
    } else if (weather.temperature < 20) {
      suggestions.push(`🍲 Comfort food weather in ${area}! Share your favorites!`);
      suggestions.push(`☕ It's chilly! Best hot beverages in ${area}?`);
    }

    // Wind-specific
    if (weather.windSpeed > 25) {
      suggestions.push(`💨 Windy conditions in ${area}! Secure your items!`);
    }

    // Humidity-specific
    if (weather.humidity > 80) {
      suggestions.push(`💧 Humid day in ${area}. Light clothing recommended!`);
    }

    // Time-based
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) {
      suggestions.push(`🌅 Good morning ${area}! What's for breakfast?`);
    } else if (hour >= 17 && hour < 20) {
      suggestions.push(`🌆 Evening vibes in ${area}! Happy hour spots?`);
    } else if (hour >= 22 || hour < 5) {
      suggestions.push(`🌙 Night owl activities in ${area}?`);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Get weather alerts
   */
  async getAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    // Get current weather to check conditions
    const weather = await this.getCurrentWeather(lat, lng);

    // Generate alerts based on conditions
    if (weather.temperature > 40) {
      alerts.push({
        id: 'heat_extreme',
        sender: 'Weather Service',
        event: 'Extreme Heat Warning',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        description: `Temperature expected to reach ${weather.temperature}°C. Stay hydrated and avoid direct sunlight.`,
        severity: 'emergency',
      });
    }

    if (weather.conditionMain === 'Thunderstorm') {
      alerts.push({
        id: 'storm_warning',
        sender: 'Weather Service',
        event: 'Thunderstorm Alert',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        description: 'Thunderstorms expected. Seek shelter and avoid open areas.',
        severity: 'warning',
      });
    }

    if (weather.windSpeed > 40) {
      alerts.push({
        id: 'wind_warning',
        sender: 'Weather Service',
        event: 'Strong Wind Warning',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        description: `Strong winds of ${weather.windSpeed} km/h expected. Secure loose items.`,
        severity: 'warning',
      });
    }

    if (((weather.rain ?? {})["1h"] || 0) > 10) {
      alerts.push({
        id: 'rain_heavy',
        sender: 'Weather Service',
        event: 'Heavy Rain Alert',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        description: 'Heavy rainfall expected. Possible waterlogging in low-lying areas.',
        severity: 'watch',
      });
    }

    if (weather.visibility < 2) {
      alerts.push({
        id: 'fog_warning',
        sender: 'Weather Service',
        event: 'Dense Fog Advisory',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        description: 'Low visibility due to fog. Drive with caution.',
        severity: 'watch',
      });
    }

    return alerts;
  }

  /**
   * Get 5-day forecast (3-hour intervals)
   */
  async getForecast(lat: number, lng: number): Promise<HourlyForecast[]> {
    try {
      const response = await axios.get(`${WEATHER_API_BASE}/forecast`, {
        params: {
          lat,
          lon: lng,
          appid: WEATHER_API_KEY,
          units: 'metric',
        },
      });

      return response.data.list.slice(0, 8).map((item) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
        }),
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        condition: item.weather[0].description,
        conditionIcon: item.weather[0].icon,
        precipitation: Math.round((item.pop || 0) * 100),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6),
      }));
    } catch (error) {
      console.error('Forecast API error:', error);
      return this.getMockForecast();
    }
  }

  /**
   * Get air quality
   */
  async getAirQuality(lat: number, lng: number): Promise<AirQuality> {
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
        params: {
          lat,
          lon: lng,
          appid: WEATHER_API_KEY,
        },
      });

      const data = response.data.list[0];
      const aqi = data.main.aqi;

      return {
        aqi,
        category: this.getAQICategory(aqi),
        pm25: data.components.pm2_5,
        pm10: data.components.pm10,
        o3: data.components.o3,
        no2: data.components.no2,
      };
    } catch (error) {
      console.error('Air quality API error:', error);
      return {
        aqi: 50,
        category: 'Good',
        pm25: 0,
        pm10: 0,
        o3: 0,
        no2: 0,
      };
    }
  }

  /**
   * Get weather-based recommendations
   */
  getRecommendations(weather: CurrentWeather): string[] {
    const recommendations: string[] = [];

    if (weather.temperature > 30) {
      recommendations.push('Stay hydrated - drink plenty of water');
    }

    if (weather.conditionMain === 'Rain' || weather.conditionMain === 'Thunderstorm') {
      recommendations.push('Carry an umbrella today');
    }

    if (weather.clouds < 20) {
      recommendations.push('High UV - use sunscreen');
    }

    if (weather.windSpeed > 30) {
      recommendations.push('Windy conditions - secure loose items');
    }

    if (weather.humidity > 80) {
      recommendations.push('High humidity - dress light');
    }

    if (weather.visibility < 5) {
      recommendations.push('Low visibility - drive carefully');
    }

    return recommendations;
  }

  private getAQICategory(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Map OpenWeather icon to Ionicons
   */
  getIconName(iconCode: string): string {
    const iconMap: Record<string, string> = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'partly-sunny',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'cloudy',
      '50n': 'cloudy',
    };
    return iconMap[iconCode] || 'sunny';
  }

  /**
   * Get mock weather for development
   */
  private getMockWeather(): CurrentWeather {
    return {
      temperature: 28,
      feelsLike: 31,
      tempMin: 24,
      tempMax: 32,
      humidity: 65,
      pressure: 1013,
      visibility: 10,
      windSpeed: 12,
      windDeg: 180,
      clouds: 30,
      condition: 'partly cloudy',
      conditionIcon: '02d',
      conditionMain: 'Clouds',
      sunrise: '6:02 AM',
      sunset: '6:45 PM',
      city: 'Bangalore',
      country: 'IN',
      timestamp: Date.now(),
    };
  }

  private getMockForecast(): HourlyForecast[] {
    return [
      { time: 'Now', temp: 28, feelsLike: 31, condition: 'partly cloudy', conditionIcon: '02d', precipitation: 10, humidity: 65, windSpeed: 12 },
      { time: '2PM', temp: 29, feelsLike: 32, condition: 'sunny', conditionIcon: '01d', precipitation: 5, humidity: 60, windSpeed: 14 },
      { time: '4PM', temp: 30, feelsLike: 33, condition: 'sunny', conditionIcon: '01d', precipitation: 0, humidity: 55, windSpeed: 16 },
      { time: '6PM', temp: 28, feelsLike: 30, condition: 'partly cloudy', conditionIcon: '02d', precipitation: 20, humidity: 70, windSpeed: 10 },
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const weatherService = new WeatherService();
