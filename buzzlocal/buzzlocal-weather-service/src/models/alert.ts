import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherAlert extends Document {
  type: 'rain' | 'storm' | 'heat' | 'cold' | 'fog' | 'wind';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  message: string;
  location: { type: string; coordinates: [number, number] };
  radius: number;
  expiresAt: Date;
  active: boolean;
  createdAt: Date;
}

const WeatherAlertSchema = new Schema<IWeatherAlert>(
  {
    type: { type: String, enum: ['rain', 'storm', 'heat', 'cold', 'fog', 'wind'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'extreme'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    location: { type: { type: String, default: 'Point' }, coordinates: { type: [Number], required: true } },
    radius: { type: Number, default: 5000 },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'weather_alerts' }
);

WeatherAlertSchema.index({ location: '2dsphere' });
WeatherAlertSchema.index({ active: 1, expiresAt: 1 });
WeatherAlertSchema.index({ createdAt: -1 });

export const WeatherAlert = mongoose.model<IWeatherAlert>('WeatherAlert', WeatherAlertSchema);