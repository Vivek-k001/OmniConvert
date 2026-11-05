/**
 * OmniConvert Core App Controller
 * Handles Home Default, iOS Tab Switching, Clickable Home Icons, and Dark/Light Theme
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  window.switchTab = function(tabId) {
    // Update nav buttons
    tabButtons.forEach(btn => {
      const active = btn.dataset.tab === tabId;
      if (active) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle panels
    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    localStorage.setItem('omniconvert_active_tab', tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Nav buttons click
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.switchTab(btn.dataset.tab);
    });
  });

  // HOME CARD CLICKS: Ensure every [data-jump-tab] switches properly
  document.addEventListener('click', (e) => {
    const jumpCard = e.target.closest('[data-jump-tab]');
    if (jumpCard) {
      e.preventDefault();
      const target = jumpCard.getAttribute('data-jump-tab');
      if (target) {
        window.switchTab(target);
      }
    }
  });

  // Default to 'home'
  const savedTab = localStorage.getItem('omniconvert_active_tab') || 'home';
  window.switchTab(savedTab);

  // Light / Dark Theme Toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const htmlRoot = document.documentElement;

  function applyTheme(isLight) {
    if (isLight) {
      htmlRoot.classList.remove('dark');
      htmlRoot.classList.add('light');
      localStorage.setItem('omniconvert_theme', 'light');
    } else {
      htmlRoot.classList.remove('light');
      htmlRoot.classList.add('dark');
      localStorage.setItem('omniconvert_theme', 'dark');
    }
  }

  const savedTheme = localStorage.getItem('omniconvert_theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    applyTheme(true);
  } else {
    applyTheme(false);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isCurrentlyLight = htmlRoot.classList.contains('light');
      applyTheme(!isCurrentlyLight);
    });
  }
});
