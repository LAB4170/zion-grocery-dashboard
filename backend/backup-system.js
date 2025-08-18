const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class BackupSystem {
  constructor() {
    this.backupDir = './backups';
    this.dbName = process.env.DB_NAME;
    this.dbUser = process.env.DB_USER;
    this.dbHost = process.env.DB_HOST;
    this.dbPort = process.env.DB_PORT;
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Daily backup
  async createDailyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = path.join(this.backupDir, `daily_backup_${timestamp}.sql`);
    
    const command = `pg_dump -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} > ${backupFile}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Backup failed:', error);
          reject(error);
        } else {
          console.log(`Daily backup created: ${backupFile}`);
          resolve(backupFile);
        }
      });
    });
  }

  // Weekly full backup
  async createWeeklyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = path.join(this.backupDir, `weekly_backup_${timestamp}.dump`);
    
    const command = `pg_dump -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -Fc -d ${this.dbName} -f ${backupFile}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Weekly backup failed:', error);
          reject(error);
        } else {
          console.log(`Weekly backup created: ${backupFile}`);
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
              if (!err) console.log(`Deleted old backup: ${file}`);
            });
          }
        });
      });
    });
  }

  // Schedule automated backups
  scheduleBackups() {
    // Daily backup at 2 AM
    const dailyInterval = 24 * 60 * 60 * 1000; // 24 hours
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 2) {
        this.createDailyBackup();
      }
    }, 60 * 60 * 1000); // Check every hour

    // Weekly backup on Sundays
    const weeklyInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 3) { // Sunday at 3 AM
        this.createWeeklyBackup();
      }
    }, 60 * 60 * 1000); // Check every hour

    // Clean old backups monthly
    setInterval(() => {
      this.cleanOldBackups();
    }, 30 * 24 * 60 * 60 * 1000); // Every 30 days
  }
}

module.exports = BackupSystem;

// If run directly, create a backup
if (require.main === module) {
  const backup = new BackupSystem();
  backup.createDailyBackup()
    .then(() => console.log('Backup completed successfully'))
    .catch(err => console.error('Backup failed:', err));
}
