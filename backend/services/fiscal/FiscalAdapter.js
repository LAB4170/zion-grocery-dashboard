/**
 * Base Fiscal Adapter Interface
 * All world-wide fiscal compliance modules (KRA, VFD, TRA, EFTPOS) must extend this.
 */
class FiscalAdapter {
  constructor(business) {
    this.business = business;
  }

  /**
   * Reports a sale to the local fiscal authority
   * @param {Object} sale - The sale record
   * @param {Array} items - The items sold
   * @returns {Promise<Object>} - The fiscal signature/receipt metadata
   */
  async reportSale(sale, items) {
    throw new Error('reportSale not implemented');
  }

  /**
   * Generates a QR code or Receipt Footer for compliance
   */
  async getReceiptAttributes(sale) {
    return {};
  }
}

module.exports = FiscalAdapter;
