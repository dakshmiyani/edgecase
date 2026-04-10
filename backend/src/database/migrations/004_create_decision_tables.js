/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // Rules table (Deterministic Policy Engine)
  await knex.schema.createTable('rules', (t) => {
    t.uuid('rule_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable().unique();
    t.jsonb('condition').notNullable();
    t.string('action', 20).notNullable(); // ALLOW, OTP, BLOCK
    t.integer('priority').notNullable().defaultTo(10);
    t.boolean('is_active').defaultTo(true);
    t.string('created_by', 100);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Decisions audit table
  await knex.schema.createTable('decisions', (t) => {
    t.uuid('txn_id').primary();
    t.string('user_token_id', 50).notNullable();
    t.string('merchant_token_id', 50);
    t.integer('fraud_score');
    t.string('decision', 10).notNullable(); // ALLOW, OTP, BLOCK
    t.text('reason');
    t.jsonb('triggered_rules');
    t.string('mode', 20).defaultTo('NORMAL');
    t.string('friction', 20);
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('user_token_id');
    t.index('created_at');
  });

  // Policy audit table
  await knex.schema.createTable('policy_audit', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('admin_token_id', 100).notNullable();
    t.uuid('rule_id').notNullable();
    t.string('action', 20).notNullable(); // CREATE, UPDATE, DELETE
    t.timestamp('timestamp').defaultTo(knex.fn.now());
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('policy_audit');
  await knex.schema.dropTableIfExists('decisions');
  await knex.schema.dropTableIfExists('rules');
}
