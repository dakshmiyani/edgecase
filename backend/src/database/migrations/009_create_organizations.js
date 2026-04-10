/**
 * Migration 009: Organizations (Brands) table
 * 
 * Supports multi-tenancy by allowing multiple Brands to operate on the platform.
 */
export async function up(knex) {
  await knex.schema.createTable('organizations', (t) => {
    t.increments('id').primary();
    t.string('org_token_id', 32).unique().notNullable();
    t.string('name', 255).notNullable();
    t.string('slug', 255).unique().notNullable();
    t.string('status', 16).defaultTo('active');
    t.timestamps(true, true);

    t.index('org_token_id');
    t.index('slug');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('organizations');
}
