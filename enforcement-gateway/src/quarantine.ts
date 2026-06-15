/**
 * Quarantine Queue - Hold content for review
 */

import { v4 as uuidv4 } from 'uuid';
import type { QuarantinedItem, EnforcementRequest, EnforcementViolation } from './types.js';

export class QuarantineQueue {
  private queue: Map<string, QuarantinedItem> = new Map();
  private retentionDays: number;

  constructor(retentionDays: number = 30) {
    this.retentionDays = retentionDays;

    // Cleanup old items periodically
    setInterval(() => this.cleanup(), 3600000); // Every hour
  }

  /**
   * Add item to quarantine
   */
  add(
    request: EnforcementRequest,
    reason: string,
    violations: EnforcementViolation[],
    quarantinedBy: string = 'system'
  ): QuarantinedItem {
    const item: QuarantinedItem = {
      id: uuidv4(),
      request,
      reason,
      violations,
      quarantinedAt: new Date(),
      quarantinedBy,
      status: 'pending',
    };

    this.queue.set(item.id, item);
    return item;
  }

  /**
   * Get item by ID
   */
  get(id: string): QuarantinedItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all pending items
   */
  getPending(): QuarantinedItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => b.quarantinedAt.getTime() - a.quarantinedAt.getTime());
  }

  /**
   * Get items by status
   */
  getByStatus(status: QuarantinedItem['status']): QuarantinedItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === status);
  }

  /**
   * Approve item
   */
  approve(id: string, reviewedBy: string, notes?: string): boolean {
    const item = this.queue.get(id);
    if (!item || item.status !== 'pending') return false;

    item.status = 'approved';
    item.reviewedBy = reviewedBy;
    item.reviewedAt = new Date();
    item.reviewNotes = notes;

    return true;
  }

  /**
   * Reject item
   */
  reject(id: string, reviewedBy: string, notes?: string): boolean {
    const item = this.queue.get(id);
    if (!item || item.status !== 'pending') return false;

    item.status = 'rejected';
    item.reviewedBy = reviewedBy;
    item.reviewedAt = new Date();
    item.reviewNotes = notes;

    return true;
  }

  /**
   * Modify and approve item
   */
  modify(
    id: string,
    modifiedContent: string,
    reviewedBy: string,
    notes?: string
  ): boolean {
    const item = this.queue.get(id);
    if (!item || item.status !== 'pending') return false;

    item.request.content = modifiedContent;
    item.status = 'modified';
    item.reviewedBy = reviewedBy;
    item.reviewedAt = new Date();
    item.reviewNotes = notes;

    return true;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    modified: number;
    oldestPending: Date | null;
  } {
    const items = Array.from(this.queue.values());
    const pending = items.filter(i => i.status === 'pending');
    const approved = items.filter(i => i.status === 'approved');
    const rejected = items.filter(i => i.status === 'rejected');
    const modified = items.filter(i => i.status === 'modified');

    return {
      total: items.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      modified: modified.length,
      oldestPending: pending.length > 0
        ? pending.sort((a, b) => a.quarantinedAt.getTime() - b.quarantinedAt.getTime())[0].quarantinedAt
        : null,
    };
  }

  /**
   * Remove old items
   */
  private cleanup(): void {
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

    for (const [id, item] of this.queue.entries()) {
      if (item.quarantinedAt.getTime() < cutoff && item.status !== 'pending') {
        this.queue.delete(id);
      }
    }
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.queue.clear();
  }
}

// Singleton
export const quarantineQueue = new QuarantineQueue();
