import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: string[];
  lastMessageId?: string;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: String, required: true }],
    lastMessageId: { type: String },
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true, collection: 'conversations' }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);