// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Populate product dropdown if sales modal
    if (modalId === 'salesModal') {
        populateProductDropdown();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Reset forms when closing
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
    }
}
