const { db } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
  const trx = await db.transaction();
  try {
    console.log('🚀 Starting Multi-Tenant Migration...');

    // 1. Create businesses table
    const hasBusinesses = await trx.schema.hasTable('businesses');
    if (!hasBusinesses) {
      await trx.schema.createTable('businesses', table => {
        table.uuid('id').primary();
        table.string('name').notNullable();
        table.string('owner_email').notNullable().unique();
        table.timestamps(true, true);
      });
      console.log('✅ Created "businesses" table.');
    }

    // 2. Create Default Tenant
    let defaultBusiness = await trx('businesses').first();
    if (!defaultBusiness) {
      defaultBusiness = {
        id: uuidv4(),
        name: 'Zion Grocery',
        owner_email: 'admin@zion.com',
        created_at: new Date(),
        updated_at: new Date()
      };
      await trx('businesses').insert(defaultBusiness);
      console.log('✅ Created default tenant: Zion Grocery.');
    } else {
      console.log('ℹ️ Default tenant already exists.');
    }

    // 3. Add business_id to all tables
    const tablesToMigrate = ['products', 'sales', 'expenses', 'debts'];
    
    // Note: debt_payments might not exist or might need migration too.
    for (const tableName of tablesToMigrate) {
      const hasTable = await trx.schema.hasTable(tableName);
      if (hasTable) {
        const hasColumn = await trx.schema.hasColumn(tableName, 'business_id');
        if (!hasColumn) {
          // Add column nullable first
          await trx.schema.alterTable(tableName, table => {
            table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE');
          });
          
          // Update existing records to belong to default tenant
          await trx(tableName).update({ business_id: defaultBusiness.id });
          
          // Alter column to be NOT NULL
          await trx.schema.alterTable(tableName, table => {
            table.uuid('business_id').notNullable().alter();
          });
          
          console.log(`✅ Added foreign key business_id to "${tableName}".`);
        } else {
          console.log(`ℹ️ Column business_id already exists in "${tableName}".`);
        }
      }
    }

    // Check debt_payments if it exists
    const hasDebtPmt = await trx.schema.hasTable('debt_payments');
    if (hasDebtPmt) {
      const hasBizId = await trx.schema.hasColumn('debt_payments', 'business_id');
      if (!hasBizId) {
        await trx.schema.alterTable('debt_payments', table => table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE'));
        await trx('debt_payments').update({ business_id: defaultBusiness.id });
        await trx.schema.alterTable('debt_payments', table => table.uuid('business_id').notNullable().alter());
        console.log('✅ Added foreign key business_id to "debt_payments".');
      }
    }

    await trx.commit();
    console.log('🎉 Multi-Tenant Migration COMPLETE.');
  } catch (err) {
    await trx.rollback();
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
