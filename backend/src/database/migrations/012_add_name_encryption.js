/**
 * Migration 012: Add encrypted name columns to users table.
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.text('name_cipher').nullable();
    t.string('name_iv', 32).nullable();
    t.string('name_tag', 32).nullable();
    t.string('name_hash', 128).nullable();

    t.index('name_hash');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('name_cipher');
    t.dropColumn('name_iv');
    t.dropColumn('name_tag');
    t.dropColumn('name_hash');
  });
}
