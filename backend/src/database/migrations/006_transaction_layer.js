/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // Drop old transactions table if it exists
  await knex.schema.dropTableIfExists('transactions');

  // Create new transactions table with strict UUID primary key
  await knex.schema.createTable('transactions', (t) => {
    t.uuid('txn_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('user_token_id', 32).notNullable()
      .references('user_token_id').inTable('users').onDelete('CASCADE');
    t.decimal('amount', 12, 2).notNullable();
    t.string('status', 16).notNullable().defaultTo('INITIATED'); // INITIATED, PENDING, SUCCESS, FAILED, BLOCKED
    t.string('gateway_order_id', 64).unique();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());

    t.index('user_token_id');
    t.index('gateway_order_id');
  });

  // Create idempotency table
  await knex.schema.createTable('idempotency', (t) => {
    t.uuid('txn_id').primary().references('txn_id').inTable('transactions').onDelete('CASCADE');
    t.string('request_hash', 128).notNullable().unique();
    t.jsonb('response');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('idempotency');
  await knex.schema.dropTableIfExists('transactions');

  // Re-create the old table (rollback scenario)
  await knex.schema.createTable('transactions', (t) => {
    t.increments('id').primary();
    t.string('user_token_id', 32).notNullable()
      .references('user_token_id').inTable('users').onDelete('CASCADE');
    t.string('merchant_token_id', 32).notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.string('category', 64);
    t.string('status', 16).defaultTo('completed');
    t.timestamp('transaction_at').defaultTo(knex.fn.now());

    t.index('user_token_id');
    t.index('merchant_token_id');
  });
}
