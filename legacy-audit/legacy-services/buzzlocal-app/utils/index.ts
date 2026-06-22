/**
 * Utility Functions
 */

// Logger
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service?: string;
  [key: string]: unknown;
}

class Logger {
  private service: string;
  private minLevel: LogLevel;

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(service = 'buzzlocal-app') {
    this.service = service;
    this.minLevel = 'debug'; // Always show all logs in app for debugging
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...meta,
    };
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, meta);
    const output = JSON.stringify(entry);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  child(childService: string): Logger {
    return new Logger(`${this.service}:${childService}`);
  }
}

export const logger = new Logger();

// Format Date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Format Time
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format Relative Time
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

// Format Price
export function formatPrice(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

// Format Distance
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} km`;
}

// Validate Phone
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Validate Email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Truncate Text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Debounce
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Clamp Number
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Sleep
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Safe JSON Parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Capitalize First Letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Slugify
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get Initials
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Check if Empty
export function isEmpty(value): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
