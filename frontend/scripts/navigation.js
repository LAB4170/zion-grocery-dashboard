// Navigation and section management - FIXED VERSION
let currentSection = null;

// Wait for partials to load before initializing
function initializeNavigation() {
  // Get all available sections
  const sections = document.querySelectorAll(".section");

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

  // Show selected section with validation
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) {
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

  targetSection.classList.remove("hidden");
  currentSection = sectionId;
  window.currentSection = sectionId; // FIX: Update global reference

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

  // FIX: Only sync global variables once, not every time
  if (!window.dataInitialized) {
    window.products = window.utils.getFromStorage("products", []);
    window.sales = window.utils.getFromStorage("sales", []);
    window.expenses = window.utils.getFromStorage("expenses", []);
    window.debts = window.utils.getFromStorage("debts", []);
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
      if (typeof loadSalesData === "function") loadSalesData();
      if (typeof populateProductSelect === "function") populateProductSelect();
    },
    products: () => {
      if (typeof loadProductsData === "function") loadProductsData();
    },
    "sales-settings": () => {
      if (typeof loadProductsData === "function") loadProductsData();
    },
    expenses: () => {
      if (typeof loadExpensesData === "function") loadExpensesData();
    },
    "individual-debts": () => {
      if (typeof loadDebtsData === "function") loadDebtsData();
    },
    "grouped-debts": () => {
      if (typeof loadGroupedDebtsData === "function") loadGroupedDebtsData();
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

// FIX: Force data refresh function for critical operations
function forceDataRefresh() {
  window.products = window.utils.getFromStorage("products", []);
  window.sales = window.utils.getFromStorage("sales", []);
  window.expenses = window.utils.getFromStorage("expenses", []);
  window.debts = window.utils.getFromStorage("debts", []);

  // Reload current section
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
