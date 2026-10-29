// Theme Management
const THEME_KEY = 'python_notes_theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  } else {
    // Default to dark theme for developer-friendly feel
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon('dark');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('.theme-toggle-icon');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    } else {
      icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  });
}

// Toast Notification
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// Copy Code Snippet
function copyCode(button) {
  const codeWrapper = button.closest('.code-wrapper');
  if (!codeWrapper) return;
  const pre = codeWrapper.querySelector('pre');
  if (!pre) return;
  
  const textToCopy = pre.innerText.trim();
  navigator.clipboard.writeText(textToCopy).then(() => {
    const originalText = button.innerHTML;
    button.classList.add('copied');
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Copied!
    `;
    showToast('Code copied to clipboard');
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

// Active TOC Highlighting on Scroll
function initActiveTOC() {
  const sections = document.querySelectorAll('.note-section');
  const navLinks = document.querySelectorAll('.sidebar-link');
  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px -65% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

// Technology Filter & Search for Homepage
function initHomepageSearch() {
  const searchInput = document.getElementById('lectureSearch');
  const filterBtns = document.querySelectorAll('.tech-filter-btn');

  // Technology Filter Pills (All, Python, JavaScript, SQL, Web)
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        const techCards = document.querySelectorAll('[data-category]');

        techCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = card.classList.contains('tech-card') ? 'block' : 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Real-time Keyword Search for Sub-Cards & Tracks
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const subcards = document.querySelectorAll('.module-subcard');
      const futureCards = document.querySelectorAll('.future-tech-card');

      subcards.forEach(card => {
        const title = card.querySelector('.subcard-title')?.innerText.toLowerCase() || '';
        const desc = card.querySelector('.subcard-desc')?.innerText.toLowerCase() || '';
        const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.innerText.toLowerCase()).join(' ');

        if (title.includes(query) || desc.includes(query) || tags.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      futureCards.forEach(card => {
        const title = card.querySelector('h3')?.innerText.toLowerCase() || '';
        const desc = card.querySelector('p')?.innerText.toLowerCase() || '';
        const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.innerText.toLowerCase()).join(' ');

        if (title.includes(query) || desc.includes(query) || tags.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}

// Simple Interactive Python Simulator for Lecture 1 (Arithmetic & Logic)
function runSimulator() {
  const exprInput = document.getElementById('sim-input');
  const resultDisplay = document.getElementById('sim-output');
  if (!exprInput || !resultDisplay) return;

  const inputVal = exprInput.value.trim();
  if (!inputVal) {
    resultDisplay.innerHTML = `<span style="color: #ef4444;">Error: Please enter an expression or values</span>`;
    return;
  }

  try {
    // Safe evaluated subsets: standard math & relational operations
    // Replace Python operators with JS equivalents for simulation
    let clean = inputVal;
    
    // Check if user is testing input variables: e.g. "a = 5, b = 2; a + b"
    if (clean.includes('**')) {
      clean = clean.replace(/\*\*/g, '**');
    }
    
    // Evaluate in safe arithmetic context
    const fn = new Function(`
      "use strict";
      // Support common types
      const True = true;
      const False = false;
      const None = null;
      return (${clean});
    `);

    let res = fn();
    if (res === true) res = 'True (class bool)';
    else if (res === false) res = 'False (class bool)';
    else if (res === null) res = 'None (class NoneType)';
    else if (typeof res === 'number') {
      res = Number.isInteger(res) ? `${res} (class int)` : `${res} (class float)`;
    } else if (typeof res === 'string') {
      res = `'${res}' (class str)`;
    }

    resultDisplay.innerHTML = `<span style="color: #34d399;">>>> ${res}</span>`;
  } catch (err) {
    resultDisplay.innerHTML = `<span style="color: #f87171;">Python SyntaxError / Evaluation Error: ${err.message}</span>`;
  }
}

// Sidebar Visibility & Drawer Management
const SIDEBAR_STORAGE_KEY = 'python_notes_sidebar';

function initSidebar() {
  const sidebarNav = document.getElementById('sidebarNav');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const floatingBtn = document.getElementById('floatingTocBtn');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (!sidebarNav) return;

  // Restore saved desktop state
  const isMobile = window.innerWidth <= 992;
  const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);

  if (!isMobile && savedState === 'collapsed') {
    document.body.classList.add('sidebar-collapsed');
    updateSidebarToggleUI(true);
  }

  // Navbar Toggle Button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  // Sidebar Internal Close Button (✕)
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        closeMobileSidebar();
      } else {
        collapseDesktopSidebar(true);
      }
    });
  }

  // Floating TOC Button
  if (floatingBtn) {
    floatingBtn.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        openMobileSidebar();
      } else {
        collapseDesktopSidebar(false);
      }
    });
  }

  // Backdrop overlay click (closes mobile drawer)
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }

  // Auto-close drawer on mobile when user clicks any TOC link
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        closeMobileSidebar();
      }
    });
  });

  // Keyboard shortcut: Pressing '[' or '\' toggles the sidebar
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '[' || e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
  });
}

function toggleSidebar() {
  if (window.innerWidth <= 992) {
    const sidebar = document.getElementById('sidebarNav');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  } else {
    const isCurrentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
    collapseDesktopSidebar(!isCurrentlyCollapsed);
  }
}

function collapseDesktopSidebar(shouldCollapse) {
  if (shouldCollapse) {
    document.body.classList.add('sidebar-collapsed');
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'collapsed');
    updateSidebarToggleUI(true);
    showToast('Sidebar hidden &bull; Full-width notes view');
  } else {
    document.body.classList.remove('sidebar-collapsed');
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'expanded');
    updateSidebarToggleUI(false);
    showToast('Sidebar visible');
  }
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (backdrop) backdrop.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
}

function updateSidebarToggleUI(isCollapsed) {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (!toggleBtn) return;
  const btnText = toggleBtn.querySelector('.sidebar-btn-text');
  
  if (isCollapsed) {
    if (btnText) btnText.textContent = 'Show Contents';
    toggleBtn.setAttribute('title', 'Show Table of Contents Sidebar');
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      <span class="sidebar-btn-text">Show Contents</span>
    `;
  } else {
    if (btnText) btnText.textContent = 'Hide Contents';
    toggleBtn.setAttribute('title', 'Hide Table of Contents Sidebar');
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
      <span class="sidebar-btn-text">Hide Contents</span>
    `;
  }
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initActiveTOC();
  initHomepageSearch();

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Bind Enter key in simulator
  const simInput = document.getElementById('sim-input');
  if (simInput) {
    simInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        runSimulator();
      }
    });
  }
});
