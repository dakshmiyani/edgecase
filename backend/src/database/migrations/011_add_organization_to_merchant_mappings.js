/**
 * Migration 011: Add organization scoping to merchant_mappings.
 */
export async function up(knex) {
  // Get default org ID to backfill
  const defaultOrg = await knex('organizations')
    .where({ org_token_id: 'org_default001' })
    .select('id')
    .first();

  const orgId = defaultOrg ? defaultOrg.id : null;

  const hasMappings = await knex.schema.hasTable('merchant_mappings');
  
  if (hasMappings && orgId) {
    // 1. Add nullable column
    await knex.schema.alterTable('merchant_mappings', (t) => {
      t.integer('organization_id').unsigned()
        .references('id').inTable('organizations')
        .onDelete('CASCADE');
    });

    // 2. Backfill existing row
    await knex('merchant_mappings').update({ organization_id: orgId });

    // 3. Make not nullable
    await knex.schema.alterTable('merchant_mappings', (t) => {
      t.integer('organization_id').unsigned().notNullable().alter();
    });
  }
}

export async function down(knex) {
  const hasMappings = await knex.schema.hasTable('merchant_mappings');
  if (hasMappings) {
    await knex.schema.alterTable('merchant_mappings', (t) => t.dropColumn('organization_id'));
  }
}
