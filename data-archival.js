const db = require('./backend/config/database');

class DataArchival {
  constructor() {
    this.archivalThresholdYears = 7;
  }

  // Create archive tables
  async createArchiveTables() {
    try {
      // Sales archive table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS sales_archive (
          LIKE sales INCLUDING ALL
        );
      `);

      // Expenses archive table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS expenses_archive (
          LIKE expenses INCLUDING ALL
        );
      `);

      // Debts archive table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS debts_archive (
          LIKE debts INCLUDING ALL
        );
      `);

      console.log('Archive tables created successfully');
    } catch (error) {
      console.error('Error creating archive tables:', error);
    }
  }

  // Archive old sales data
  async archiveSalesData() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - this.archivalThresholdYears);

    try {
      // Move old data to archive
      const archivedCount = await db.raw(`
        WITH archived_data AS (
          DELETE FROM sales 
          WHERE created_at < ?
          RETURNING *
        )
        INSERT INTO sales_archive 
        SELECT * FROM archived_data
      `, [cutoffDate]);

      console.log(`Archived ${archivedCount.rowCount} sales records`);
      return archivedCount.rowCount;
    } catch (error) {
      console.error('Error archiving sales data:', error);
      throw error;
    }
  }

  // Archive old expenses data
  async archiveExpensesData() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - this.archivalThresholdYears);

    try {
      const archivedCount = await db.raw(`
        WITH archived_data AS (
          DELETE FROM expenses 
          WHERE created_at < ?
          RETURNING *
        )
        INSERT INTO expenses_archive 
        SELECT * FROM archived_data
      `, [cutoffDate]);

      console.log(`Archived ${archivedCount.rowCount} expense records`);
      return archivedCount.rowCount;
    } catch (error) {
      console.error('Error archiving expenses data:', error);
      throw error;
    }
  }

  // Create partitioned tables for better performance
  async createPartitionedTables() {
    try {
      // Create partitioned sales table by year
      await db.raw(`
        CREATE TABLE IF NOT EXISTS sales_partitioned (
          LIKE sales INCLUDING ALL
        ) PARTITION BY RANGE (created_at);
      `);

      // Create partitions for current and next few years
      const currentYear = new Date().getFullYear();
      for (let year = currentYear - 1; year <= currentYear + 2; year++) {
        await db.raw(`
          CREATE TABLE IF NOT EXISTS sales_${year} 
          PARTITION OF sales_partitioned
          FOR VALUES FROM ('${year}-01-01') TO ('${year + 1}-01-01');
        `);
      }

      console.log('Partitioned tables created successfully');
    } catch (error) {
      console.error('Error creating partitioned tables:', error);
    }
  }

  // Run complete archival process
  async runArchival() {
    console.log('Starting data archival process...');
    
    try {
      await this.createArchiveTables();
      
      const salesArchived = await this.archiveSalesData();
      const expensesArchived = await this.archiveExpensesData();
      
      console.log(`Archival completed: ${salesArchived + expensesArchived} total records archived`);
      
      // Analyze tables for better performance
      await db.raw('ANALYZE;');
      
      return {
        salesArchived,
        expensesArchived,
        totalArchived: salesArchived + expensesArchived
      };
    } catch (error) {
      console.error('Archival process failed:', error);
      throw error;
    }
  }

  // Schedule monthly archival
  scheduleArchival() {
    // Run archival on the 1st of each month at 1 AM
    const monthlyInterval = setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 1) {
        this.runArchival();
      }
    }, 60 * 60 * 1000); // Check every hour

    console.log('Data archival scheduled for monthly execution');
    return monthlyInterval;
  }
}

module.exports = DataArchival;

// If run directly, execute archival
if (require.main === module) {
  const archival = new DataArchival();
  archival.runArchival()
    .then(result => {
      console.log('Archival result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Archival failed:', err);
      process.exit(1);
    });
}
