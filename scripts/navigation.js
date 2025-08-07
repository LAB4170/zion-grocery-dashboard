// Navigation and section management
let currentSection = null;

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', function() {
    // Get all available sections
    const sections = document.querySelectorAll('.section');
    
    if (sections.length === 0) {
        console.warn('No sections found in DOM');
        return;
    }
    
    // Try to find the dashboard section or use the first available section
    const defaultSection = document.getElementById('dashboard') || sections[0];
    
    if (defaultSection) {
        currentSection = defaultSection.id || 'section-0';
        showSection(currentSection, true);
    }
});

function showSection(sectionId, isInitialLoad = false) {
    // Validate sectionId
    if (!sectionId || typeof sectionId !== 'string') {
        console.warn('Invalid section ID:', sectionId);
        return;
    }

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section with validation
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.warn(`Section with ID '${sectionId}' not found in DOM`);
        
        // Fallback logic - only show error if not initial load
        if (!isInitialLoad) {
            if (currentSection && document.getElementById(currentSection)) {
                // Return to previous section if available
                showSection(currentSection);
            } else if (sections.length > 0) {
                // Fallback to first available section
                showSection(sections[0].id);
            }
        }
        return;
    }
    
    targetSection.classList.remove('hidden');
    currentSection = sectionId;
    
    // Update active navigation item
    updateActiveNavItem(sectionId);
    
    // Load section-specific data
    loadSectionData(sectionId);
}

function updateActiveNavItem(sectionId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the clicked nav item
    const activeItem = Array.from(navItems).find(item => {
        const onclickAttr = item.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(`showSection('${sectionId}')`);
    });
    
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function loadSectionData(sectionId) {
    // Validate sectionId
    if (!sectionId) return;

    const sectionLoaders = {
        'dashboard': () => typeof loadDashboardData === 'function' && loadDashboardData(),
        'sales': () => typeof loadSalesData === 'function' && loadSalesData(),
        'sales-settings': () => typeof loadProductsData === 'function' && loadProductsData(),
        'expenses': () => typeof loadExpensesData === 'function' && loadExpensesData(),
        'individual-debts': () => typeof loadDebtsData === 'function' && loadDebtsData(),
        'grouped-debts': () => typeof loadGroupedDebtsData === 'function' && loadGroupedDebtsData(),
        'mpesa': () => typeof loadMpesaData === 'function' && loadMpesaData(),
        'sales-reports': () => console.log('Reports section loaded')
    };

    const loader = sectionLoaders[sectionId];
    if (loader) {
        try {
            loader();
        } catch (error) {
            console.error(`Error loading data for section ${sectionId}:`, error);
        }
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
    }
}

function switchToSection(sectionId) {
    if (!sectionId) return;
    
    if (document.getElementById(sectionId)) {
        showSection(sectionId);
    } else if (currentSection && document.getElementById(currentSection)) {
        showSection(currentSection);
    }
}
