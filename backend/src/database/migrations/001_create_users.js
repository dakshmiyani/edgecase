/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('user_token_id', 32).unique().notNullable();
    t.text('email_cipher').notNullable();
    t.string('email_iv', 32).notNullable();
    t.string('email_tag', 32).notNullable();
    t.string('email_hash', 128).notNullable();
    t.text('phone_cipher').notNullable();
    t.string('phone_iv', 32).notNullable();
    t.string('phone_tag', 32).notNullable();
    t.string('phone_hash', 128).notNullable();
    t.string('role', 16).defaultTo('user');
    t.boolean('is_deleted').defaultTo(false);
    t.timestamps(true, true);

    t.index('email_hash');
    t.index('phone_hash');
    t.index('user_token_id');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
