// Navigation and section management

let currentSection = 'dashboard';

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    } else {
        console.warn(`Section with ID '${sectionId}' not found`);
        return;
    }
    
    // Update active navigation item
    updateActiveNavItem(sectionId);
    
    currentSection = sectionId;
    
    // Load section-specific data with error handling
    try {
        loadSectionData(sectionId);
    } catch (error) {
        console.error(`Error loading data for section ${sectionId}:`, error);
        showNotification(`Error loading ${sectionId} section`, 'error');
    }
}

function updateActiveNavItem(sectionId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the clicked nav item
    navItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`showSection('${sectionId}')`)) {
            item.classList.add('active');
        }
    });
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'sales':
            if (typeof loadSalesData === 'function') {
                loadSalesData();
            }
            break;
        case 'sales-settings':
            if (typeof loadProductsData === 'function') {
                loadProductsData();
            }
            break;
        case 'expenses':
            if (typeof loadExpensesData === 'function') {
                loadExpensesData();
            }
            break;
        case 'individual-debts':
            if (typeof loadDebtsData === 'function') {
                loadDebtsData();
            }
            break;
        case 'grouped-debts':
            if (typeof loadGroupedDebtsData === 'function') {
                loadGroupedDebtsData();
            }
            break;
        case 'mpesa':
            if (typeof loadMpesaData === 'function') {
                loadMpesaData();
            }
            break;
        case 'sales-reports':
            // Reports are loaded on demand
            console.log('Reports section loaded');
            break;
        default:
            console.log(`No specific loader for section: ${sectionId}`);
    }
}

function toggleSubmenu(menuId) {
    const submenuId = `${menuId.replace('-management', '')}-submenu`;
    const arrowId = `${menuId.replace('-management', '')}-arrow`;
    
    const submenu = document.getElementById(submenuId);
    const arrow = document.getElementById(arrowId);
    
    if (submenu) {
        const isVisible = submenu.style.display === 'block';
        submenu.style.display = isVisible ? 'none' : 'block';
        
        if (arrow) {
            arrow.textContent = isVisible ? '▼' : '▲';
        }
    } else {
        console.warn(`Submenu with ID '${submenuId}' not found`);
    }
}

// Safe section switching with validation
function switchToSection(sectionId) {
    if (document.getElementById(sectionId)) {
        showSection(sectionId);
    } else {
        console.error(`Cannot switch to section '${sectionId}' - section not found`);
        showNotification(`Section '${sectionId}' not available`, 'error');
    }
}
