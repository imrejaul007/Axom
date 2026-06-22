import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherObservation extends Document {
  _id: mongoose.Types.ObjectId;
  location: {
    latitude: number;
    longitude: number;
    area?: string;
    city?: string;
  };
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  clouds: number;
  condition: string;
  conditionMain: string;
  rain?: { '1h': number; '3h': number };
  snow?: { '1h': number; '3h': number };
  source: 'api' | 'user_report';
  observationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeatherObservationSchema = new Schema<IWeatherObservation>(
  {
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      area: String,
      city: String,
    },
    temperature: { type: Number, required: true },
    feelsLike: Number,
    humidity: Number,
    windSpeed: Number,
    pressure: Number,
    visibility: Number,
    clouds: Number,
    condition: String,
    conditionMain: String,
    rain: { '1h': Number, '3h': Number },
    snow: { '1h': Number, '3h': Number },
    source: { type: String, enum: ['api', 'user_report'], default: 'api' },
    observationCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

WeatherObservationSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
WeatherObservationSchema.index({ 'location.city': 1, createdAt: -1 });
WeatherObservationSchema.index({ conditionMain: 1, createdAt: -1 });

export const WeatherObservation = mongoose.model<IWeatherObservation>('WeatherObservation', WeatherObservationSchema);
