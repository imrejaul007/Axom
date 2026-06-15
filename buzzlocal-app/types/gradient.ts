/**
 * Gradient Type Definitions for LinearGradient
 */

import { ColorValue } from 'react-native';

// Common gradient color pairs
export const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6'] as [ColorValue, ColorValue],
  success: ['#10B981', '#059669'] as [ColorValue, ColorValue],
  warning: ['#F59E0B', '#D97706'] as [ColorValue, ColorValue],
  error: ['#EF4444', '#DC2626'] as [ColorValue, ColorValue],
  info: ['#3B82F6', '#2563EB'] as [ColorValue, ColorValue],
  pink: ['#EC4899', '#DB2777'] as [ColorValue, ColorValue],
  purple: ['#8B5CF6', '#7C3AED'] as [ColorValue, ColorValue],
  orange: ['#F97316', '#EA580C'] as [ColorValue, ColorValue],
  cyan: ['#06B6D4', '#0891B2'] as [ColorValue, ColorValue],
} as const;

// Premium gradients
export const PREMIUM_GRADIENTS = {
  hero: ['#6366F1', '#8B5CF6', '#EC4899'] as [ColorValue, ColorValue, ColorValue],
  sunset: ['#F97316', '#EC4899', '#8B5CF6'] as [ColorValue, ColorValue, ColorValue],
  ocean: ['#06B6D4', '#3B82F6', '#8B5CF6'] as [ColorValue, ColorValue, ColorValue],
} as const;

// Safety specific gradients
export const SAFETY_GRADIENTS = {
  safe: ['#10B981', '#059669'] as [ColorValue, ColorValue],
  caution: ['#F59E0B', '#D97706'] as [ColorValue, ColorValue],
  danger: ['#EF4444', '#DC2626'] as [ColorValue, ColorValue],
  medical: ['#EF4444', '#F87171'] as [ColorValue, ColorValue],
} as const;

// Crisis type gradients
export const CRISIS_GRADIENTS: Record<string, [ColorValue, ColorValue]> = {
  flood: ['#3B82F6', '#2563EB'],
  fire: ['#EF4444', '#DC2626'],
  earthquake: ['#F97316', '#EA580C'],
  medical: ['#EC4899', '#DB2777'],
  accident: ['#FBBF24', '#F59E0B'],
  evacuation: ['#8B5CF6', '#7C3AED'],
};

// Status gradients
export const STATUS_GRADIENTS: Record<string, [ColorValue, ColorValue]> = {
  active: ['#10B981', '#059669'],
  sold: ['#6B7280', '#4B5563'],
  pending: ['#F59E0B', '#D97706'],
  completed: ['#10B981', '#059669'],
  cancelled: ['#EF4444', '#DC2626'],
};

// Category gradients
export const CATEGORY_GRADIENTS: Record<string, [ColorValue, ColorValue]> = {
  'Food & Dining': ['#EF4444', '#DC2626'],
  'Safety': ['#10B981', '#059669'],
  'Fitness': ['#F59E0B', '#D97706'],
  'Events': ['#8B5CF6', '#7C3AED'],
  'Shopping': ['#3B82F6', '#2563EB'],
  'Healthcare': ['#EC4899', '#DB2777'],
};

// Type for any gradient tuple
export type GradientTuple = readonly [ColorValue, ColorValue, ...ColorValue[]];
