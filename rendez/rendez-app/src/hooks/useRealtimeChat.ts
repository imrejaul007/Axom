/**
 * useRealtimeChat
 *
 * Manages a Socket.io connection scoped to a single match.
 * Handles reconnection, message delivery, typing indicators, and read receipts.
 *
 * Usage:
 *   const { messages, sendMessage, typing, markRead } = useRealtimeChat(matchId);
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const _API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!_API_URL) throw new Error('[Rendez] EXPO_PUBLIC_API_URL is not configured');
const WS_URL = _API_URL.replace('/api/v1', '');

export interface ChatMessage {
  id: string;
  matchId: string;
  stateId: string;
  senderId: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface UseRealtimeChatResult {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isTyping: boolean;
  setTyping: (typing: boolean) => void;
  markRead: (messageId: string) => void;
  connected: boolean;
}

export function useRealtimeChat(matchId: string, initialMessages: ChatMessage[] = []): UseRealtimeChatResult {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTypingRemote] = useState(false);
  const [connected, setConnected] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || !matchId) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('typing', () => {
      setIsTypingRemote(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTypingRemote(false), 3000);
    });

    socket.on('stop_typing', () => {
      setIsTypingRemote(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    });

    socket.on('read', ({ messageId }: { messageId: string; readBy: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
      );
    });

    socket.on('error', (err: { code: string; message: string }) => {
      // R2-M8: Wrap in __DEV__ guard — WebSocket error codes/messages leak to production logs otherwise.
      if (__DEV__) console.warn('[WS] Error:', err.code, err.message);
    });

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [matchId, token]);

  const sendMessage = useCallback((content: string) => {
    socketRef.current?.emit('send_message', { matchId, content });
  }, [matchId]);

  const setTyping = useCallback((typing: boolean) => {
    if (typing) {
      socketRef.current?.emit('typing', { matchId });
    } else {
      socketRef.current?.emit('stop_typing', { matchId });
    }
  }, [matchId]);

  const markRead = useCallback((messageId: string) => {
    socketRef.current?.emit('read_receipt', { matchId, messageId });
  }, [matchId]);

  return { messages, sendMessage, isTyping, setTyping, markRead, connected };
}
