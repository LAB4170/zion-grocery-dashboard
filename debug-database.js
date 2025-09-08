// debug-database.js - Comprehensive Database Debugging Script for Zion Grocery Dashboard
const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Import knexfile configuration
const knexConfig = require('./backend/knexfile.js');
const environment = process.env.NODE_ENV || 'development';

console.log(`🔧 Starting database debugging for ${environment} environment...`);
console.log(`📍 Current working directory: ${process.cwd()}`);
console.log(`📅 Debug started at: ${new Date().toISOString()}`);

async function debugDatabase() {
  let db;
  
  try {
    // Step 1: Check environment variables
    console.log('\n1️⃣ CHECKING ENVIRONMENT VARIABLES:');
    console.log('NODE_ENV:', process.env.NODE_ENV || '❌ Not set');
    console.log('LOCAL_DATABASE_URL:', process.env.LOCAL_DATABASE_URL ? '✅ Set' : '❌ Not set');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set (Production)' : '❌ Not set');
    console.log('PORT:', process.env.PORT || '❌ Not set');
    
    if (process.env.LOCAL_DATABASE_URL) {
      console.log('Local DB URL:', process.env.LOCAL_DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
    }

    // Step 2: Check knex configuration
    console.log('\n2️⃣ CHECKING KNEX CONFIGURATION:');
    console.log('Config exists:', knexConfig ? '✅' : '❌');
    console.log('Environment config:', knexConfig[environment] ? '✅' : '❌');
    
    if (knexConfig[environment]) {
      const config = knexConfig[environment];
      console.log('Database client:', config.client);
      console.log('Connection type:', typeof config.connection);
      console.log('Pool config:', config.pool ? '✅' : '❌');
      console.log('Migrations config:', config.migrations ? '✅' : '❌');
    }

    // Step 3: Initialize Knex
    console.log('\n3️⃣ INITIALIZING KNEX CONNECTION:');
    try {
      db = knex(knexConfig[environment]);
      console.log('✅ Knex instance created successfully');
    } catch (error) {
      console.log('❌ Failed to create Knex instance:', error.message);
      return;
    }

    // Step 4: Test basic connection
    console.log('\n4️⃣ TESTING DATABASE CONNECTION:');
    try {
      const result = await db.raw('SELECT NOW() as current_time, version() as version, current_database() as db_name');
      console.log('✅ Database connection successful');
      console.log('📅 Current time:', result.rows[0].current_time);
      console.log('🗂️ PostgreSQL version:', result.rows[0].version.split(' ')[0]);
      console.log('📊 Connected to database:', result.rows[0].db_name);
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.detail || 'No additional details');
      
      // Provide specific troubleshooting based on error
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 TROUBLESHOOTING - Connection Refused:');
        console.log('   1. PostgreSQL service is not running');
        console.log('   2. Run: net start postgresql-x64-14 (Windows)');
        console.log('   3. Or: sudo systemctl start postgresql (Linux)');
      } else if (error.code === '3D000') {
        console.log('\n💡 TROUBLESHOOTING - Database Does Not Exist:');
        console.log('   1. Create database: createdb -U postgres zion_grocery_db');
        console.log('   2. Or connect to postgres and run: CREATE DATABASE zion_grocery_db;');
      } else if (error.code === '28P01') {
        console.log('\n💡 TROUBLESHOOTING - Authentication Failed:');
        console.log('   1. Check username/password in .env file');
        console.log('   2. Verify PostgreSQL user exists and has correct password');
      }
      return;
    }

    // Step 5: Check PostgreSQL extensions
    console.log('\n5️⃣ CHECKING POSTGRESQL EXTENSIONS:');
    try {
      const extensions = await db.raw('SELECT extname FROM pg_extension ORDER BY extname');
      const extNames = extensions.rows.map(e => e.extname);
      console.log('🔌 Installed extensions:', extNames.join(', '));
      
      if (extNames.includes('uuid-ossp')) {
        console.log('✅ uuid-ossp extension available');
        const uuidTest = await db.raw('SELECT uuid_generate_v4() as test_uuid');
        console.log('🆔 Test UUID generated:', uuidTest.rows[0].test_uuid);
      } else {
        console.log('❌ uuid-ossp extension not installed');
        console.log('Installing uuid-ossp extension...');
        try {
          await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
          console.log('✅ uuid-ossp extension installed successfully');
        } catch (extError) {
          console.log('❌ Failed to install uuid-ossp:', extError.message);
        }
      }
    } catch (error) {
      console.log('❌ Extension check failed:', error.message);
    }

    // Step 6: Check migrations status
    console.log('\n6️⃣ CHECKING MIGRATIONS STATUS:');
    try {
      const hasTable = await db.schema.hasTable('knex_migrations');
      if (hasTable) {
        const migrations = await db('knex_migrations').select('*').orderBy('batch', 'name');
        console.log('✅ Migrations table exists');
        console.log(`📜 Applied migrations: ${migrations.length}`);
        
        if (migrations.length > 0) {
          console.log('Migration history:');
          migrations.forEach((m, index) => {
            console.log(`  ${index + 1}. ${m.name} (batch: ${m.batch})`);
          });
        } else {
          console.log('⚠️  No migrations have been run yet');
        }
      } else {
        console.log('❌ Migrations table does not exist');
        console.log('💡 Run: cd backend && npm run migrate');
      }
    } catch (error) {
      console.log('❌ Migration check failed:', error.message);
    }

    // Step 7: Check main application tables
    console.log('\n7️⃣ CHECKING APPLICATION TABLES:');
    const requiredTables = ['users', 'products', 'sales', 'expenses', 'debts', 'debt_payments'];
    const tableStatus = {};
    
    for (const tableName of requiredTables) {
      try {
        const hasTable = await db.schema.hasTable(tableName);
        if (hasTable) {
          const count = await db(tableName).count('* as count').first();
          const columns = await db.raw(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = ? AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName]);
          
          tableStatus[tableName] = {
            exists: true,
            count: parseInt(count.count),
            columns: columns.rows.length
          };
          
          console.log(`✅ Table '${tableName}': ${count.count} records, ${columns.rows.length} columns`);
          
          // Show column details for critical tables
          if (['products', 'sales'].includes(tableName)) {
            console.log(`   Columns: ${columns.rows.map(c => `${c.column_name}(${c.data_type})`).join(', ')}`);
          }
        } else {
          tableStatus[tableName] = { exists: false };
          console.log(`❌ Table '${tableName}' does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${tableName}':`, error.message);
        tableStatus[tableName] = { exists: false, error: error.message };
      }
    }

    // Step 8: Test CRUD operations on products table
    console.log('\n8️⃣ TESTING CRUD OPERATIONS:');
    try {
      if (tableStatus.products?.exists) {
        console.log('Testing products table operations...');
        
        // Test INSERT
        const testProduct = {
          id: await db.raw('SELECT uuid_generate_v4() as id').then(r => r.rows[0].id),
          name: 'Debug Test Product',
          barcode: `DEBUG_${Date.now()}`,
          price: 1.00,
          stock_quantity: 1,
          category: 'Test',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        const [inserted] = await db('products').insert(testProduct).returning('*');
        console.log('✅ INSERT operation successful');
        console.log('🆔 Inserted product ID:', inserted.id);
        
        // Test SELECT
        const selected = await db('products').where('id', inserted.id).first();
        console.log('✅ SELECT operation successful');
        
        // Test UPDATE
        await db('products').where('id', inserted.id).update({ 
          name: 'Updated Debug Product',
          updated_at: new Date()
        });
        console.log('✅ UPDATE operation successful');
        
        // Test DELETE (cleanup)
        await db('products').where('id', inserted.id).del();
        console.log('✅ DELETE operation successful');
        console.log('🧹 Test product cleaned up');
        
      } else {
        console.log('❌ Cannot test CRUD - products table missing');
      }
    } catch (error) {
      console.log('❌ CRUD operations failed:', error.message);
      console.log('Error details:', error.detail || 'No additional details');
    }

    // Step 9: Test sales table structure and constraints
    console.log('\n9️⃣ TESTING SALES TABLE STRUCTURE:');
    try {
      if (tableStatus.sales?.exists) {
        // Check sales table constraints and indexes
        const constraints = await db.raw(`
          SELECT conname, contype, pg_get_constraintdef(oid) as definition
          FROM pg_constraint 
          WHERE conrelid = 'sales'::regclass
        `);
        
        console.log('✅ Sales table constraints:');
        constraints.rows.forEach(c => {
          console.log(`   ${c.conname} (${c.contype}): ${c.definition}`);
        });
        
        // Check for foreign key relationships
        const foreignKeys = await db.raw(`
          SELECT 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name='sales'
        `);
        
        if (foreignKeys.rows.length > 0) {
          console.log('✅ Foreign key relationships:');
          foreignKeys.rows.forEach(fk => {
            console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
        
      } else {
        console.log('❌ Cannot analyze sales table - table missing');
      }
    } catch (error) {
      console.log('❌ Sales table analysis failed:', error.message);
    }

    // Step 10: Test transaction capabilities
    console.log('\n🔟 TESTING TRANSACTION CAPABILITIES:');
    try {
      if (tableStatus.products?.exists && tableStatus.sales?.exists) {
        await db.transaction(async (trx) => {
          // Test transaction with rollback
          const testProductId = await trx.raw('SELECT uuid_generate_v4() as id').then(r => r.rows[0].id);
          
          await trx('products').insert({
            id: testProductId,
            name: 'Transaction Test Product',
            barcode: `TXN_${Date.now()}`,
            price: 5.99,
            stock_quantity: 10,
            category: 'Test',
            created_at: new Date(),
            updated_at: new Date()
          });
          
          console.log('✅ Transaction test - product inserted');
          
          // Intentionally rollback
          throw new Error('Intentional rollback for testing');
        });
      } else {
        console.log('❌ Cannot test transactions - required tables missing');
      }
    } catch (error) {
      if (error.message === 'Intentional rollback for testing') {
        console.log('✅ Transaction rollback successful');
      } else {
        console.log('❌ Transaction test failed:', error.message);
      }
    }

    // Step 11: Performance and connection diagnostics
    console.log('\n1️⃣1️⃣ CONNECTION DIAGNOSTICS:');
    try {
      const poolStats = db.client.pool;
      console.log('Connection pool status:');
      console.log(`   Min connections: ${poolStats.min}`);
      console.log(`   Max connections: ${poolStats.max}`);
      console.log(`   Used connections: ${poolStats.used}`);
      console.log(`   Free connections: ${poolStats.free}`);
      console.log(`   Pending requests: ${poolStats.pending}`);
      
      // Test query performance
      const start = Date.now();
      await db.raw('SELECT COUNT(*) FROM information_schema.tables');
      const duration = Date.now() - start;
      console.log(`✅ Query performance test: ${duration}ms`);
      
    } catch (error) {
      console.log('❌ Connection diagnostics failed:', error.message);
    }

    console.log('\n🎉 DATABASE DEBUGGING COMPLETE!');
    console.log('\n📋 SUMMARY REPORT:');
    console.log('='.repeat(50));
    
    // Generate summary
    const summary = {
      environment: environment,
      connection: '✅ Connected',
      tables: Object.keys(tableStatus).filter(t => tableStatus[t].exists).length,
      totalTables: requiredTables.length,
      issues: []
    };
    
    // Check for issues
    const missingTables = Object.keys(tableStatus).filter(t => !tableStatus[t].exists);
    if (missingTables.length > 0) {
      summary.issues.push(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    console.log(`Environment: ${summary.environment}`);
    console.log(`Database Connection: ${summary.connection}`);
    console.log(`Tables Status: ${summary.tables}/${summary.totalTables} exist`);
    
    if (summary.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      summary.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n📝 NEXT STEPS:');
    if (missingTables.length > 0) {
      console.log('1. Run migrations: cd backend && npm run migrate');
    }
    console.log('2. Test sales API endpoint: POST /api/sales');
    console.log('3. Check frontend sales.js for API integration');
    console.log('4. Verify button event handlers in sales modal');
    console.log('5. Check browser console for JavaScript errors');

  } catch (error) {
    console.error('💥 FATAL ERROR during debugging:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (db) {
      await db.destroy();
      console.log('\n🔐 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Debugging interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the debug function
console.log('🚀 Starting comprehensive database debugging...');
debugDatabase()
  .then(() => {
    console.log('\n✨ Debug completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error.message);
    process.exit(1);
  });
