import { pg } from '../../config/db.js';
import redis from '../../redis/redis.client.js';
import decisionService from '../decision/decision.service.js';

class PolicyService {
  /**
   * Get all active rules (cached primary).
   */
  async getRules() {
    return await decisionService.loadRules();
  }

  /**
   * Create a new rule.
   */
  async createRule(adminTokenId, data) {
    const [rule] = await pg('rules').insert({
      name: data.name,
      condition: JSON.stringify(data.condition),
      action: data.action,
      priority: data.priority || 10,
      created_by: adminTokenId,
    }).returning('*');

    // Audit
    await pg('policy_audit').insert({
      admin_token_id: adminTokenId,
      rule_id: rule.rule_id,
      action: 'CREATE',
    });

    // Invalidate Cache
    await this.invalidateCache();
    
    return rule;
  }

  /**
   * Update an existing rule.
   */
  async updateRule(adminTokenId, ruleId, data) {
    const updateData = { ...data, updated_at: pg.fn.now() };
    if (data.condition) updateData.condition = JSON.stringify(data.condition);

    const [rule] = await pg('rules')
      .where({ rule_id: ruleId })
      .update(updateData)
      .returning('*');

    if (!rule) throw new Error('Rule not found');

    // Audit
    await pg('policy_audit').insert({
      admin_token_id: adminTokenId,
      rule_id: ruleId,
      action: 'UPDATE',
    });

    // Invalidate Cache
    await this.invalidateCache();
    
    return rule;
  }

  /**
   * Soft delete a rule.
   */
  async deleteRule(adminTokenId, ruleId) {
    await pg('rules')
      .where({ rule_id: ruleId })
      .update({ is_active: false, updated_at: pg.fn.now() });

    // Audit
    await pg('policy_audit').insert({
      admin_token_id: adminTokenId,
      rule_id: ruleId,
      action: 'DELETE',
    });

    // Invalidate Cache
    await this.invalidateCache();
  }

  /**
   * Invalidate rules cache to force reload on next evaluation.
   */
  async invalidateCache() {
    await redis.del('rules:active');
    // We also reload it immediately to keep the engine hot
    await decisionService.loadRules();
  }
}

export default new PolicyService();
