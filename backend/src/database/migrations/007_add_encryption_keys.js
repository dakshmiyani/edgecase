/**
 * Migration 007: Add per-user encryption key column to users table.
 *
 * Stores WRAPPED (master-key-encrypted) User Encryption Key (UEK).
 * Raw keys are NEVER stored. Even with full DB access, data is unreadable
 * without the ENCRYPTION_MASTER_KEY env variable.
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    // Stores base64-encoded AES-256-GCM encrypted UEK (wrapped by master key)
    t.text('encryption_key').nullable();
  });

  // Also encrypt the amount field in transactions table (store as text)
  await knex.schema.alterTable('transactions', (t) => {
    // Add encrypted_amount column. We keep 'amount' for now for gateway compat.
    t.text('encrypted_amount').nullable();
    t.text('encrypted_meta').nullable(); // For future encrypted metadata
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('encryption_key');
  });

  await knex.schema.alterTable('transactions', (t) => {
    t.dropColumn('encrypted_amount');
    t.dropColumn('encrypted_meta');
  });
}
