/**
 * TrustOS Shield - Trust Score Display Component
 */

import React from 'react';
import type { TrustScore, TrustLevel } from '../types/index.js';

interface TrustScoreCardProps {
  score: TrustScore;
  compact?: boolean;
  showDimensions?: boolean;
}

// Color mapping for trust levels
const levelColors: Record<TrustLevel, { bg: string; text: string; border: string }> = {
  exceptional: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  excellent: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-500' },
  good: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  fair: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  poor: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  new: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400' },
};

// Level labels
const levelLabels: Record<TrustLevel, string> = {
  exceptional: 'Exceptional',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  new: 'New User',
};

/**
 * Trust Score Card Component
 */
export function TrustScoreCard({ score, compact = false, showDimensions = true }: TrustScoreCardProps) {
  const colors = levelColors[score.level];
  const percentage = Math.round((score.overall / 1000) * 100);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
        <ShieldIcon level={score.level} />
        <span className="font-semibold">{score.overall}</span>
        <span className="text-sm opacity-75">{levelLabels[score.level]}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldIcon level={score.level} />
          <span className="font-semibold">Trust Score</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-white/50 ${colors.text}`}>
          {levelLabels[score.level]}
        </span>
      </div>

      {/* Score Display */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 3.52} 352`}
              className={colors.text}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{score.overall}</span>
            <span className="text-sm opacity-75">/1000</span>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      {showDimensions && (
        <div className="space-y-2">
          <DimensionBar label="Identity" value={score.dimensions.identity} />
          <DimensionBar label="Financial" value={score.dimensions.financial} />
          <DimensionBar label="Behavioral" value={score.dimensions.behavioral} />
          <DimensionBar label="Reputation" value={score.dimensions.reputation} />
          <DimensionBar label="Compliance" value={score.dimensions.compliance} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-xs opacity-60">
        Last updated: {new Date(score.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}

/**
 * Dimension Bar Component
 */
function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-24 text-right">{label}</span>
      <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-current opacity-75 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm w-8">{value}</span>
    </div>
  );
}

/**
 * Shield Icon Component
 */
function ShieldIcon({ level }: { level: TrustLevel }) {
  const iconColor = {
    exceptional: 'text-green-600',
    excellent: 'text-emerald-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-orange-600',
    new: 'text-gray-500',
  }[level];

  return (
    <svg
      className={`w-5 h-5 ${iconColor}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

export default TrustScoreCard;
