/**
 * SmsService.js
 * Automated communication engine for Nexus POS.
 * Powered by Africa's Talking.
 */
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER_ID = process.env.AT_SENDER_ID; // Branded name e.g. NEXUS_POS
const OWNER_PHONE = process.env.AT_OWNER_PHONE;

const instance = axios.create({
  baseURL: AT_USERNAME === 'sandbox' 
    ? 'https://api.sandbox.africastalking.com/version1' 
    : 'https://api.africastalking.com/version1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'apiKey': AT_API_KEY
  }
});

class SmsService {
  /**
   * Universal SMS Dispatcher
   */
  static async sendSMS(to, message) {
    if (!AT_API_KEY || AT_API_KEY === 'your_at_api_key_here') {
      console.warn('⚠️ SmsService: AT_API_KEY not configured. SMS suppressed.');
      return { success: false, message: 'API key missing' };
    }

    // Ensure phone starts with +
    let formattedTo = to.startsWith('+') ? to : `+${to}`;

    const params = new URLSearchParams();
    params.append('username', AT_USERNAME);
    params.append('to', formattedTo);
    params.append('message', message);
    if (AT_SENDER_ID && AT_SENDER_ID !== 'NEXUS_POS') {
      params.append('from', AT_SENDER_ID);
    }

    try {
      const response = await instance.post('/messaging', params);
      console.log(`📩 SMS Sent to ${formattedTo}:`, response.data.SMSMessageData.Message);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ SmsService Error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Transactional Receipt
   */
  static async sendReceipt(sale) {
    if (!sale.customerPhone) return;

    let itemsText = '';
    if (sale.items && sale.items.length > 0) {
       itemsText = sale.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ');
    }

    const message = `Receipt: Thank you for shopping! 
Total: KSh ${Number(sale.total).toLocaleString()} 
Items: ${itemsText || 'General Sale'}
Ref: ${sale.mpesa_code || sale.id.substring(0, 8)}`;

    return this.sendSMS(sale.customerPhone, message);
  }

  /**
   * Send Low Stock Alert to Owner
   */
  static async sendStockAlert(product) {
    if (!OWNER_PHONE) return;

    const message = `⚠️ NEXUS ALERT: Low Stock!
Product: ${product.name}
Current Stock: ${product.stock_quantity} ${product.unit || 'pcs'}
Please restock soon.`;

    return this.sendSMS(OWNER_PHONE, message);
  }
}

module.exports = SmsService;
