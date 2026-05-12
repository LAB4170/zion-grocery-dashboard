
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('support_tickets', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE').notNullable();
      table.string('subject').notNullable();
      table.text('description').notNullable();
      table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
      table.string('category').defaultTo('general');
      table.timestamps(true, true);
      
      table.index(['business_id', 'status']);
    })
    .createTable('support_messages', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('ticket_id').references('id').inTable('support_tickets').onDelete('CASCADE').notNullable();
      table.string('sender_id').notNullable(); // UID of user or 'admin'
      table.string('sender_role').notNullable(); // 'user' or 'admin'
      table.text('content').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index(['ticket_id', 'created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('support_messages')
    .dropTableIfExists('support_tickets');
};
