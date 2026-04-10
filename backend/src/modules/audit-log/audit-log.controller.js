import { getUserLogs, getLogExplanation } from '../audit-log/access-audit.service.js';

/**
 * GET /audit/logs
 * Paginated, filterable audit log for the authenticated user.
 */
export async function getAuditLogs(req, res) {
  try {
    const userTokenId = req.user.user_token_id;
    const {
      page = 1,
      limit = 20,
      merchant = null,
      date_from = null,
      date_to = null,
    } = req.query;

    const { logs, total } = await getUserLogs(userTokenId, {
      page: parseInt(page),
      limit: parseInt(limit),
      merchant,
      dateFrom: date_from,
      dateTo: date_to,
    });

    res.json({
      logs: logs.map((l) => ({
        id: l._id,
        merchant_token: l.merchant_token_id,
        action: l.action,
        fields: l.fields,
        timestamp: l.timestamp,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    });
  } catch (err) {
    console.error('Audit logs error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
}

/**
 * GET /audit/:log_id/explain
 * Plain-language explanation of an access event.
 */
export async function explainLog(req, res) {
  try {
    const { log_id } = req.params;

    const result = await getLogExplanation(log_id);
    if (!result) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    // Verify the log belongs to the requesting user
    if (result.user_token_id !== req.user.user_token_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json({
      id: result._id,
      action: result.action,
      merchant_token: result.merchant_token_id,
      fields: result.fields,
      timestamp: result.timestamp,
      explanation: result.explanation,
    });
  } catch (err) {
    console.error('Explain log error:', err.message);
    res.status(500).json({ error: 'Failed to explain access' });
  }
}
