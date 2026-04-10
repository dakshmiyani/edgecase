/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('merchant_mappings', (t) => {
    t.increments('id').primary();
    t.string('merchant_token_id', 32).notNullable();
    t.string('user_token_id', 32).notNullable()
      .references('user_token_id').inTable('users').onDelete('CASCADE');
    t.string('merchant_user_id', 128).notNullable();
    t.timestamp('linked_at').defaultTo(knex.fn.now());
    t.boolean('is_active').defaultTo(true);
    t.unique(['merchant_token_id', 'user_token_id']);

    t.index('merchant_token_id');
    t.index('user_token_id');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('merchant_mappings');
}
