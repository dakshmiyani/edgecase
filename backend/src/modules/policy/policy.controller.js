import policyService from '../policy/policy.service.js';

/**
 * GET /policy/rules
 * List all active security rules.
 */
export async function getRules(req, res) {
  try {
    const rules = await policyService.getRules();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
}

/**
 * POST /policy/rules
 * Create a new security rule.
 */
export async function createRule(req, res) {
  try {
    const adminTokenId = req.user.user_token_id;
    const rule = await policyService.createRule(adminTokenId, req.body);
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /policy/rules/:rule_id
 * Update an existing security rule.
 */
export async function updateRule(req, res) {
  try {
    const adminTokenId = req.user.user_token_id;
    const rule = await policyService.updateRule(adminTokenId, req.params.rule_id, req.body);
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /policy/rules/:rule_id
 * Soft delete a security rule.
 */
export async function deleteRule(req, res) {
  try {
    const adminTokenId = req.user.user_token_id;
    await policyService.deleteRule(adminTokenId, req.params.rule_id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
