/**
 * Permission Engine - Core agent permission checking
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Agent,
  AgentPermission,
  PermissionDecision,
  ActionRequest,
  ActionDecision,
  AgentBoundary,
  PermissionCondition,
} from './types.js';

export class PermissionEngine {
  private agents: Map<string, Agent> = new Map();

  /**
   * Register agent
   */
  registerAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent {
    const newAgent: Agent = {
      ...agent,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agents.set(newAgent.id, newAgent);
    return newAgent;
  }

  /**
   * Get agent
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Check if agent can perform action
   */
  checkPermission(request: ActionRequest): ActionDecision {
    const agent = this.agents.get(request.agentId);

    if (!agent) {
      return {
        requestId: request.id,
        decision: 'deny',
        reason: 'Agent not found',
        processingTimeMs: 0,
      };
    }

    if (agent.status !== 'active') {
      return {
        requestId: request.id,
        decision: 'deny',
        reason: `Agent is ${agent.status}`,
        processingTimeMs: 0,
      };
    }

    // Check boundaries
    const boundaryCheck = this.checkBoundaries(agent, request);
    if (boundaryCheck.decision !== 'allow') {
      return boundaryCheck;
    }

    // Check permissions
    const permissionCheck = this.checkPermissions(agent, request);
    return permissionCheck;
  }

  /**
   * Check agent boundaries
   */
  private checkBoundaries(agent: Agent, request: ActionRequest): ActionDecision {
    for (const boundary of agent.boundaries) {
      switch (boundary.type) {
        case 'rate_limit':
          // Would check rate limit in production
          break;

        case 'data_access':
          if (boundary.config.deniedResources?.length) {
            const resource = request.resource || '';
            for (const denied of boundary.config.deniedResources) {
              if (resource.includes(denied)) {
                return {
                  requestId: request.id,
                  decision: 'deny',
                  reason: `Access to ${denied} is not allowed`,
                  processingTimeMs: 0,
                };
              }
            }
          }
          break;

        case 'time_window':
          if (boundary.config.allowedHours?.length) {
            const hour = new Date().getHours();
            const currentHour = `${hour.toString().padStart(2, '0')}:00`;
            if (!boundary.config.allowedHours.includes(currentHour)) {
              return {
                requestId: request.id,
                decision: 'deny',
                reason: `Action not allowed at this time (allowed: ${boundary.config.allowedHours.join(', ')})`,
                processingTimeMs: 0,
              };
            }
          }
          break;

        case 'action_limit':
          if (boundary.config.limit && boundary.action === request.action) {
            // Would check counter in production
          }
          break;
      }
    }

    return { requestId: request.id, decision: 'allow', reason: 'All boundaries passed', processingTimeMs: 0 };
  }

  /**
   * Check agent permissions
   */
  private checkPermissions(agent: Agent, request: ActionRequest): ActionDecision {
    // Find matching permission
    const permission = agent.permissions.find(p =>
      p.action === request.action &&
      (!p.resource || !request.resource || request.resource.includes(p.resource))
    );

    if (!permission) {
      return {
        requestId: request.id,
        decision: 'deny',
        reason: `No permission for action: ${request.action}`,
        processingTimeMs: 0,
      };
    }

    // Check conditions
    if (permission.conditions && permission.conditions.length > 0) {
      const conditionResults = this.evaluateConditions(permission.conditions, request);

      if (!conditionResults.allPassed) {
        return {
          requestId: request.id,
          decision: 'deny',
          reason: 'Permission conditions not met',
          conditions: conditionResults.failed,
          processingTimeMs: 0,
        };
      }
    }

    // Return decision based on permission
    switch (permission.decision) {
      case 'allow':
        return {
          requestId: request.id,
          decision: 'allow',
          reason: 'Permission granted',
          processingTimeMs: 0,
        };

      case 'deny':
        return {
          requestId: request.id,
          decision: 'deny',
          reason: 'Permission denied',
          processingTimeMs: 0,
        };

      case 'review':
        return {
          requestId: request.id,
          decision: 'review',
          reason: 'Action requires review',
          requiresApproval: true,
          approverRole: 'compliance_officer',
          processingTimeMs: 0,
        };

      case 'block':
        return {
          requestId: request.id,
          decision: 'block',
          reason: 'Action is blocked by policy',
          processingTimeMs: 0,
        };

      default:
        return {
          requestId: request.id,
          decision: 'review',
          reason: 'Unknown permission decision',
          requiresApproval: true,
          processingTimeMs: 0,
        };
    }
  }

  /**
   * Evaluate permission conditions
   */
  private evaluateConditions(
    conditions: PermissionCondition[],
    request: ActionRequest
  ): { allPassed: boolean; failed?: ActionDecision['conditions'] } {
    const failed: ActionDecision['conditions'] = [];

    for (const condition of conditions) {
      const actual = this.getFieldValue(request, condition.field);

      let passed = false;
      switch (condition.operator) {
        case 'equals':
          passed = actual === condition.value;
          break;
        case 'contains':
          passed = String(actual).includes(String(condition.value));
          break;
        case 'in':
          passed = Array.isArray(condition.value) && condition.value.includes(actual);
          break;
        case 'greater_than':
          passed = Number(actual) > Number(condition.value);
          break;
        case 'less_than':
          passed = Number(actual) < Number(condition.value);
          break;
      }

      if (!passed) {
        failed.push({
          field: condition.field,
          value: condition.value,
          actual,
        });
      }
    }

    return { allPassed: failed.length === 0, failed: failed.length > 0 ? failed : undefined };
  }

  /**
   * Get field value from request
   */
  private getFieldValue(request: ActionRequest, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = request;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Update agent permissions
   */
  updateAgentPermissions(agentId: string, permissions: AgentPermission[]): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.permissions = permissions;
    agent.updatedAt = new Date();
    return true;
  }

  /**
   * Update agent boundaries
   */
  updateAgentBoundaries(agentId: string, boundaries: AgentBoundary[]): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.boundaries = boundaries;
    agent.updatedAt = new Date();
    return true;
  }

  /**
   * Suspend agent
   */
  suspendAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.status = 'suspended';
    agent.updatedAt = new Date();
    return true;
  }

  /**
   * Activate agent
   */
  activateAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.status = 'active';
    agent.updatedAt = new Date();
    return true;
  }
}

// Singleton
export const permissionEngine = new PermissionEngine();
