import * as apiKeyService from '../security/apiKey.service.js';

/**
 * List all API keys for the current user's organization
 */
export async function getKeys(req, res) {
  try {
    const keys = await apiKeyService.listApiKeys(req.user.org_id);
    res.json(keys);
  } catch (err) {
    console.error('Failed to list API keys:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate a new API key
 */
export async function createKey(req, res) {
  const { name, type } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const newKey = await apiKeyService.generateApiKey(
      req.user.user_token_id, 
      req.user.org_id,
      name, 
      type || 'live'
    );
    res.status(201).json(newKey);
  } catch (err) {
    console.error('Failed to create API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Revoke an API key
 */
export async function revokeKey(req, res) {
  const { id } = req.params;

  try {
    const revoked = await apiKeyService.revokeApiKey(id, req.user.org_id);
    if (!revoked) {
      return res.status(404).json({ error: 'Key not found or already revoked' });
    }
    res.json({ message: 'API Key revoked' });
  } catch (err) {
    console.error('Failed to revoke API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
