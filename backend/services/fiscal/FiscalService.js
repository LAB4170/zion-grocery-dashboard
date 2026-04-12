const KRA_eTIMS = require('./KRA_eTIMS');

/**
 * Fiscal Service Factory
 * Resolves the appropriate fiscal adapter for a business.
 */
class FiscalService {
  static getAdapter(business) {
    // Logic: If business is in Kenya, return KRA_eTIMS
    // For now, we use KRA_eTIMS as the flagship scaling example
    return new KRA_eTIMS(business);
  }

  /**
   * Helper to report a sale and update its metadata
   */
  static async processSale(business, sale, product) {
    try {
      const adapter = this.getAdapter(business);
      
      const items = [{
        name: product.name,
        quantity: sale.quantity,
        price: sale.unit_price || (sale.total_amount / sale.quantity)
      }];

      const fiscalResult = await adapter.reportSale(sale, items);
      
      return fiscalResult;
    } catch (err) {
      console.error('Fiscal Processing Failed:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = FiscalService;
