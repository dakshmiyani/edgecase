import { Engine } from 'json-rules-engine';
import redis from '../../redis/redis.client.js';
import { pg } from '../../config/db.js';
import { nanoid } from 'nanoid';

class DecisionService {
  constructor() {
    this.engine = new Engine();
    this.rulesLoaded = false;
  }

  /**
   * Load active rules from DB or Cache.
   */
  async loadRules() {
    try {
      // 1. Check Redis for active rules
      const cachedRules = await redis.get('rules:active');
      let rules;

      if (cachedRules) {
        rules = JSON.parse(cachedRules);
      } else {
        // 2. Fetch from PostgreSQL
        rules = await pg('rules').where({ is_active: true }).orderBy('priority', 'desc');
        // 3. Cache in Redis for 300s
        await redis.set('rules:active', JSON.stringify(rules), 'EX', 300);
      }

      // 4. Update Engine
      this.engine = new Engine(); // Clear existing rules
      rules.forEach(r => {
        this.engine.addRule({
          name: r.name,
          priority: r.priority,
          conditions: r.condition,
          event: {
            type: r.action,
            params: { reason: r.name }
          }
        });
      });

      this.rulesLoaded = true;
      return rules;
    } catch (err) {
      console.error('❌ Failed to load rules into engine:', err.message);
      throw err;
    }
  }

  /**
   * Evaluate decision based on facts.
   * facts: { user_token_id, fraud_score, amount, device, location_changed, merchant_token_id, ai_available }
   */
  async evaluate(facts) {
    const txn_id = `dec_${nanoid(12)}`;
    const startTime = Date.now();

    try {
      // 1. Deduplication Cache (Check recent decision for this user in last 60s)
      const cacheKey = `decision:${facts.user_token_id}:latest`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        const result = JSON.parse(cached);
        return { ...result, txn_id, cache_hit: true };
      }

      // 2. Ensure rules are loaded
      if (!this.rulesLoaded) await this.loadRules();

      // 3. Trusted Merchant Bypass?
      let effectiveScore = facts.fraud_score;
      const isTrusted = await redis.sismember('trusted_merchants', facts.merchant_token_id);
      if (isTrusted) {
        effectiveScore = Math.max(0, effectiveScore - 15);
      }

      // 4. Run Json-Rules-Engine
      const engineFacts = {
        ...facts,
        fraud_score: effectiveScore
      };

      const { events, results } = await this.engine.run(engineFacts);

      // 5. Conflict Resolution: BLOCK > OTP > ALLOW (Strictest wins)
      let finalDecision = 'ALLOW';
      let finalReason = 'Normal behavior';
      
      const triggeredRules = events.map(e => ({
        rule: e.type,
        reason: e.params.reason
      }));

      const actions = events.map(e => e.type);
      
      if (actions.includes('BLOCK')) {
        finalDecision = 'BLOCK';
      } else if (actions.includes('OTP')) {
        finalDecision = 'OTP';
      }

      // 6. Combinatorial Logic (e.g. 2+ context rules + Medium score -> BLOCK)
      // Note: This can be handled internally via rule conditions, but we can also add logic here if needed.
      
      // 7. Cap Trusted Merchant at OTP
      if (isTrusted && finalDecision === 'BLOCK') {
        finalDecision = 'OTP';
        finalReason = `Trusted Merchant Bypass: Block downgraded to OTP for merchant ${facts.merchant_token_id}`;
      }

      // 8. Reason Construction
      if (events.length > 0) {
        finalReason = events.map(e => e.params.reason).join(' + ');
      }

      const response = {
        decision: finalDecision,
        reason: finalReason,
        fraud_score: facts.fraud_score,
        txn_id,
        triggered_rules: events.map(e => e.name || e.type),
        latency_ms: Date.now() - startTime,
        friction: finalDecision === 'BLOCK' ? 'HARD_BLOCK' : (finalDecision === 'OTP' ? 'OTP' : 'NONE'),
        otp_expires_in: finalDecision === 'OTP' ? 300 : null
      };

      // 9. Cache Recent Decision
      await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);

      return response;

    } catch (err) {
      console.error('❌ Decision Engine Error:', err.message);
      // SAFE DEFAULT
      return {
        decision: 'OTP',
        reason: 'System uncertainty — safe default',
        fraud_score: facts.fraud_score,
        txn_id,
        mode: 'SAFE_DEFAULT',
        friction: 'OTP',
        latency_ms: Date.now() - startTime
      };
    }
  }
}

export default new DecisionService();
