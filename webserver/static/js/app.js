/**
 * QR Code Generator - Client Logic
 * Simplified Sidebar Tool Navigation + Clean Live Preview & Download
 * 
 * Features:
 * - Sidebar tool tabs (Desktop rail + Mobile tab bar)
 * - Clean right navy panel (Status, Compact White QR Card, Mint Download HD)
 * - Lossless 1300px HD download via Python backend
 * - Debounced live preview with AbortController
 * - Zero-flicker light/dark theme switcher
 * - Contrast scanner & WCAG warning
 * - Drag-and-drop logo upload
 * - Form state persistence across reloads
 */

(() => {
  'use strict';

  // DOM Elements
  const form = document.getElementById('qrForm');
  const qrDataInput = document.getElementById('qrDataInput');
  const previewImg = document.getElementById('qrImage');
  const previewLoader = document.getElementById('previewLoader');
  const previewEmpty = document.getElementById('previewEmpty');
  const previewError = document.getElementById('previewError');
  const previewErrorMsg = document.getElementById('previewErrorMsg');
  const retryBtn = document.getElementById('retryBtn');
  const previewStatus = document.getElementById('previewStatus');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadCaption = document.getElementById('downloadCaption');
  const frameExtra = document.getElementById('frameExtra');
  const logoDropzone = document.getElementById('logoDropzone');
  const logoInput = document.getElementById('logoInput');
  const logoInfo = document.getElementById('logoFileInfo');
  const logoName = document.getElementById('logoFileName');
  const clearLogoBtn = document.getElementById('clearLogoBtn');
  const contrastWarning = document.getElementById('contrastWarning');
  const focusEditorBtn = document.getElementById('focusEditorBtn');

  // Request & State Management
  let activeAbortController = null;
  const SETTINGS_KEY = 'qr_form_settings_v3';

  /**
   * Utility: Debounce function execution
   */
  function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Form Settings Persistence
   */
  function saveSettings() {
    if (!form) return;
    try {
      const state = {
        data: qrDataInput?.value || '',
        data_color: form.querySelector('input[name="data_color"]')?.value,
        eye_color: form.querySelector('input[name="eye_color"]')?.value,
        bg_color: form.querySelector('input[name="bg_color"]')?.value,
        shape: form.querySelector('input[name="shape"]:checked')?.value,
        frame_style: form.querySelector('input[name="frame_style"]:checked')?.value,
        frame_text: form.querySelector('input[name="frame_text"]')?.value,
        frame_color: form.querySelector('input[name="frame_color"]')?.value,
        text_color: form.querySelector('input[name="text_color"]')?.value,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function restoreSettings() {
    if (!form) return;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state) return;

      if (state.data !== undefined && qrDataInput) {
        qrDataInput.value = state.data;
      }
      if (state.data_color) {
        const el = form.querySelector('input[name="data_color"]');
        if (el) { el.value = state.data_color; syncColorLabel(el); }
      }
      if (state.eye_color) {
        const el = form.querySelector('input[name="eye_color"]');
        if (el) { el.value = state.eye_color; syncColorLabel(el); }
      }
      if (state.bg_color) {
        const el = form.querySelector('input[name="bg_color"]');
        if (el) { el.value = state.bg_color; syncColorLabel(el); }
      }
      if (state.shape) {
        const el = form.querySelector(`input[name="shape"][value="${state.shape}"]`);
        if (el) el.checked = true;
      }
      if (state.frame_style) {
        const el = form.querySelector(`input[name="frame_style"][value="${state.frame_style}"]`);
        if (el) el.checked = true;
      }
      if (state.frame_text) {
        const el = form.querySelector('input[name="frame_text"]');
        if (el) el.value = state.frame_text;
      }
      if (state.frame_color) {
        const el = form.querySelector('input[name="frame_color"]');
        if (el) { el.value = state.frame_color; syncColorLabel(el); }
      }
      if (state.text_color) {
        const el = form.querySelector('input[name="text_color"]');
        if (el) { el.value = state.text_color; syncColorLabel(el); }
      }
    } catch (e) {}
  }

  /**
   * Theme Management (Light default, Dark optional)
   */
  function initTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('qr_theme') || 'light';
    applyThemeUI(currentTheme);

    const toggleButtons = document.querySelectorAll('.themeToggleBtn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.documentElement.classList.add('theme-transitioning');
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        
        if (nextTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        
        localStorage.setItem('qr_theme', nextTheme);
        applyThemeUI(nextTheme);

        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 180);
      });
    });
  }

  function applyThemeUI(theme) {
    const moonIcons = document.querySelectorAll('.themeIconMoon');
    const sunIcons = document.querySelectorAll('.themeIconSun');
    const labels = document.querySelectorAll('.themeLabel');

    if (theme === 'dark') {
      moonIcons.forEach(el => el.classList.add('hidden'));
      sunIcons.forEach(el => el.classList.remove('hidden'));
      labels.forEach(el => el.textContent = 'Light');
    } else {
      moonIcons.forEach(el => el.classList.remove('hidden'));
      sunIcons.forEach(el => el.classList.add('hidden'));
      labels.forEach(el => el.textContent = 'Dark');
    }
  }

  /**
   * Sidebar Tool Tab Switching with Smooth Sliding Indicators & Directional Panel Animations
   */
  let currentTabIndex = 1; // Default is tabShapeColor (index 1)

  function setupToolTabs() {
    const tabButtons = document.querySelectorAll('[data-tool-tab]');
    const tabPanels = document.querySelectorAll('.tool-tab-panel');
    const railIndicator = document.getElementById('railIndicator');
    const mobileIndicator = document.getElementById('mobileTabIndicator');

    function updateRailIndicator(targetBtn) {
      if (!railIndicator || !targetBtn) return;
      railIndicator.style.transform = `translateY(${targetBtn.offsetTop}px)`;
    }

    function updateMobileIndicator(targetBtn) {
      if (!mobileIndicator || !targetBtn) return;
      mobileIndicator.style.width = `${targetBtn.offsetWidth}px`;
      mobileIndicator.style.transform = `translateX(${targetBtn.offsetLeft}px)`;
    }

    function activateTab(tabId, clickedBtn = null) {
      if (!tabId) return;

      let newIndex = currentTabIndex;
      if (clickedBtn && clickedBtn.hasAttribute('data-tab-index')) {
        newIndex = parseInt(clickedBtn.getAttribute('data-tab-index'), 10);
      } else {
        const found = document.querySelector(`[data-tool-tab="${tabId}"][data-tab-index]`);
        if (found) newIndex = parseInt(found.getAttribute('data-tab-index'), 10);
      }

      const isSlidingDown = newIndex >= currentTabIndex;
      currentTabIndex = newIndex;

      // Update button active states and move indicators smoothly
      tabButtons.forEach(btn => {
        const match = btn.getAttribute('data-tool-tab') === tabId;
        if (match) {
          btn.classList.add('active');
          if (btn.hasAttribute('aria-selected')) {
            btn.setAttribute('aria-selected', 'true');
          }
          if (btn.closest('.rail-capsule')) {
            updateRailIndicator(btn);
          }
          if (btn.closest('.mobile-tool-tabs')) {
            updateMobileIndicator(btn);
          }
        } else {
          btn.classList.remove('active');
          if (btn.hasAttribute('aria-selected')) {
            btn.setAttribute('aria-selected', 'false');
          }
        }
      });

      // Show the selected tool panel with directional slide & fade animation
      tabPanels.forEach(panel => {
        if (panel.id === tabId) {
          panel.classList.remove('slide-from-bottom', 'slide-from-top');
          void panel.offsetWidth; // Force reflow to retrigger CSS animation smoothly
          panel.classList.add('is-active');
          if (isSlidingDown) {
            panel.classList.add('slide-from-bottom');
          } else {
            panel.classList.add('slide-from-top');
          }
        } else {
          panel.classList.remove('is-active', 'slide-from-bottom', 'slide-from-top');
        }
      });

      // Special action for Content tab: focus the main textarea
      if (tabId === 'tabContent' && qrDataInput) {
        qrDataInput.focus();
      }
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tool-tab');
        activateTab(targetTab, btn);
      });
    });

    // Initialize indicator positions
    const initialRailBtn = document.querySelector('.rail-capsule .rail-btn.active');
    if (initialRailBtn) {
      updateRailIndicator(initialRailBtn);
    }
    const initialMobileBtn = document.querySelector('.mobile-tool-tabs .mobile-tab-btn.active');
    if (initialMobileBtn) {
      setTimeout(() => updateMobileIndicator(initialMobileBtn), 50);
    }

    // Keep indicators aligned on window resize
    window.addEventListener('resize', debounce(() => {
      const activeRail = document.querySelector('.rail-capsule .rail-btn.active');
      if (activeRail) updateRailIndicator(activeRail);
      const activeMobile = document.querySelector('.mobile-tool-tabs .mobile-tab-btn.active');
      if (activeMobile) updateMobileIndicator(activeMobile);
    }, 100));

    if (focusEditorBtn && qrDataInput) {
      focusEditorBtn.addEventListener('click', () => {
        qrDataInput.focus();
        qrDataInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  /**
   * WCAG Relative Luminance
   */
  function getLuminance(hex) {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return 0;
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const sRGB = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  /**
   * Contrast Ratio Check (DESIGN.md 4.6)
   */
  function checkContrastValidation() {
    if (!contrastWarning) return;
    const dataColor = form.querySelector('input[name="data_color"]')?.value || '#000000';
    const bgColor = form.querySelector('input[name="bg_color"]')?.value || '#ffffff';

    const lumFg = getLuminance(dataColor);
    const lumBg = getLuminance(bgColor);

    const lighter = Math.max(lumFg, lumBg);
    const darker = Math.min(lumFg, lumBg);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    const isLowContrast = ratio < 4.0 || lumFg > lumBg;

    if (isLowContrast) {
      contrastWarning.classList.remove('hidden');
    } else {
      contrastWarning.classList.add('hidden');
    }
  }

  /**
   * Update visual loading & status indicator
   */
  function setPreviewState(state, message = '') {
    if (!previewStatus) return;

    if (state === 'updating') {
      previewStatus.textContent = 'Updating…';
      previewStatus.className = 'font-mono text-xs text-[var(--on-navy-muted)]';
      if (previewLoader) previewLoader.classList.remove('hidden');
    } else if (state === 'success') {
      previewStatus.textContent = 'Up to date';
      previewStatus.className = 'font-mono text-xs text-[var(--mint)]';
      if (previewLoader) previewLoader.classList.add('hidden');
      if (previewError) previewError.classList.add('hidden');
    } else if (state === 'error') {
      previewStatus.textContent = 'Gagal membuat QR';
      previewStatus.className = 'font-mono text-xs text-[var(--danger)]';
      if (previewLoader) previewLoader.classList.add('hidden');
      if (previewError && previewErrorMsg) {
        previewErrorMsg.textContent = message || 'Server tidak merespons. Silakan coba lagi.';
        previewError.classList.remove('hidden');
      }
    } else if (state === 'empty') {
      previewStatus.textContent = 'Input kosong';
      previewStatus.className = 'font-mono text-xs text-[var(--on-navy-muted)]';
      if (previewLoader) previewLoader.classList.add('hidden');
    }
  }

  /**
   * Fetch QR code preview from Python backend
   */
  async function updatePreview() {
    if (!form) return;

    const dataValue = qrDataInput ? qrDataInput.value.trim() : '';

    if (!dataValue) {
      if (previewImg) previewImg.classList.add('hidden');
      if (previewEmpty) previewEmpty.classList.remove('hidden');
      if (previewError) previewError.classList.add('hidden');
      if (downloadBtn) downloadBtn.disabled = true;
      if (downloadCaption) {
        downloadCaption.textContent = 'Masukkan URL atau teks untuk membuat QR';
      }
      setPreviewState('empty');
      return;
    }

    if (previewEmpty) previewEmpty.classList.add('hidden');
    if (previewImg) previewImg.classList.remove('hidden');
    if (downloadBtn) downloadBtn.disabled = false;
    if (downloadCaption) {
      downloadCaption.textContent = 'PNG 1300px, dibuat oleh server Python';
    }

    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    setPreviewState('updating');

    try {
      const formData = new FormData(form);
      const response = await fetch('/generate_preview', {
        method: 'POST',
        body: formData,
        signal: activeAbortController.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.image) {
        previewImg.src = `data:image/png;base64,${data.image}`;
        setPreviewState('success');
      } else if (data.error) {
        setPreviewState('error', data.error);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to generate preview:', err);
      setPreviewState('error', 'Gagal membuat QR: server tidak merespons');
    }
  }

  const debouncedPreview = debounce(updatePreview, 200);

  /**
   * High-resolution Download Handler (1300px)
   */
  async function handleDownload() {
    if (!downloadBtn || !form || downloadBtn.disabled) return;

    const originalContent = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-[var(--on-mint)]" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span>Membuat HD…</span>
    `;

    try {
      const formData = new FormData(form);
      const response = await fetch('/download', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Download HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'custom_qr_1300px.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal mengunduh QR resolusi tinggi. Periksa server dan coba lagi.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalContent;
    }
  }

  /**
   * Sync hex labels for color inputs
   */
  function syncColorLabel(input) {
    const hexSpan = document.querySelector(`[data-hex-for="${input.name}"]`);
    if (hexSpan) {
      hexSpan.textContent = input.value.toUpperCase();
    }
  }

  /**
   * Toggle visibility of Frame extra options
   */
  function syncFrameExtraVisibility() {
    if (!frameExtra) return;
    const selectedFrame = form.querySelector('input[name="frame_style"]:checked')?.value || 'none';
    if (selectedFrame === 'none') {
      frameExtra.classList.add('hidden');
    } else {
      frameExtra.classList.remove('hidden');
    }
  }

  /**
   * Quick Palette Presets (DESIGN.md 4.6)
   */
  function setupColorPresets() {
    document.querySelectorAll('[data-preset-fg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fg = btn.getAttribute('data-preset-fg');
        const bg = btn.getAttribute('data-preset-bg');

        const fgInput = form.querySelector('input[name="data_color"]');
        const eyeInput = form.querySelector('input[name="eye_color"]');
        const bgInput = form.querySelector('input[name="bg_color"]');

        if (fgInput) {
          fgInput.value = fg;
          syncColorLabel(fgInput);
        }
        if (eyeInput) {
          eyeInput.value = fg;
          syncColorLabel(eyeInput);
        }
        if (bgInput) {
          bgInput.value = bg;
          syncColorLabel(bgInput);
        }

        checkContrastValidation();
        saveSettings();
        updatePreview();
      });
    });
  }

  /**
   * Logo Dropzone & File Handling (DESIGN.md 4.8)
   */
  function setupLogoDropzone() {
    if (!logoDropzone || !logoInput) return;

    logoDropzone.addEventListener('click', () => {
      logoInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      logoDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        logoDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      logoDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        logoDropzone.classList.remove('drag-over');
      });
    });

    logoDropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        logoInput.files = e.dataTransfer.files;
        handleLogoFileChange();
      }
    });

    logoInput.addEventListener('change', handleLogoFileChange);

    if (clearLogoBtn) {
      clearLogoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        logoInput.value = '';
        if (logoInfo) logoInfo.classList.add('hidden');
        updatePreview();
      });
    }
  }

  function handleLogoFileChange() {
    if (logoInput.files && logoInput.files[0]) {
      const file = logoInput.files[0];
      if (logoName) logoName.textContent = file.name;
      if (logoInfo) logoInfo.classList.remove('hidden');
    } else {
      if (logoInfo) logoInfo.classList.add('hidden');
    }
    updatePreview();
  }

  /**
   * Initialize App Logic
   */
  function init() {
    initTheme();
    restoreSettings();

    if (form) {
      form.addEventListener('submit', (e) => e.preventDefault());
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', updatePreview);
    }

    // Textarea input -> debounced preview & save
    if (qrDataInput) {
      qrDataInput.addEventListener('input', () => {
        saveSettings();
        debouncedPreview();
      });
    }

    // Color inputs -> immediate label sync, contrast check, debounced preview & save
    const colorInputs = form.querySelectorAll('input[type="color"]');
    colorInputs.forEach(el => {
      syncColorLabel(el);
      el.addEventListener('input', () => {
        syncColorLabel(el);
        checkContrastValidation();
        saveSettings();
        debouncedPreview();
      });
      el.addEventListener('change', () => {
        syncColorLabel(el);
        checkContrastValidation();
        saveSettings();
        updatePreview();
      });
    });

    // Frame text input
    const frameTextInput = document.getElementById('frameTextInput');
    if (frameTextInput) {
      frameTextInput.addEventListener('input', () => {
        saveSettings();
        debouncedPreview();
      });
    }

    // Radio inputs (Shape & Frame) -> immediate preview & save
    const radioInputs = form.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(el => {
      el.addEventListener('change', () => {
        if (el.name === 'frame_style') {
          syncFrameExtraVisibility();
        }
        saveSettings();
        updatePreview();
      });
    });

    // Setup interactive modules
    setupToolTabs();
    setupColorPresets();
    setupLogoDropzone();
    checkContrastValidation();

    // Download trigger
    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleDownload);
    }

    // Initial sync & render
    syncFrameExtraVisibility();
    updatePreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
