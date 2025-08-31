// Comprehensive System Health Check for Zion Grocery Dashboard
// This script validates all critical functionality and data consistency

class SystemHealthChecker {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            issues: [],
            warningsList: [],
            dataConsistency: true,
            buttonFunctionality: true,
            systemHealth: 100
        };
    }

    // Main health check function
    async runCompleteHealthCheck() {
        console.log('🏥 Starting Comprehensive System Health Check...');
        
        this.checkCoreUtilities();
        this.checkDataConsistency();
        this.checkButtonFunctionality();
        this.checkModalSystem();
        this.checkNavigationSystem();
        this.checkStorageSystem();
        this.checkIDGeneration();
        this.checkErrorHandling();
        this.checkResponsiveDesign();
        
        this.generateHealthReport();
        return this.results;
    }

    // Test 1: Core Utilities
    checkCoreUtilities() {
        try {
            const requiredFunctions = [
                'formatCurrency', 'formatDate', 'generateId', 'showNotification',
                'saveToStorage', 'getFromStorage', 'openModal', 'closeModal', 'searchTable'
            ];
            
            const missingFunctions = requiredFunctions.filter(fn => 
                typeof window.utils[fn] !== 'function'
            );
            
            if (missingFunctions.length === 0) {
                this.logPass('Core utilities complete');
            } else {
                this.logFail(`Missing utilities: ${missingFunctions.join(', ')}`);
            }
        } catch (error) {
            this.logFail(`Core utilities error: ${error.message}`);
        }
    }

    // Test 2: Data Consistency
    checkDataConsistency() {
        try {
            // Check if all global variables are properly initialized
            const dataArrays = ['products', 'sales', 'expenses', 'debts'];
            let consistencyIssues = [];
            
            dataArrays.forEach(arrayName => {
                try {
                    const windowData = window[arrayName];
                    
                    // Check if data exists and is an array
                    if (!windowData) {
                        consistencyIssues.push(`${arrayName} is not defined`);
                        return;
                    }
                    
                    if (!Array.isArray(windowData)) {
                        consistencyIssues.push(`${arrayName} is not an array`);
                        return;
                    }
                    
                    // Check for duplicate IDs
                    const ids = windowData.map(item => item.id).filter(id => id);
                    const uniqueIds = [...new Set(ids)];
                    if (ids.length !== uniqueIds.length) {
                        consistencyIssues.push(`Duplicate IDs found in ${arrayName}`);
                    }
                    
                    const storageData = window.utils.getFromStorage(arrayName, []);
                    
                    if (JSON.stringify(windowData) !== JSON.stringify(storageData)) {
                        consistencyIssues.push(`${arrayName} data mismatch between memory and storage`);
                    }
                } catch (error) {
                    consistencyIssues.push(`Error checking ${arrayName}: ${error.message}`);
                }
            });
            
            if (consistencyIssues.length === 0) {
                this.logPass('Data consistency verified');
            } else {
                this.results.dataConsistency = false;
                consistencyIssues.forEach(issue => this.logFail(issue));
            }
        } catch (error) {
            this.logFail(`Data consistency check failed: ${error.message}`);
        }
    }

    // Test 3: Button Functionality
    checkButtonFunctionality() {
        try {
            const criticalFunctions = [
                'addProduct', 'addSale', 'addExpense', 'addDebt',
                'deleteProduct', 'deleteSale', 'deleteExpense', 'deleteDebt',
                'editProduct', 'editSale', 'loadProductsData', 'loadSalesData'
            ];
            
            const missingFunctions = criticalFunctions.filter(fn => 
                typeof window[fn] !== 'function'
            );
            
            if (missingFunctions.length === 0) {
                this.logPass('All critical functions available');
            } else {
                this.results.buttonFunctionality = false;
                this.logFail(`Missing functions: ${missingFunctions.join(', ')}`);
            }
        } catch (error) {
            this.logFail(`Button functionality check failed: ${error.message}`);
        }
    }

    // Test 4: Modal System
    checkModalSystem() {
        try {
            const modals = ['salesModal', 'productModal', 'expenseModal', 'debtModal'];
            let modalIssues = [];
            
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (!modal) {
                    modalIssues.push(`${modalId} not found in DOM`);
                } else {
                    // Test modal opening/closing
                    window.utils.openModal(modalId);
                    if (modal.style.display !== 'block') {
                        modalIssues.push(`${modalId} opening failed`);
                    }
                    window.utils.closeModal(modalId);
                    if (modal.style.display !== 'none') {
                        modalIssues.push(`${modalId} closing failed`);
                    }
                }
            });
            
            if (modalIssues.length === 0) {
                this.logPass('Modal system functional');
            } else {
                modalIssues.forEach(issue => this.logFail(issue));
            }
        } catch (error) {
            this.logFail(`Modal system check failed: ${error.message}`);
        }
    }

    // Test 5: Navigation System
    checkNavigationSystem() {
        try {
            const sections = ['dashboard', 'sales', 'products', 'sales-settings', 'expenses', 'individual-debts'];
            let navIssues = [];
            
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (!section) {
                    navIssues.push(`Section ${sectionId} not found`);
                }
            });
            
            if (typeof showSection !== 'function') {
                navIssues.push('showSection function missing');
            }
            
            if (navIssues.length === 0) {
                this.logPass('Navigation system complete');
            } else {
                navIssues.forEach(issue => this.logFail(issue));
            }
        } catch (error) {
            this.logFail(`Navigation check failed: ${error.message}`);
        }
    }

    // Test 6: Storage System
    checkStorageSystem() {
        try {
            const testData = { id: 'test-' + Date.now(), value: 'test' };
            
            // Test save
            const saveResult = window.utils.saveToStorage('healthCheck', testData);
            if (!saveResult) {
                this.logFail('Storage save failed');
                return;
            }
            
            // Test retrieve
            const retrievedData = window.utils.getFromStorage('healthCheck');
            if (JSON.stringify(retrievedData) !== JSON.stringify(testData)) {
                this.logFail('Storage retrieve failed - data mismatch');
                return;
            }
            
            // Cleanup
            localStorage.removeItem('healthCheck');
            this.logPass('Storage system functional');
        } catch (error) {
            this.logFail(`Storage system check failed: ${error.message}`);
        }
    }

    // Test 7: ID Generation
    checkIDGeneration() {
        try {
            const ids = [];
            for (let i = 0; i < 100; i++) {
                ids.push(window.utils.generateId());
            }
            
            const uniqueIds = [...new Set(ids)];
            if (ids.length === uniqueIds.length) {
                this.logPass('ID generation produces unique IDs');
            } else {
                this.logFail('ID generation produces duplicates');
            }
        } catch (error) {
            this.logFail(`ID generation check failed: ${error.message}`);
        }
    }

    // Test 8: Error Handling
    checkErrorHandling() {
        try {
            // Test notification system
            window.utils.showNotification('Health check test', 'success');
            
            // Test with invalid data
            const invalidResult = window.utils.formatCurrency('invalid');
            if (invalidResult.includes('KSh')) {
                this.logPass('Error handling robust');
            } else {
                this.logWarn('Error handling could be improved');
            }
        } catch (error) {
            this.logFail(`Error handling check failed: ${error.message}`);
        }
    }

    // Test 9: Responsive Design
    checkResponsiveDesign() {
        try {
            const criticalElements = [
                'sidebar-container', 'dashboard-container', 'sales-container',
                'products-container', 'modals-container'
            ];
            
            let missingElements = criticalElements.filter(id => 
                !document.getElementById(id)
            );
            
            if (missingElements.length === 0) {
                this.logPass('All critical UI elements present');
            } else {
                this.logFail(`Missing UI elements: ${missingElements.join(', ')}`);
            }
        } catch (error) {
            this.logFail(`Responsive design check failed: ${error.message}`);
        }
    }

    // Logging helpers
    logPass(message) {
        console.log(`✅ ${message}`);
        this.results.passed++;
    }

    logFail(message) {
        console.log(`❌ ${message}`);
        this.results.failed++;
        this.results.issues.push(message);
    }

    logWarn(message) {
        console.log(`⚠️ ${message}`);
        this.results.warnings++;
        this.results.warningsList.push(message);
    }

    // Generate comprehensive health report
    generateHealthReport() {
        const total = this.results.passed + this.results.failed;
        this.results.systemHealth = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
        
        console.log('\n🏥 SYSTEM HEALTH REPORT');
        console.log('========================');
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`⚠️ Warnings: ${this.results.warnings}`);
        console.log(`📊 System Health: ${this.results.systemHealth}%`);
        console.log(`🔄 Data Consistency: ${this.results.dataConsistency ? 'GOOD' : 'ISSUES'}`);
        console.log(`🔘 Button Functionality: ${this.results.buttonFunctionality ? 'GOOD' : 'ISSUES'}`);
        
        if (this.results.issues.length > 0) {
            console.log('\n🔧 Critical Issues:');
            this.results.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        if (this.results.warningsList.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.results.warningsList.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        // Overall status
        if (this.results.systemHealth >= 95) {
            console.log('\n🎉 SYSTEM STATUS: EXCELLENT');
            window.utils.showNotification('System health check passed! All systems operational.', 'success');
        } else if (this.results.systemHealth >= 80) {
            console.log('\n✅ SYSTEM STATUS: GOOD');
            window.utils.showNotification('System health check completed. Minor issues detected.', 'warning');
        } else {
            console.log('\n⚠️ SYSTEM STATUS: NEEDS ATTENTION');
            window.utils.showNotification('System health check failed. Critical issues detected.', 'error');
        }
    }
}

// Initialize and export
const systemHealthChecker = new SystemHealthChecker();

// Auto-run comprehensive health check
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        systemHealthChecker.runCompleteHealthCheck();
    }, 3000); // Wait for all systems to initialize
});

// Export for manual testing
window.runSystemHealthCheck = () => systemHealthChecker.runCompleteHealthCheck();
window.systemHealthChecker = systemHealthChecker;
