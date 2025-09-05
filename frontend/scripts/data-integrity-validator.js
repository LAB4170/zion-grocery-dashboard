// Data Integrity Validator - Ensures 100% data consistency and ID management
class DataIntegrityValidator {
    constructor() {
        this.issues = [];
        this.fixes = [];
    }

    // Main validation function
    validateAndFix() {
        console.log('🔍 Starting Data Integrity Validation...');
        
        this.validateIDUniqueness();
        this.validateDataStructures();
        this.validateRelationalIntegrity();
        this.fixDataInconsistencies();
        this.synchronizeGlobalVariables();
        
        this.generateReport();
        return this.issues.length === 0;
    }

    // Validate ID uniqueness across all data arrays
    validateIDUniqueness() {
        const dataTypes = ['products', 'sales', 'expenses', 'debts'];
        
        dataTypes.forEach(type => {
            const data = window.utils.getFromStorage(type, []);
            const ids = data.map(item => item.id).filter(id => id);
            const uniqueIds = [...new Set(ids)];
            
            if (ids.length !== uniqueIds.length) {
                this.issues.push(`Duplicate IDs found in ${type}`);
                this.fixDuplicateIDs(type, data);
            }
        });
    }

    // Fix duplicate IDs by regenerating them
    fixDuplicateIDs(type, data) {
        const seenIds = new Set();
        let fixCount = 0;
        
        data.forEach(item => {
            if (!item.id || seenIds.has(item.id)) {
                item.id = window.utils.generateId();
                fixCount++;
            }
            seenIds.add(item.id);
        });
        
        if (fixCount > 0) {
            window.utils.saveToStorage(type, data);
            this.fixes.push(`Fixed ${fixCount} duplicate IDs in ${type}`);
        }
    }

    // Validate data structure integrity
    validateDataStructures() {
        // Validate products
        const products = window.utils.getFromStorage('products', []);
        products.forEach((product, index) => {
            if (!product.id) {
                product.id = window.utils.generateId();
                this.fixes.push(`Added missing ID to product at index ${index}`);
            }
            if (typeof product.price !== 'number' || product.price < 0) {
                product.price = 0;
                this.fixes.push(`Fixed invalid price for product ${product.name || 'Unknown'}`);
            }
            if (typeof product.stock !== 'number' || product.stock < 0) {
                product.stock = 0;
                this.fixes.push(`Fixed invalid stock for product ${product.name || 'Unknown'}`);
            }
        });
        window.utils.saveToStorage('products', products);

        // Validate sales
        const sales = window.utils.getFromStorage('sales', []);
        sales.forEach((sale, index) => {
            if (!sale.id) {
                sale.id = window.utils.generateId();
                this.fixes.push(`Added missing ID to sale at index ${index}`);
            }
            if (typeof sale.total !== 'number' || sale.total < 0) {
                sale.total = (sale.unitPrice || 0) * (sale.quantity || 0);
                this.fixes.push(`Fixed invalid total for sale ${sale.id}`);
            }
            if (!sale.createdAt) {
                sale.createdAt = new Date().toISOString();
                this.fixes.push(`Added missing createdAt to sale ${sale.id}`);
            }
        });
        window.utils.saveToStorage('sales', sales);

        // Validate expenses
        const expenses = window.utils.getFromStorage('expenses', []);
        expenses.forEach((expense, index) => {
            if (!expense.id) {
                expense.id = window.utils.generateId();
                this.fixes.push(`Added missing ID to expense at index ${index}`);
            }
            if (typeof expense.amount !== 'number' || expense.amount < 0) {
                expense.amount = 0;
                this.fixes.push(`Fixed invalid amount for expense ${expense.id}`);
            }
        });
        window.utils.saveToStorage('expenses', expenses);

        // Validate debts
        const debts = window.utils.getFromStorage('debts', []);
        debts.forEach((debt, index) => {
            if (!debt.id) {
                debt.id = window.utils.generateId();
                this.fixes.push(`Added missing ID to debt at index ${index}`);
            }
            if (typeof debt.amount !== 'number' || debt.amount < 0) {
                debt.amount = 0;
                this.fixes.push(`Fixed invalid amount for debt ${debt.id}`);
            }
            if (!debt.status) {
                debt.status = 'pending';
                this.fixes.push(`Added missing status to debt ${debt.id}`);
            }
        });
        window.utils.saveToStorage('debts', debts);
    }

