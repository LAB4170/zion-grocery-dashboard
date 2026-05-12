const { db } = require('./database');

/**
 * AuditService
 * Responsible for recording all significant mutations in the system
 * for forensic traceability and compliance.
 */
class AuditService {
  /**
   * Log a tenant-level mutation
   */
  static async log({
    businessId,
    userEmail,
    action, // 'CREATE', 'UPDATE', 'DELETE'
    entityType, // 'SALE', 'PRODUCT', 'EXPENSE', 'DEBT'
    entityId,
    oldData = null,
    newData = null
  }) {
    try {
      // Use fire-and-forget for logging to avoid blocking the main transaction,
      // unless strict audit compliance is required.
      await db('tenant_audit_logs').insert({
        business_id: businessId,
        user_email: userEmail,
        action: action.toUpperCase(),
        entity_type: entityType.toUpperCase(),
        entity_id: entityId,
        old_data: oldData ? JSON.stringify(oldData) : null,
        new_data: newData ? JSON.stringify(newData) : null,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('🛡️ [AuditService] Failed to record audit log:', error.message);
      // In a high-security environment, you might throw this error to roll back 
      // the mutation if the log cannot be saved.
    }
  }
}

module.exports = AuditService;
