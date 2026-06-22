import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInterest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  interests: {
    category: string;
    score: number;
    lastInteraction: Date;
  }[];
  areaPreferences: {
    area: string;
    visitFrequency: number;
    lastVisit: Date;
  }[];
  timePreferences: {
    hour: number;
    activity: string;
    score: number;
  }[];
  updatedAt: Date;
}

const UserInterestSchema = new Schema<IUserInterest>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    interests: [{
      category: String,
      score: Number,
      lastInteraction: Date,
    }],
    areaPreferences: [{
      area: String,
      visitFrequency: Number,
      lastVisit: Date,
    }],
    timePreferences: [{
      hour: Number,
      activity: String,
      score: Number,
    }],
  },
  { timestamps: true }
);

export const UserInterest = mongoose.model<IUserInterest>('UserInterest', UserInterestSchema);
