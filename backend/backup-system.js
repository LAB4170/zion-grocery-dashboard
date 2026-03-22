const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class BackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.dbName = process.env.DB_NAME;
    this.dbUser = process.env.DB_USER;
    this.dbHost = process.env.DB_HOST;
    this.dbPort = process.env.DB_PORT;
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Daily backup (Plain SQL)
  async createDailyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = path.join(this.backupDir, `daily_backup_${timestamp}.sql`);
    
    // Using PGPASSWORD is discouraged but necessary for automated scripts if no .pgpass
    const command = `set PGPASSWORD=${process.env.DB_PASSWORD} && pg_dump -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d "${this.dbName}" > "${backupFile}"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Daily backup failed:', error);
          reject(error);
        } else {
          console.log(`✅ Daily backup created: ${backupFile}`);
          resolve(backupFile);
        }
      });
    });
  }

  // Weekly full backup (Custom Format)
  async createWeeklyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = path.join(this.backupDir, `weekly_backup_${timestamp}.dump`);
    
    const command = `set PGPASSWORD=${process.env.DB_PASSWORD} && pg_dump -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -Fc -d "${this.dbName}" -f "${backupFile}"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Weekly backup failed:', error);
          reject(error);
        } else {
          console.log(`✅ Weekly backup created: ${backupFile}`);
          resolve(backupFile);
        }
      });
    });
  }

  // Clean old backups (keep last 30 days)
  cleanOldBackups() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    fs.readdir(this.backupDir, (err, files) => {
      if (err) return console.error('Error reading backup directory:', err);

      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (stats.mtime < thirtyDaysAgo) {
            fs.unlink(filePath, (err) => {
              if (!err) console.log(`🗑️ Deleted old backup: ${file}`);
            });
          }
        });
      });
    });
  }

  // Schedule automated backups using node-cron
  schedule() {
    // 1. Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('⏰ Running scheduled daily backup...');
      try {
        await this.createDailyBackup();
      } catch (err) {
        console.error('Scheduled daily backup failed');
      }
    });

    // 2. Weekly backup every Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('⏰ Running scheduled weekly backup...');
      try {
        await this.createWeeklyBackup();
      } catch (err) {
        console.error('Scheduled weekly backup failed');
      }
    });

    // 3. Cleanup old backups every day at 4 AM
    cron.schedule('0 4 * * *', () => {
      console.log('⏰ Running backup cleanup...');
      this.cleanOldBackups();
    });

    console.log('📅 Backup system scheduled (Daily 2AM, Weekly Sun 3AM, Cleanup 4AM)');
  }
}

module.exports = BackupSystem;

module.exports = BackupSystem;

// If run directly, create a backup
if (require.main === module) {
  const backup = new BackupSystem();
  backup.createDailyBackup()
    .then(() => console.log('Backup completed successfully'))
    .catch(err => console.error('Backup failed:', err));
}
