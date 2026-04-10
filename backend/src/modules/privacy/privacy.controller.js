import { pg } from '../../config/db.js';
import { AccessEvent } from '../audit-log/access-audit.model.js';
import { logAccess } from '../audit-log/access-audit.service.js';

/**
 * GET /user/privacy
 * Full privacy dashboard data: score, exposure, access log.
 */
export async function getPrivacyDashboard(req, res) {
  try {
    const userTokenId = req.user.user_token_id;

    // Get recent access events (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [recentAccess, allAccess, merchantCount] = await Promise.all([
      AccessEvent.find({
        user_token_id: userTokenId,
        merchant_token_id: { $ne: null },
        timestamp: { $gte: thirtyDaysAgo },
      })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),

      AccessEvent.find({
        user_token_id: userTokenId,
        merchant_token_id: { $ne: null },
      }).lean(),

      AccessEvent.distinct('merchant_token_id', {
        user_token_id: userTokenId,
        merchant_token_id: { $ne: null },
      }),
    ]);

    // Compute privacy score
    const totalAccess = allAccess.length;
    const uniqueMerchants = merchantCount.length;
    const recentAnomalies = allAccess.filter((a) => {
      const hourAgo = new Date(Date.now() - 3600 * 1000);
      return a.timestamp >= hourAgo;
    }).length;

    // Score formula: start at 100, deduct for exposure
    let score = 100;
    score -= Math.min(uniqueMerchants * 3, 20);    // -3 per merchant, max -20
    score -= Math.min(totalAccess * 0.5, 30);       // -0.5 per access, max -30
    score -= Math.min(recentAnomalies * 5, 25);     // -5 per recent anomaly, max -25

    // Collect exposed fields
    const fieldMap = {};
    for (const event of allAccess) {
      for (const field of (event.fields || [])) {
        if (!fieldMap[field]) {
          fieldMap[field] = { field, last_accessed: event.timestamp, merchant_count: new Set() };
        }
        if (event.timestamp > fieldMap[field].last_accessed) {
          fieldMap[field].last_accessed = event.timestamp;
        }
        if (event.merchant_token_id) {
          fieldMap[field].merchant_count.add(event.merchant_token_id);
        }
      }
    }

    const exposedFields = Object.values(fieldMap).map((f) => ({
      field: f.field,
      last_accessed: f.last_accessed,
      merchant_count: f.merchant_count.size,
    }));

    // Determine exposure level
    let dataExposure = 'LOW';
    if (score < 50) dataExposure = 'HIGH';
    else if (score < 80) dataExposure = 'MEDIUM';

    score = Math.max(0, Math.round(score));

    const accessLog = recentAccess.map((a) => ({
      merchant_token: a.merchant_token_id,
      accessed_at: a.timestamp,
      fields: a.fields || [],
    }));

    res.json({
      privacy_score: score,
      data_exposure: dataExposure,
      access_log: accessLog,
      exposed_fields: exposedFields,
    });
  } catch (err) {
    console.error('Privacy dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load privacy dashboard' });
  }
}

/**
 * PATCH /user/privacy/revoke
 * Revoke a merchant's access to a specific data field.
 */
export async function revokeFieldAccess(req, res) {
  try {
    const userTokenId = req.user.user_token_id;
    const { field } = req.body;

    // Log the revocation
    await logAccess({
      user_token_id: userTokenId,
      action: 'REVOKE',
      fields: [field],
      ip: req.ip,
      explanation: `User revoked access to ${field}`,
    });

    res.json({
      message: `Access to ${field} revoked`,
      field,
    });
  } catch (err) {
    console.error('Revoke error:', err.message);
    res.status(500).json({ error: 'Revocation failed' });
  }
}
