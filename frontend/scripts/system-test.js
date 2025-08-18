// System Test - Verify all critical issues are fixed
function runSystemTest() {
    console.log('🧪 Running System Test - Critical Issues Verification');
    
    const testResults = {
        passed: 0,
        failed: 0,
        issues: []
    };
    
    // Test 1: Check if window.utils exists and has all required functions
    try {
        if (typeof window.utils === 'object' && 
            typeof window.utils.getFromStorage === 'function' &&
            typeof window.utils.saveToStorage === 'function' &&
            typeof window.utils.formatCurrency === 'function' &&
            typeof window.utils.formatDate === 'function' &&
            typeof window.utils.generateId === 'function' &&
            typeof window.utils.showNotification === 'function' &&
            typeof window.utils.openModal === 'function' &&
            typeof window.utils.closeModal === 'function') {
            console.log('✅ Test 1 PASSED: window.utils has all required functions');
            testResults.passed++;
        } else {
            throw new Error('Missing window.utils functions');
        }
    } catch (error) {
        console.log('❌ Test 1 FAILED: window.utils incomplete -', error.message);
        testResults.failed++;
        testResults.issues.push('window.utils incomplete');
    }
    
    // Test 2: Check if all global variables use window.utils.getFromStorage
    try {
        // Test sales variable
        if (typeof sales !== 'undefined' && Array.isArray(sales)) {
            console.log('✅ Test 2a PASSED: Sales variable properly initialized');
            testResults.passed++;
        } else {
            throw new Error('Sales variable not properly initialized');
        }
        
        // Test products variable
        if (typeof products !== 'undefined' && Array.isArray(products)) {
            console.log('✅ Test 2b PASSED: Products variable properly initialized');
            testResults.passed++;
        } else {
            throw new Error('Products variable not properly initialized');
        }
    } catch (error) {
        console.log('❌ Test 2 FAILED: Global variables not properly initialized -', error.message);
        testResults.failed++;
        testResults.issues.push('Global variables initialization');
    }
    
    // Test 3: Check if modal functions work
    try {
        // Test modal opening
        window.utils.openModal('salesModal');
        const modal = document.getElementById('salesModal');
        if (modal && modal.style.display === 'block') {
            console.log('✅ Test 3a PASSED: Modal opening works');
            testResults.passed++;
            
            // Test modal closing
            window.utils.closeModal('salesModal');
            if (modal.style.display === 'none') {
                console.log('✅ Test 3b PASSED: Modal closing works');
                testResults.passed++;
            } else {
                throw new Error('Modal closing failed');
            }
        } else {
            throw new Error('Modal opening failed');
        }
    } catch (error) {
        console.log('❌ Test 3 FAILED: Modal functions not working -', error.message);
        testResults.failed++;
        testResults.issues.push('Modal functions');
    }
    
    // Test 4: Check if notification system works
    try {
        window.utils.showNotification('Test notification', 'success');
        console.log('✅ Test 4 PASSED: Notification system works');
        testResults.passed++;
    } catch (error) {
        console.log('❌ Test 4 FAILED: Notification system not working -', error.message);
        testResults.failed++;
        testResults.issues.push('Notification system');
    }
    
    // Test 5: Check if storage functions work
    try {
        const testData = { test: 'data', timestamp: Date.now() };
        window.utils.saveToStorage('systemTest', testData);
        const retrievedData = window.utils.getFromStorage('systemTest');
        
        if (JSON.stringify(retrievedData) === JSON.stringify(testData)) {
            console.log('✅ Test 5 PASSED: Storage functions work');
            testResults.passed++;
            
            // Clean up test data
            localStorage.removeItem('systemTest');
        } else {
            throw new Error('Data mismatch in storage');
        }
    } catch (error) {
        console.log('❌ Test 5 FAILED: Storage functions not working -', error.message);
        testResults.failed++;
        testResults.issues.push('Storage functions');
    }
    
    // Test 6: Check if formatting functions work
    try {
        const formattedCurrency = window.utils.formatCurrency(1234.56);
        const formattedDate = window.utils.formatDate(new Date().toISOString());
        
        if (formattedCurrency.includes('KSh') && formattedDate.length > 0) {
            console.log('✅ Test 6 PASSED: Formatting functions work');
            testResults.passed++;
        } else {
            throw new Error('Formatting functions failed');
        }
    } catch (error) {
        console.log('❌ Test 6 FAILED: Formatting functions not working -', error.message);
        testResults.failed++;
        testResults.issues.push('Formatting functions');
    }
    
    // Test 7: Check if navigation functions exist
    try {
        if (typeof showSection === 'function' && 
            typeof loadSectionData === 'function') {
            console.log('✅ Test 7 PASSED: Navigation functions exist');
            testResults.passed++;
        } else {
            throw new Error('Navigation functions missing');
        }
    } catch (error) {
        console.log('❌ Test 7 FAILED: Navigation functions missing -', error.message);
        testResults.failed++;
        testResults.issues.push('Navigation functions');
    }
    
    // Final Results
    console.log('\n🏁 SYSTEM TEST RESULTS:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.issues.length > 0) {
        console.log('\n🔧 Issues to fix:');
        testResults.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL CRITICAL ISSUES HAVE BEEN RESOLVED!');
        window.utils.showNotification('System test passed! All critical issues resolved.', 'success');
    } else {
        console.log('\n⚠️  Some issues remain. Please check the console for details.');
        window.utils.showNotification(`System test completed. ${testResults.failed} issues remain.`, 'warning');
    }
    
    return testResults;
}

// Auto-run test when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for all scripts to load
    setTimeout(runSystemTest, 2000);
});

// Export for manual testing
window.runSystemTest = runSystemTest;