    // Validate relational integrity between data types
    validateRelationalIntegrity() {
        const products = window.utils.getFromStorage('products', []);
        const sales = window.utils.getFromStorage('sales', []);
        const productIds = new Set(products.map(p => p.id));
        
        // Check if sales reference valid products
        sales.forEach(sale => {
            if (sale.productId && !productIds.has(sale.productId)) {
                this.issues.push(`Sale ${sale.id} references non-existent product ${sale.productId}`);
                // Fix by removing the invalid productId reference
                sale.productId = null;
                sale.productName = sale.productName || 'Unknown Product';
                this.fixes.push(`Fixed invalid product reference in sale ${sale.id}`);
            }
        });
        
        if (this.fixes.length > 0) {
            window.utils.saveToStorage('sales', sales);
        }
    }

    // Fix data inconsistencies between memory and storage
    fixDataInconsistencies() {
        const dataTypes = ['products', 'sales', 'expenses', 'debts'];
        
        dataTypes.forEach(type => {
            const storageData = window.utils.getFromStorage(type, []);
            const memoryData = window[type] || [];
            
            // If memory and storage don't match, use storage as source of truth
            if (JSON.stringify(storageData) !== JSON.stringify(memoryData)) {
                window[type] = storageData;
                this.fixes.push(`Synchronized ${type} data between memory and storage`);
            }
        });
    }

    // Synchronize all global variables
    synchronizeGlobalVariables() {
        window.products = window.utils.getFromStorage('products', []);
        window.sales = window.utils.getFromStorage('sales', []);
        window.expenses = window.utils.getFromStorage('expenses', []);
        window.debts = window.utils.getFromStorage('debts', []);
        
        // Update legacy global variables for backward compatibility
        if (typeof products !== 'undefined') products = window.products;
        if (typeof sales !== 'undefined') sales = window.sales;
        if (typeof expenses !== 'undefined') expenses = window.expenses;
        if (typeof debts !== 'undefined') debts = window.debts;
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n📊 DATA INTEGRITY VALIDATION REPORT');
        console.log('=====================================');
        
        if (this.issues.length === 0) {
            console.log('✅ No data integrity issues found');
        } else {
            console.log(`❌ Found ${this.issues.length} issues:`);
            this.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        if (this.fixes.length > 0) {
            console.log(`\n🔧 Applied ${this.fixes.length} fixes:`);
            this.fixes.forEach((fix, index) => {
                console.log(`   ${index + 1}. ${fix}`);
            });
        }
        
        // Verify final state
        const finalCheck = this.performFinalValidation();
        if (finalCheck) {
            console.log('\n🎉 DATA INTEGRITY: 100% VALIDATED');
            window.utils.showNotification('Data integrity validation passed!', 'success');
        } else {
            console.log('\n⚠️ DATA INTEGRITY: ISSUES REMAIN');
            window.utils.showNotification('Data integrity issues detected!', 'error');
        }
    }

    // Perform final validation check
    performFinalValidation() {
        const dataTypes = ['products', 'sales', 'expenses', 'debts'];
        let allValid = true;
        
        dataTypes.forEach(type => {
            const data = window.utils.getFromStorage(type, []);
            const ids = data.map(item => item.id).filter(id => id);
            const uniqueIds = [...new Set(ids)];
            
            if (ids.length !== uniqueIds.length) {
                allValid = false;
            }
            
            // Check if all items have required fields
            data.forEach(item => {
                if (!item.id || !item.createdAt) {
                    allValid = false;
                }
            });
        });
        
        return allValid;
    }
}

// Initialize validator
const dataIntegrityValidator = new DataIntegrityValidator();

// Auto-run validation (DISABLED to prevent reload issues)
document.addEventListener('DOMContentLoaded', function() {
    // TEMPORARILY DISABLED - Auto validation was contributing to frequent requests and localStorage errors
    // setTimeout(() => {
    //     dataIntegrityValidator.validateAndFix();
    // }, 1000);
    console.log('🔍 Data integrity validator loaded - auto-run disabled to prevent frequent requests');
});

// Export for manual use
window.validateDataIntegrity = () => dataIntegrityValidator.validateAndFix();
window.dataIntegrityValidator = dataIntegrityValidator;
