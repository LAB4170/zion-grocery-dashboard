const { db } = require('../../config/database');

class ProcurementService {
  /**
   * Supplier Management
   */
  static async listSuppliers(businessId) {
    return db('suppliers')
      .where({ business_id: businessId })
      .orderBy('name', 'asc');
  }

  static async createSupplier(businessId, supplierData) {
    const { withRLS } = require('../../config/database');
    return await withRLS(businessId, async (trx) => {
      const [supplier] = await trx('suppliers')
        .insert({
          ...supplierData,
          business_id: businessId
        })
        .returning('*');
      return supplier;
    });
  }

  /**
   * Receiving Logic (The core of Supply Chain)
   * Atomically: creates PO header, updates stock (WAC), records expense.
   */
  static async receivePurchaseOrder(businessId, poData) {
    const { supplierId, referenceNumber, items, notes } = poData;

    // Validate inputs before touching DB
    if (!supplierId) throw new Error('Supplier is required.');
    if (!Array.isArray(items) || items.length === 0) throw new Error('At least one item is required.');

    for (const item of items) {
      if (!item.productId) throw new Error('Each item must have a productId.');
      const qty = parseFloat(item.quantity);
      const cost = parseFloat(item.unitCost);
      if (isNaN(qty) || qty <= 0) throw new Error(`Invalid quantity for item: ${item.name || item.productId}`);
      if (isNaN(cost) || cost < 0) throw new Error(`Invalid unit cost for item: ${item.name || item.productId}`);
    }

    const totalAmount = items.reduce(
      (sum, i) => sum + (parseFloat(i.unitCost) * parseFloat(i.quantity)),
      0
    );

    const { withRLS } = require('../../config/database');

    return await withRLS(businessId, async (trx) => {
      // 1. Create the Purchase Order Header
      const poResults = await trx('purchase_orders')
        .insert({
          supplier_id: supplierId,
          business_id: businessId,
          reference_number: referenceNumber || `REF-${Date.now()}`,
          total_amount: totalAmount,
          status: 'received',
          notes: notes || null
        })
        .returning('*');

      const po = poResults[0];
      if (!po || !po.id) throw new Error('Failed to create purchase order record.');

      // 2. Process each line item
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const cost = parseFloat(item.unitCost);

        // A. Record PO line item
        await trx('po_items').insert({
          purchase_order_id: po.id,
          product_id: item.productId,
          quantity: qty,
          unit_cost: cost,
          subtotal: parseFloat((cost * qty).toFixed(2))
        });

        // B. Update Product stock and WAC (Weighted Average Cost)
        const product = await trx('products')
          .where({ id: item.productId, business_id: businessId })
          .first();

        if (!product) {
          throw new Error(`Product not found: ${item.name || item.productId}`);
        }

        const currentStock = parseFloat(product.stock_quantity || 0);
        const currentCost  = parseFloat(product.unit_cost || product.cost_price || 0);

        // WAC formula: if no existing stock, new cost becomes the unit cost
        const newWeightedCost = currentStock > 0
          ? ((currentStock * currentCost) + (qty * cost)) / (currentStock + qty)
          : cost;

        await trx('products')
          .where({ id: item.productId, business_id: businessId })
          .update({
            stock_quantity: parseFloat((currentStock + qty).toFixed(3)),
            unit_cost: parseFloat(newWeightedCost.toFixed(2)),
            updated_at: trx.fn.now()
          });
      }

      // 3. Auto-record as an Expense (Inventory Purchase)
      // Only insert columns that actually exist in the expenses table
      await trx('expenses').insert({
        business_id: businessId,
        category: 'Inventory Purchase',
        description: `Stock received — PO Ref: ${po.reference_number}`,
        amount: parseFloat(totalAmount.toFixed(2)),
        status: 'paid',
        created_by: 'system'
      });

      return po;
    });
  }

  /**
   * Purchase Order History
   */
  static async getPurchaseHistory(businessId) {
    return db('purchase_orders as po')
      .join('suppliers as s', 'po.supplier_id', 's.id')
      .where('po.business_id', businessId)
      .select('po.*', 's.name as supplier_name')
      .orderBy('po.created_at', 'desc');
  }
}

module.exports = ProcurementService;
