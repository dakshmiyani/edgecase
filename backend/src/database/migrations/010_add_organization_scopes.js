/**
 * Migration 010: Add organization scoping to existing tables.
 * 
 * Scopes users, transactions, and API keys to a specific organization for multi-tenancy.
 */
export async function up(knex) {
  // 1. Create a Default Organization for legacy data
  const [defaultOrg] = await knex('organizations').insert({
    org_token_id: 'org_default001',
    name: 'SecureAiPay Default Brand',
    slug: 'default-brand'
  }).returning('id');

  const orgId = defaultOrg.id || defaultOrg; // Handle knex variety in return types

  // 2. Add organization_id to users
  await knex.schema.alterTable('users', (t) => {
    t.integer('organization_id').unsigned()
      .references('id').inTable('organizations')
      .onDelete('CASCADE');
  });
  // Assign all current users to default org
  await knex('users').update({ organization_id: orgId });
  // Make it non-nullable for future
  await knex.schema.alterTable('users', (t) => {
    t.integer('organization_id').unsigned().notNullable().alter();
  });

  // 3. Add organization_id to transactions
  await knex.schema.alterTable('transactions', (t) => {
    t.integer('organization_id').unsigned()
      .references('id').inTable('organizations')
      .onDelete('CASCADE');
  });
  await knex('transactions').update({ organization_id: orgId });
  await knex.schema.alterTable('transactions', (t) => {
    t.integer('organization_id').unsigned().notNullable().alter();
  });

  // 4. Add organization_id to api_keys
  await knex.schema.alterTable('api_keys', (t) => {
    t.integer('organization_id').unsigned()
      .references('id').inTable('organizations')
      .onDelete('CASCADE');
  });
  await knex('api_keys').update({ organization_id: orgId });
  await knex.schema.alterTable('api_keys', (t) => {
    t.integer('organization_id').unsigned().notNullable().alter();
  });

  // 5. Add organization_id to merchant_customer_mappings
  // First check if table exists
  const hasMappings = await knex.schema.hasTable('merchant_customer_mappings');
  if (hasMappings) {
    await knex.schema.alterTable('merchant_customer_mappings', (t) => {
      t.integer('organization_id').unsigned()
        .references('id').inTable('organizations')
        .onDelete('CASCADE');
    });
    await knex('merchant_customer_mappings').update({ organization_id: orgId });
    await knex.schema.alterTable('merchant_customer_mappings', (t) => {
      t.integer('organization_id').unsigned().notNullable().alter();
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => t.dropColumn('organization_id'));
  await knex.schema.alterTable('transactions', (t) => t.dropColumn('organization_id'));
  await knex.schema.alterTable('api_keys', (t) => t.dropColumn('organization_id'));
  
  const hasMappings = await knex.schema.hasTable('merchant_customer_mappings');
  if (hasMappings) {
    await knex.schema.alterTable('merchant_customer_mappings', (t) => t.dropColumn('organization_id'));
  }
}
