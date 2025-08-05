// Navigation with submenu support
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Add active class to clicked nav item
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Initialize charts if dashboard is selected
    if (sectionId === 'dashboard') {
        setTimeout(initializeCharts, 100);
    }
}

function toggleSubmenu(menuId) {
    const submenu = document.getElementById(menuId.replace('-management', '-submenu'));
    const arrow = document.getElementById('debt-arrow');
    
    if (submenu.classList.contains('show')) {
        submenu.classList.remove('show');
        arrow.textContent = '▼';
    } else {
        submenu.classList.add('show');
        arrow.textContent = '▲';
    }
}
