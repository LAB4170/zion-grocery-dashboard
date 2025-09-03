// Global pagination managers registry
window.paginationManagers = window.paginationManagers || {};

// Global function to create pagination manager
window.createPaginationManager = function(containerId, dataKey, renderFunction) {
  const manager = new PaginationManager(containerId, dataKey, renderFunction);
  window.paginationManagers[dataKey] = manager;
  return manager;
};

// Pagination utility functions for products, sales, and debts
// Provides consistent pagination controls across all data tables

class PaginationManager {
  constructor(containerId, dataKey, renderFunction) {
    this.containerId = containerId;
    this.dataKey = dataKey; // 'products', 'sales', 'debts'
    this.renderFunction = renderFunction;
    this.currentPage = 1;
    this.itemsPerPage = 10; // Default
    this.availablePageSizes = [10, 25, 50, 75, 100];
    this.filteredData = [];
    this.originalData = [];
  }

  // Initialize pagination controls
  init() {
    console.log(`Initializing pagination for ${this.dataKey} in container ${this.containerId}`);
    this.createPaginationControls();
    this.loadPreferences();
    this.updateData();
  }

  // Create pagination control elements
  createPaginationControls() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`Pagination container '${this.containerId}' not found`);
      return;
    }

    // Find or create pagination container
    let paginationContainer = container.querySelector('.pagination-container');
    if (!paginationContainer) {
      paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination-container';
      
      // Insert after the search box but before the table
      const searchBox = container.querySelector('.search-box');
      const table = container.querySelector('table');
      
      if (searchBox && table) {
        // Insert between search box and table
        searchBox.parentNode.insertBefore(paginationContainer, table);
      } else if (table) {
        // Insert before the table
        container.insertBefore(paginationContainer, table);
      } else {
        // Append to container
        container.appendChild(paginationContainer);
      }
    }

    paginationContainer.innerHTML = `
      <div class="pagination-controls">
        <div class="pagination-info">
          <span class="items-per-page-label">Items per page:</span>
          <select class="items-per-page-select" onchange="window.paginationManagers['${this.dataKey}'].changePageSize(this.value)">
            ${this.availablePageSizes.map(size => 
              `<option value="${size}" ${size === this.itemsPerPage ? 'selected' : ''}>${size}</option>`
            ).join('')}
          </select>
          <span class="pagination-summary"></span>
        </div>
        <div class="pagination-buttons">
          <button class="pagination-btn" onclick="window.paginationManagers['${this.dataKey}'].goToPage(1)" title="First Page">
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button class="pagination-btn" onclick="window.paginationManagers['${this.dataKey}'].previousPage()" title="Previous Page">
            <i class="fas fa-angle-left"></i>
          </button>
          <span class="page-numbers"></span>
          <button class="pagination-btn" onclick="window.paginationManagers['${this.dataKey}'].nextPage()" title="Next Page">
            <i class="fas fa-angle-right"></i>
          </button>
          <button class="pagination-btn" onclick="window.paginationManagers['${this.dataKey}'].goToPage('last')" title="Last Page">
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Update data and refresh pagination
  updateData(filteredData = null) {
    // Get fresh data from global variables
    this.originalData = window[this.dataKey] || [];
    this.filteredData = filteredData || this.originalData;
    
    // Reset to first page if data changed significantly
    const totalPages = this.getTotalPages();
    if (this.currentPage > totalPages) {
      this.currentPage = 1;
    }

    this.render();
    this.updatePaginationControls();
  }

  // Change items per page
  changePageSize(newSize) {
    this.itemsPerPage = parseInt(newSize);
    this.currentPage = 1; // Reset to first page
    this.render();
    this.updatePaginationControls();
    
    // Save preference to localStorage
    localStorage.setItem(`${this.dataKey}_pageSize`, this.itemsPerPage);
  }

  // Navigate to specific page
  goToPage(page) {
    const totalPages = this.getTotalPages();
    
    if (page === 'last') {
      this.currentPage = totalPages;
    } else {
      page = parseInt(page);
      if (page >= 1 && page <= totalPages) {
        this.currentPage = page;
      }
    }
    
    this.render();
    this.updatePaginationControls();
  }

  // Navigate to previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.render();
      this.updatePaginationControls();
    }
  }

  // Navigate to next page
  nextPage() {
    const totalPages = this.getTotalPages();
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.render();
      this.updatePaginationControls();
    }
  }

  // Get total number of pages
  getTotalPages() {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  // Get current page data
  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  }

  // Render current page data
  render() {
    const pageData = this.getCurrentPageData();
    this.renderFunction(pageData);
  }

  // Update pagination control states
  updatePaginationControls() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const totalPages = this.getTotalPages();
    const totalItems = this.filteredData.length;
    const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

    // Update summary
    const summary = container.querySelector('.pagination-summary');
    if (summary) {
      summary.textContent = `Showing ${startItem}-${endItem} of ${totalItems} items`;
    }

    // Update page size selector
    const pageSelect = container.querySelector('.items-per-page-select');
    if (pageSelect) {
      pageSelect.value = this.itemsPerPage;
    }

    // Update page numbers
    const pageNumbers = container.querySelector('.page-numbers');
    if (pageNumbers) {
      pageNumbers.innerHTML = this.generatePageNumbers();
    }

    // Update button states
    const buttons = container.querySelectorAll('.pagination-btn');
    buttons.forEach((btn, index) => {
      switch(index) {
        case 0: // First
        case 1: // Previous
          btn.disabled = this.currentPage === 1;
          break;
        case 2: // Next
        case 3: // Last
          btn.disabled = this.currentPage === totalPages || totalPages === 0;
          break;
      }
    });
  }

  // Generate page number buttons
  generatePageNumbers() {
    const totalPages = this.getTotalPages();
    if (totalPages <= 1) return `<span class="current-page">1</span>`;

    let pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (this.currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (this.currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages];
      }
    }

    return pages.map(page => {
      if (page === '...') {
        return '<span class="page-ellipsis">...</span>';
      } else if (page === this.currentPage) {
        return `<span class="current-page">${page}</span>`;
      } else {
        return `<button class="page-number" onclick="window.paginationManagers['${this.dataKey}'].goToPage(${page})">${page}</button>`;
      }
    }).join('');
  }

  // Load saved preferences
  loadPreferences() {
    const savedPageSize = localStorage.getItem(`${this.dataKey}_pageSize`);
    if (savedPageSize && this.availablePageSizes.includes(parseInt(savedPageSize))) {
      this.itemsPerPage = parseInt(savedPageSize);
    }
  }
}

// Export for global access
window.PaginationManager = PaginationManager;
