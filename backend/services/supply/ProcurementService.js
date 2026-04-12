const { db } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

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
    const [supplier] = await db('suppliers')
      .insert({
        ...supplierData,
        business_id: businessId
      })
      .returning('*');
    return supplier;
  }

  /**
   * Receiving Logic (The core of Supply Chain)
   * This handles multi-item restocks in a single atomic transaction.
   */
  static async receivePurchaseOrder(businessId, poData) {
    const { supplierId, referenceNumber, items, notes } = poData;
    const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.unitCost) * parseFloat(i.quantity)), 0);

    return db.transaction(async (trx) => {
      // 1. Create the Purchase Order Header
      const [po] = await trx('purchase_orders')
        .insert({
          supplier_id: supplierId,
          business_id: businessId,
          reference_number: referenceNumber || `REF-${Date.now()}`,
          total_amount: totalAmount,
          status: 'received',
          notes: notes
        })
        .returning('*');

      // 2. Process each item
      for (const item of items) {
        // A. Record PO Item details
        await trx('po_items').insert({
          purchase_order_id: po.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          subtotal: parseFloat(item.unitCost) * parseFloat(item.quantity)
        });

        // B. Update Product Inventory & COGS
        const product = await trx('products').where({ id: item.productId }).first();
        if (product) {
          const currentStock = parseFloat(product.stock_quantity || 0);
          const currentCost = parseFloat(product.unit_cost || 0);
          const newQty = parseFloat(item.quantity);
          const newCost = parseFloat(item.unitCost);

          // Calculate Weighted Average Cost (WAC)
          // Simplified logic: If stock is 0, just use new cost. 
          // Otherwise: (OldQty * OldCost + NewQty * NewCost) / (OldQty + NewQty)
          let weightedCost = newCost;
          if (currentStock > 0) {
            weightedCost = ((currentStock * currentCost) + (newQty * newCost)) / (currentStock + newQty);
          }

          await trx('products')
            .where({ id: item.productId })
            .update({
              stock_quantity: currentStock + newQty,
              unit_cost: weightedCost.toFixed(2),
              updated_at: trx.fn.now()
            });
        }
      }

      // 3. Auto-record the outflow in the Expense Ledger
      await trx('expenses').insert({
        business_id: businessId,
        category: 'Inventory Purchase',
        description: `Restock from Supplier (PO: ${po.reference_number || po.id})`,
        amount: totalAmount,
        status: 'paid', // Assuming stock arrival implies payment or recognized debt
        date: trx.fn.now(),
        metadata: JSON.stringify({ po_id: po.id, supplier_id: supplierId })
      });

      return po;
    });
  }

  /**
   * History & Reporting
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
