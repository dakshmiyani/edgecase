/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
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

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('transactions');
}
