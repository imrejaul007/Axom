/**
 * React hooks for TrustOS Compliance SDK
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ComplianceClient } from './client';
import {
  ComplianceResult,
  PermissionResult,
  AuditLogEntry,
  SDKConfig,
} from './types';

// Singleton client instance
let clientInstance: ComplianceClient | null = null;

function getClient(config?: SDKConfig): ComplianceClient {
  if (!clientInstance && config) {
    clientInstance = new ComplianceClient(config);
  }
  if (!clientInstance) {
    throw new Error('Compliance SDK not initialized. Provide config on first use.');
  }
  return clientInstance;
}

export function initComplianceSDK(config: SDKConfig): void {
  clientInstance = new ComplianceClient(config);
}

/**
 * Hook for email compliance validation
 */
export function useComplianceCheck(type: 'email' | 'document' | 'linkedin') {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const validate = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      let validationResult: ComplianceResult;

      switch (type) {
        case 'email':
          validationResult = await client.communication.validateEmail(data);
          break;
        case 'document':
          validationResult = await client.communication.validateDocument(data);
          break;
        case 'linkedin':
          validationResult = await client.communication.validateLinkedIn(data);
          break;
        default:
          throw new Error(`Unknown validation type: ${type}`);
      }

      setResult(validationResult);
      return validationResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [type]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { validate, result, loading, error, reset };
}

/**
 * Hook for agent permission checking
 */
export function useAgentPermission(agentId: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionResult, setPermissionResult] = useState<PermissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkPermission = useCallback(async (action: string, resource?: string) => {
    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      const result = await client.agent.checkPermission({
        agentId,
        action,
        resource,
      });

      setPermissionResult(result);
      setHasPermission(result.allowed);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const reset = useCallback(() => {
    setPermissionResult(null);
    setHasPermission(false);
    setError(null);
  }, []);

  return { checkPermission, hasPermission, permissionResult, loading, error, reset };
}

/**
 * Hook for audit logging
 */
export function useAuditLog(maxEvents: number = 50) {
  const [recentEvents, setRecentEvents] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logEvent = useCallback(async (event: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    try {
      const client = getClient();
      const result = await client.audit.log(event);

      setRecentEvents(prev => [
        { ...event, id: result.id, timestamp: result.timestamp } as AuditLogEntry,
        ...prev,
      ].slice(0, maxEvents));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      // Don't throw - logging failures shouldn't break the app
      console.error('Audit log failed:', error);
    }
  }, [maxEvents]);

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
  }, []);

  return { logEvent, recentEvents, loading, error, clearEvents };
}

/**
 * Hook for real-time compliance monitoring
 */
export function useComplianceStream(params?: {
  eventTypes?: string[];
  users?: string[];
}) {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    try {
      const client = getClient();
      const eventSource = client.audit.streamComplianceEvents(params as any);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => setConnected(true);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents(prev => [...prev, data].slice(-100)); // Keep last 100 events
        } catch (e) {
          console.error('Failed to parse SSE data:', e);
        }
      };

      eventSource.onerror = (err) => {
        setError(new Error('SSE connection error'));
        setConnected(false);
      };

      return () => {
        eventSource.close();
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    }
  }, [params?.eventTypes?.join(','), params?.users?.join(',')]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, connected, error, clearEvents };
}

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats(refreshInterval?: number) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const client = getClient();
      const dashboardStats = await client.audit.getDashboardStats();
      setStats(dashboardStats);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refresh: fetchStats };
}

/**
 * Hook for approval queue
 */
export function useApprovalQueue() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const client = getClient();
      const result = await client.agent.getApprovalQueue();
      setApprovals(result.approvals);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = useCallback(async (approvalId: string, approverId: string, notes?: string) => {
    const client = getClient();
    await client.agent.approveRequest(approvalId, { approverId, notes });
    await fetchApprovals();
  }, [fetchApprovals]);

  const reject = useCallback(async (approvalId: string, approverId: string, reason: string) => {
    const client = getClient();
    await client.agent.rejectRequest(approvalId, { approverId, reason });
    await fetchApprovals();
  }, [fetchApprovals]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  return { approvals, loading, error, refresh: fetchApprovals, approve, reject };
}
