// Navigation and section management - FIXED VERSION
let currentSection = null;

// Wait for partials to load before initializing
function initializeNavigation() {
  // Get all available sections
  const sections = document.querySelectorAll(".content-section");

  if (sections.length === 0) {
    console.warn("No sections found in DOM - retrying in 500ms");
    setTimeout(initializeNavigation, 500);
    return;
  }

  // Try to find the dashboard section or use the first available section
  const defaultSection = document.getElementById("dashboard") || sections[0];

  if (defaultSection) {
    currentSection = defaultSection.id || "section-0";
    showSection(currentSection, true);
  }
}

// Navigation will be initialized manually after partials load
// No automatic DOMContentLoaded initialization

function showSection(sectionId, isInitialLoad = false) {
  // Validate sectionId
  if (!sectionId || typeof sectionId !== "string") {
    console.warn("Invalid section ID:", sectionId);
    return;
  }

  // Hide all sections
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  // Show the selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove("hidden");
    window.currentSection = sectionId;

    // Initialize pagination for the current section after showing it
    setTimeout(() => {
      switch (sectionId) {
        case "products":
          if (typeof window.initializeProductsPagination === "function") {
            window.initializeProductsPagination();
          }
          if (typeof window.loadProductsData === "function") {
            window.loadProductsData();
          }
          break;
        case "sales":
          if (typeof window.initializeSalesPagination === "function") {
            window.initializeSalesPagination();
          }
          if (typeof window.loadSalesData === "function") {
            window.loadSalesData();
          }
          break;
        case "individual-debts":
          if (typeof window.initializeDebtsPagination === "function") {
            window.initializeDebtsPagination();
          }
          if (typeof window.loadDebtsData === "function") {
            window.loadDebtsData();
          }
          break;
        case "dashboard":
          if (typeof window.updateDashboardStats === "function") {
            window.updateDashboardStats();
          }
          break;
        default:
          console.log(`No pagination setup for section: ${sectionId}`);
      }
    }, 100);
  } else {
    console.warn(`Section with ID '${sectionId}' not found in DOM`);

    // Enhanced fallback logic
    if (!isInitialLoad) {
      if (currentSection && document.getElementById(currentSection)) {
        // Return to previous section if available
        showSection(currentSection);
      } else if (sections.length > 0) {
        // Fallback to first available section
        showSection(sections[0].id);
      }
    } else {
      // For initial load, wait and retry
      console.log("Initial load - retrying in 500ms");
      setTimeout(() => showSection(sectionId, false), 500);
    }
    return;
  }

  // Update active navigation item
  updateActiveNavItem(sectionId);

  // Load section-specific data
  loadSectionData(sectionId);
}

function updateActiveNavItem(sectionId) {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));

  // Find and activate the clicked nav item
  const activeItem = Array.from(navItems).find((item) => {
    const onclickAttr = item.getAttribute("onclick");
    return onclickAttr && onclickAttr.includes(`showSection('${sectionId}')`);
  });

  if (activeItem) {
    activeItem.classList.add("active");
  }
}

function loadSectionData(sectionId) {
  // Validate sectionId
  if (!sectionId) return;

  // FIX: Use database-only architecture - no localStorage dependencies
  if (!window.dataInitialized) {
    // Initialize empty arrays - data will be loaded from database by individual sections
    window.products = [];
    window.sales = [];
    window.expenses = [];
    window.debts = [];
    window.dataInitialized = true;
  }

  const sectionLoaders = {
    dashboard: () => {
      if (typeof window.loadDashboardData === "function") {
        window.loadDashboardData();
      } else if (typeof window.updateDashboardStats === "function") {
        window.updateDashboardStats();
      }
    },
    sales: () => {
      // Initialize pagination first, then load data
      if (typeof window.initializeSalesPagination === "function") {
        window.initializeSalesPagination();
      }
      if (typeof window.loadSalesData === "function") {
        window.loadSalesData();
      }
      if (typeof window.populateProductSelect === "function") {
        window.populateProductSelect();
      }
    },
    products: () => {
      // Initialize pagination first, then load data
      console.log('Loading products section - initializing pagination');
      if (typeof window.initializeProductsPagination === "function") {
        window.initializeProductsPagination();
      }
      
      // Load data after a short delay to ensure pagination is ready
      if (typeof window.loadProductsData === "function") {
        window.loadProductsData();
      }
    },
    "sales-settings": () => {
      if (typeof window.loadProductsData === "function") {
        window.loadProductsData();
      }
    },
    expenses: () => {
      if (typeof window.loadExpensesData === "function") {
        window.loadExpensesData();
      }
    },
    "individual-debts": () => {
      if (typeof window.loadDebtsData === "function") {
        window.loadDebtsData();
      }
    },
    "grouped-debts": () => {
      if (typeof window.loadGroupedDebtsData === "function") {
        window.loadGroupedDebtsData();
      }
    },
    "sales-reports": () => console.log("Reports section loaded"),
  };

  const loader = sectionLoaders[sectionId];
  if (loader) {
    try {
      loader();
    } catch (error) {
      console.error(`Error loading data for section ${sectionId}:`, error);
      window.utils.showNotification(
        `Error loading ${sectionId} section`,
        "error"
      );
    }
  }
}

function toggleSubmenu(menuId) {
  const submenuId = `${menuId.replace("-management", "")}-submenu`;
  const arrowId = `${menuId.replace("-management", "")}-arrow`;

  const submenu = document.getElementById(submenuId);
  const arrow = document.getElementById(arrowId);

  if (submenu) {
    const isVisible = submenu.style.display === "block";
    submenu.style.display = isVisible ? "none" : "block";

    if (arrow) {
      arrow.textContent = isVisible ? "▼" : "▲";
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

// FIX: Database-only data refresh function (no localStorage)
function forceDataRefresh() {
  // Reset data arrays - let individual sections load from database
  window.products = [];
  window.sales = [];
  window.expenses = [];
  window.debts = [];

  // Reload current section data from database
  if (currentSection) {
    loadSectionData(currentSection);
  }

  // Update dashboard if it's visible
  if (typeof window.updateDashboardStats === "function") {
    window.updateDashboardStats();
  }
}

// Export for global access
window.forceDataRefresh = forceDataRefresh;
