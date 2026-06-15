/**
 * TrustOS Shield - Scam Alert Component
 */

import React from 'react';
import type { ScamCheckResult, RiskLevel } from '../types/index.js';

interface ScamAlertCardProps {
  result: ScamCheckResult;
  onShare?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  compact?: boolean;
}

// Color mapping for risk levels
const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; icon: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500', icon: 'text-red-600' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500', icon: 'text-orange-600' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500', icon: 'text-yellow-600' },
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', icon: 'text-green-600' },
};

// Scam type labels
const scamTypeLabels: Record<string, string> = {
  phishing: 'Phishing Attack',
  bank_scam: 'Bank Scam',
  upi_fraud: 'UPI Fraud',
  otp_scam: 'OTP Scam',
  job_scam: 'Job Scam',
  investment_scam: 'Investment Scam',
  fake_support: 'Fake Support',
  impersonation: 'Impersonation Scam',
};

/**
 * Scam Alert Card Component
 */
export function ScamAlertCard({
  result,
  onShare,
  onBlock,
  onReport,
  compact = false
}: ScamAlertCardProps) {
  const colors = riskColors[result.riskScore >= 70 ? 'critical' : result.riskScore >= 50 ? 'high' : result.riskScore >= 30 ? 'medium' : 'low'];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
        <WarningIcon className={colors.icon} />
        <div>
          <span className="font-semibold">
            {result.isScam ? '⚠️ Scam Detected' : '✓ Safe'}
          </span>
          <span className="ml-2 text-sm opacity-75">
            Risk: {result.riskScore}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <WarningIcon className={`w-8 h-8 ${colors.icon} flex-shrink-0`} />
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${colors.text}`}>
            {result.isScam ? '⚠️ Scam Detected!' : '✓ Appears Safe'}
          </h3>
          <p className="text-sm opacity-75 mt-1">
            Risk Score: <span className="font-semibold">{result.riskScore}%</span>
            {result.confidence && (
              <> • Confidence: {(result.confidence * 100).toFixed(0)}%</>
            )}
          </p>
          {result.scamType && (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-white/50 ${colors.text}`}>
              {scamTypeLabels[result.scamType] || result.scamType}
            </span>
          )}
        </div>
      </div>

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm mb-2">🚨 Why this is dangerous:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {result.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm mb-2">⚡ Warnings:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {result.warnings.map((warning, i) => (
              <li key={i} className="opacity-80">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm mb-2">🛡️ What to do:</h4>
          <ul className="space-y-1">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-600">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/20">
        {onBlock && (
          <button
            onClick={onBlock}
            className="flex-1 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg font-medium text-sm transition-colors"
          >
            🚫 Block Number
          </button>
        )}
        {onReport && (
          <button
            onClick={onReport}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            ⚠️ Report Scam
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg font-medium text-sm transition-colors"
          >
            📤 Share Alert
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Warning Icon Component
 */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || 'w-6 h-6'}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

/**
 * Inline Scam Badge Component
 */
export function ScamBadge({ riskScore }: { riskScore: number }) {
  const level = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
  const colors = riskColors[level];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      {riskScore >= 50 ? 'Risky' : 'Safe'}
    </span>
  );
}

export default ScamAlertCard;
