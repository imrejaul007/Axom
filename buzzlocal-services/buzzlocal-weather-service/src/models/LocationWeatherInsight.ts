import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationWeatherInsight extends Document {
  _id: mongoose.Types.ObjectId;
  location: {
    latitude: number;
    longitude: number;
    area: string;
    city: string;
  };
  insights: {
    type: 'traffic' | 'outdoor' | 'shopping' | 'dining' | 'events';
    score: number;
    message: string;
    suggestions: string[];
  }[];
  aggregatedWeather: {
    avgTemperature: number;
    avgHumidity: number;
    dominantCondition: string;
    observationCount: number;
  };
  nextUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocationWeatherInsightSchema = new Schema<ILocationWeatherInsight>(
  {
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
    },
    insights: [
      {
        type: { type: String, enum: ['traffic', 'outdoor', 'shopping', 'dining', 'events'] },
        score: Number,
        message: String,
        suggestions: [String],
      },
    ],
    aggregatedWeather: {
      avgTemperature: Number,
      avgHumidity: Number,
      dominantCondition: String,
      observationCount: Number,
    },
    nextUpdate: Date,
  },
  { timestamps: true }
);

LocationWeatherInsightSchema.index({ 'location.latitude': 1, 'location.longitude': 1 }, { unique: true });

export const LocationWeatherInsight = mongoose.model<ILocationWeatherInsight>('LocationWeatherInsight', LocationWeatherInsightSchema);
