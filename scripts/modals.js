// Modal management functions

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        // Load products for sales modal
        if (modalId === 'salesModal') {
            populateProductSelect();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Hide customer info fields for sales modal
        if (modalId === 'salesModal') {
            document.getElementById('customerInfoGroup').style.display = 'none';
            document.getElementById('customerPhoneGroup').style.display = 'none';
        }
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

function toggleCustomerInfo() {
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    const customerInfoGroup = document.getElementById('customerInfoGroup');
    const customerPhoneGroup = document.getElementById('customerPhoneGroup');
    
    if (paymentMethod === 'debt' || paymentMethod === 'mpesa') {
        customerInfoGroup.style.display = 'block';
        customerPhoneGroup.style.display = 'block';
        
        // Make fields required
        document.getElementById('customerName').required = true;
        document.getElementById('customerPhone').required = true;
    } else {
        customerInfoGroup.style.display = 'none';
        customerPhoneGroup.style.display = 'none';
        
        // Make fields not required
        document.getElementById('customerName').required = false;
        document.getElementById('customerPhone').required = false;
    }
}

