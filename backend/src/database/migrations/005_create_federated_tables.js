/**
 * Migration 005 — Federated Learning Tables
 */
export function up(knex) {
  return knex.schema
    .createTable('fl_rounds', (table) => {
      table.uuid('round_id').primary();
      table.string('status', 20).checkIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABORTED']);
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.integer('node_count');
      table.integer('updates_received');
      table.integer('updates_rejected');
      table.integer('global_model_version'); // Self-reference to fl_model_versions (added later)
      table.text('abort_reason');
    })
    .createTable('fl_model_versions', (table) => {
      table.uuid('model_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('version').notNullable().unique();
      table.string('file_path', 255).notNullable();
      table.float('accuracy');
      table.float('precision_score');
      table.float('recall');
      table.float('f1_score');
      table.float('auc_roc');
      table.uuid('round_id').references('round_id').inTable('fl_rounds');
      table.integer('node_count');
      table.boolean('is_active').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('fl_nodes', (table) => {
      table.string('node_id', 50).primary();
      table.string('api_key_hash', 255).notNullable();
      table.integer('data_size');
      table.float('participation_weight');
      table.integer('total_rounds_participated').defaultTo(0);
      table.timestamp('last_seen');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('registered_at').defaultTo(knex.fn.now());
    })
    .createTable('fl_update_logs', (table) => {
      table.uuid('log_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('round_id').references('round_id').inTable('fl_rounds');
      table.string('node_id', 50).references('node_id').inTable('fl_nodes');
      table.string('status', 30).checkIn(['RECEIVED', 'VALIDATED', 'REJECTED_KRUM', 'REJECTED_INTEGRITY', 'AGGREGATED']);
      table.float('local_accuracy');
      table.float('local_auc_roc');
      table.integer('data_size');
      table.integer('update_size_bytes');
      table.timestamp('submitted_at').defaultTo(knex.fn.now());
    })
    .createTable('fl_notifications', (table) => {
        table.uuid('notification_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('type', 50);
        table.string('severity', 20);
        table.text('message');
        table.jsonb('metadata');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('fl_update_logs')
    .dropTableIfExists('fl_model_versions')
    .dropTableIfExists('fl_rounds')
    .dropTableIfExists('fl_nodes')
    .dropTableIfExists('fl_notifications');
}
