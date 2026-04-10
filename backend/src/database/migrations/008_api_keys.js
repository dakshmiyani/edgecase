/**
 * Migration 008: API Keys table
 *
 * Allows admin/merchant to generate Stripe-style API keys.
 * Only the SHA-256 hash of the key is stored — the raw key is shown once.
 */
export async function up(knex) {
  await knex.schema.createTable('api_keys', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Owner of the key (admin or merchant user_token_id)
    t.string('user_token_id', 32).notNullable()
      .references('user_token_id').inTable('users').onDelete('CASCADE');

    // e.g. "sap_live_AbCdEfGh" — prefix shown in dashboard for identification
    t.string('key_prefix', 24).notNullable();

    // SHA-256 hash of the full key — NEVER store the raw key
    t.string('key_hash', 64).notNullable().unique();

    // Human label e.g. "Production Key", "ShopEasy Integration"
    t.string('name', 100).notNullable().defaultTo('Default Key');

    // 'live' | 'test'
    t.string('type', 8).notNullable().defaultTo('live');

    // JSON array of scopes e.g. ['transactions:read', 'users:read', 'merchant:read']
    t.jsonb('scopes').notNullable().defaultTo(JSON.stringify(['transactions:read', 'merchant:read']));

    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_used_at').nullable();
    t.timestamp('expires_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('user_token_id');
    t.index('key_hash');    // fast lookup on every API request
    t.index('key_prefix'); // for display search
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('api_keys');
}
