// ============================================================
// Main Application Controller
// Intellia Health Systems — Financial Planning & Reserving
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initGlobalActions();

  // Initialize all three modules
  ForecastingModule.init();
  BudgetModule.init();
  ReservesModule.init();
});

function initNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  const modules = document.querySelectorAll('.module-view');
  const pageTitle = document.getElementById('pageTitleText');

  const titles = {
    'module-forecasting': 'Operating Revenue Trajectory',
    'module-budget': 'Operating Plan & Variance',
    'module-reserves': 'Claims Reserving & Solvency'
  };

  function switchTab(targetId) {
    // Underline tabs
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetId);
    });

    // Sidebar navigation
    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.tab === targetId);
    });

    // Modules
    modules.forEach(mod => {
      mod.classList.toggle('active', mod.id === targetId);
    });

    // Title
    if (pageTitle && titles[targetId]) {
      pageTitle.textContent = titles[targetId];
    }

    // Trigger re-render of charts inside newly visible module
    window.dispatchEvent(new Event('resize'));
    if (targetId === 'module-forecasting') {
      setTimeout(() => ForecastingModule.render(), 30);
    } else if (targetId === 'module-budget') {
      setTimeout(() => BudgetModule.render(), 30);
    } else if (targetId === 'module-reserves') {
      setTimeout(() => ReservesModule.calculateAndRender(), 30);
    }
  }

  // Bind tab buttons
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });

  // Bind sidebar nav links
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  // Bind back link
  const backBtn = document.getElementById('resetToForecastBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => switchTab('module-forecasting'));
  }
}

function initGlobalActions() {
  const exportBtn = document.getElementById('exportGlobalBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      BudgetModule.exportToCsv();
    });
  }

  const resetBtn = document.getElementById('resetGlobalBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      BudgetModule.init();
      ReservesModule.init();
      ForecastingModule.init();
    });
  }
}
