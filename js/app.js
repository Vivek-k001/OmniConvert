/**
 * OmniConvert Main Application Controller
 * Handles Tab Switching, Theme states, and global UI updates
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      const active = btn.dataset.tab === tabId;
      if (active) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/25');
        btn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/25');
        btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // Save active tab preference
    localStorage.setItem('omniconvert_active_tab', tabId);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Restore previous tab or default to 'img-pdf'
  const savedTab = localStorage.getItem('omniconvert_active_tab') || 'img-pdf';
  const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${savedTab}"]`);
  if (targetBtn) {
    switchTab(savedTab);
  } else {
    switchTab('img-pdf');
  }

  // Quick module jump cards on banner/stats if present
  document.querySelectorAll('[data-jump-tab]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(el.dataset.jumpTab);
    });
  });
});
