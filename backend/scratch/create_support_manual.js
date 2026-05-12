
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function testCreate() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("🚀 Attempting manual table creation...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'medium',
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created support_tickets");

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created support_messages");

  } catch (err) {
    console.error("❌ ERROR DURING CREATION:", err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

testCreate();
