import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  types: {
    like: boolean;
    comment: boolean;
    follow: boolean;
    mention: boolean;
    system: boolean;
    alert: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const TypesSchema = new Schema({
  like: { type: Boolean, default: true },
  comment: { type: Boolean, default: true },
  follow: { type: Boolean, default: true },
  mention: { type: Boolean, default: true },
  system: { type: Boolean, default: true },
  alert: { type: Boolean, default: true },
}, { _id: false });

const QuietHoursSchema = new Schema({
  enabled: { type: Boolean, default: false },
  start: { type: String, default: '22:00' },
  end: { type: String, default: '08:00' },
}, { _id: false });

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: false },
    types: { type: TypesSchema, default: () => ({}) },
    quietHours: { type: QuietHoursSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'notification_preferences',
  }
);

export const NotificationPreference = mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);