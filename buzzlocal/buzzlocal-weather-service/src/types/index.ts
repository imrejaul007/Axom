import { z } from 'zod';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  visibility: number;
  rainProbability: number;
  updatedAt: Date;
}

export interface WeatherAlert {
  id: string;
  type: 'rain' | 'storm' | 'heat' | 'cold' | 'fog' | 'wind';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radius: number;
  expiresAt: Date;
  active: boolean;
  createdAt: Date;
}

export const GetWeatherSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type GetWeatherInput = z.infer<typeof GetWeatherSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  dependencies: { mongodb: 'connected' | 'disconnected'; redis: 'connected' | 'disconnected' };
}