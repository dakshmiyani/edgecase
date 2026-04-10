/**
 * Generate CSV content from audit log data.
 * Only includes tokens and timestamps — never raw PII.
 *
 * @param {Array} logs - Array of audit log objects
 * @returns {string} CSV content
 */
export function generateAuditCSV(logs) {
  const headers = ['Timestamp', 'Merchant Token', 'Action', 'Fields Accessed'];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.merchant_token || 'N/A',
    log.action,
    (log.fields || []).join('; '),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csv;
}

/**
 * Download CSV as a file.
 * @param {string} csv - CSV content
 * @param {string} filename - Output filename
 */
export function downloadCSV(csv, filename = 'audit_log.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
