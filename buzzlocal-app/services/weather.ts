/**
 * Weather Service - Mock implementation for BuzzLocal
 */

export interface WeatherAlert {
  id: string;
  sender: string;
  event: string;
  start: string;
  end: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
}

export interface WeatherInsight {
  type: 'activity' | 'health' | 'traffic' | 'outdoor' | 'dining' | 'events';
  icon: string;
  title: string;
  description: string;
  score?: number;
  message?: string;
  suggestions?: string[];
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionMain?: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  aqi: number;
  sunrise: string;
  sunset: string;
  city?: string;
  hourly?: HourlyForecast[];
  daily?: WeatherForecast[];
  alerts?: WeatherAlert[];
  insights?: WeatherInsight[];
}

export interface WeatherIntelligence {
  insights: WeatherInsight[];
  alerts: WeatherAlert[];
}

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
}

export const weatherService = {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData & { city?: string }> {
    // Mock implementation - returns default weather data
    return {
      temperature: 28,
      feelsLike: 31,
      condition: 'Partly Cloudy',
      conditionMain: 'Clouds',
      conditionIcon: 'partly-sunny',
      humidity: 65,
      windSpeed: 12,
      uvIndex: 6,
      visibility: 10,
      aqi: 45,
      sunrise: '6:02 AM',
      sunset: '6:45 PM',
      city: 'Bangalore',
    };
  },

  async getHourlyForecast(lat: number, lng: number): Promise<HourlyForecast[]> {
    // Mock implementation - returns 24-hour forecast
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        time: `${(6 + i) % 24}:00`,
        temp: 25 + Math.floor(Math.random() * 8),
        icon: 'sunny',
      });
    }
    return hours;
  },

  async getDailyForecast(lat: number, lng: number): Promise<WeatherForecast[]> {
    // Mock implementation - returns 7-day forecast
    const days = ['Today', 'Tomorrow'];
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'];
    const forecast = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: i < 2 ? days[i] : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        high: 30 + Math.floor(Math.random() * 5),
        low: 20 + Math.floor(Math.random() * 5),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        icon: 'partly-sunny',
        precipitation: Math.floor(Math.random() * 100),
      });
    }
    return forecast;
  },

  async getAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
    // Mock implementation - returns empty alerts
    return [];
  },

  async getInsights(lat: number, lng: number): Promise<WeatherInsight[]> {
    // Mock implementation - returns default insights
    return [
      {
        type: 'activity',
        icon: 'walk',
        title: 'Perfect for a Walk',
        description: 'Weather conditions are ideal for outdoor activities.',
      },
      {
        type: 'health',
        icon: 'medical',
        title: 'Stay Hydrated',
        description: 'High humidity today. Remember to drink plenty of water.',
      },
    ];
  },

  async getPostSuggestions(weather: WeatherData, location: string): Promise<string[]> {
    // Generate weather-based post suggestions
    const suggestions: string[] = [];

    if (weather.condition.toLowerCase().includes('rain')) {
      suggestions.push(`It's raining in ${location}! What's everyone doing indoors today?`);
      suggestions.push(`Rainy day vibes in ${location}. Any cozy cafe recommendations?`);
    } else if (weather.condition.toLowerCase().includes('sunny') || weather.condition.toLowerCase().includes('clear')) {
      suggestions.push(`Beautiful sunny day in ${location}! Where should I go?`);
      suggestions.push(`Perfect weather for outdoor activities in ${location}!`);
    } else {
      suggestions.push(`How's the weather treating you in ${location} today?`);
      suggestions.push(`Anyone up for an adventure in ${location} today?`);
    }

    return suggestions;
  },

  getIconName(condition: string): string {
    const lower = condition.toLowerCase();
    if (lower.includes('sun') || lower.includes('clear')) return 'sunny';
    if (lower.includes('cloud')) return 'partly-sunny';
    if (lower.includes('rain')) return 'rainy';
    if (lower.includes('storm')) return 'thunderstorm';
    if (lower.includes('snow')) return 'snow';
    return 'cloudy';
  },

  async getWeatherIntelligence(lat: number, lng: number): Promise<WeatherIntelligence> {
    const [alerts, insights] = await Promise.all([
      this.getAlerts(lat, lng),
      this.getInsights(lat, lng),
    ]);
    return { alerts, insights };
  },
};

export default weatherService;
