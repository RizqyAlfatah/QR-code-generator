/**
 * QR Code Generator - Client Logic
 * Implements DESIGN.md:
 * - Debounced preview with AbortController
 * - Color contrast scanner validation (WCAG-based)
 * - Preset palettes
 * - Section chip active states
 * - Empty state & download validation
 * - Light/Dark theme switching
 */

(() => {
  'use strict';

  // DOM Elements
  const form = document.getElementById('qrForm');
  const qrDataInput = document.getElementById('qrDataInput');
  const previewImg = document.getElementById('qrImage');
  const previewEmpty = document.getElementById('previewEmpty');
  const previewError = document.getElementById('previewError');
  const previewErrorMsg = document.getElementById('previewErrorMsg');
  const retryBtn = document.getElementById('retryBtn');
  const previewStatus = document.getElementById('previewStatus');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadCaption = document.getElementById('downloadCaption');
  const frameExtra = document.getElementById('frameExtra');
  const logoInput = document.getElementById('logoInput');
  const logoInfo = document.getElementById('logoFileInfo');
  const logoName = document.getElementById('logoFileName');
  const clearLogoBtn = document.getElementById('clearLogoBtn');
  const contrastWarning = document.getElementById('contrastWarning');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Request Management
  let activeAbortController = null;

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

  const SETTINGS_KEY = 'qr_form_settings';

  /**
   * Form Settings Persistence (Remembers last used colors and values on reload)
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
   * Theme Manager (Zero-flicker reload & smooth click transitions)
   */
  function initTheme() {
    // Read the current theme already established by synchronous <head> script
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('qr_theme') || 'light';
    applyThemeUI(currentTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        // Enable smooth transition ONLY during user click
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

        // Remove transition class after animation completes
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 200);
      });
    }
  }

  function applyThemeUI(theme) {
    const moonIcon = document.getElementById('themeIconMoon');
    const sunIcon = document.getElementById('themeIconSun');

    if (theme === 'dark') {
      if (moonIcon) moonIcon.classList.add('hidden');
      if (sunIcon) sunIcon.classList.remove('hidden');
    } else {
      if (moonIcon) moonIcon.classList.remove('hidden');
      if (sunIcon) sunIcon.classList.add('hidden');
    }

    if (themeToggleBtn) {
      const themeLabel = themeToggleBtn.querySelector('[data-theme-label]');
      if (themeLabel) {
        themeLabel.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
      }
    }
  }

  /**
   * Relative Luminance Calculation (WCAG 2.1)
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
   * Contrast Ratio Check (DESIGN.md Section 4.4)
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

    // Warning if contrast < 4:1 or foreground is lighter than background
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
      previewStatus.className = 'font-mono text-xs text-[var(--text-muted)]';
    } else if (state === 'success') {
      previewStatus.textContent = 'Up to date';
      previewStatus.className = 'font-mono text-xs text-[var(--mint)]';
      if (previewError) previewError.classList.add('hidden');
    } else if (state === 'error') {
      previewStatus.textContent = 'Gagal membuat QR';
      previewStatus.className = 'font-mono text-xs text-[var(--danger)]';
      if (previewError && previewErrorMsg) {
        previewErrorMsg.textContent = message || 'Server tidak merespons. Silakan coba lagi.';
        previewError.classList.remove('hidden');
      }
    } else if (state === 'empty') {
      previewStatus.textContent = 'Input kosong';
      previewStatus.className = 'font-mono text-xs text-[var(--text-muted)]';
    }
  }

  /**
   * Fetch QR code preview from backend
   */
  async function updatePreview() {
    if (!form) return;

    const dataValue = qrDataInput ? qrDataInput.value.trim() : '';

    // Check empty state
    if (!dataValue) {
      if (previewImg) previewImg.classList.add('hidden');
      if (previewEmpty) previewEmpty.classList.remove('hidden');
      if (previewError) previewError.classList.add('hidden');
      if (downloadBtn) {
        downloadBtn.disabled = true;
      }
      if (downloadCaption) {
        downloadCaption.textContent = 'Masukkan URL atau teks untuk mengaktifkan unduhan';
      }
      setPreviewState('empty');
      return;
    }

    // Input exists: enable download & hide empty state
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
   * High-resolution Download Handler
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
   * Color inputs sync & label display
   */
  function syncColorLabel(input) {
    const hexSpan = document.querySelector(`[data-hex-for="${input.name}"]`);
    if (hexSpan) {
      hexSpan.textContent = input.value.toUpperCase();
    }
  }

  /**
   * Frame Extra inputs toggle
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
   * Accordion section active chip & toggle
   */
  function updateSectionChips() {
    document.querySelectorAll('[data-accordion-btn]').forEach(btn => {
      const targetId = btn.getAttribute('data-accordion-target');
      const content = document.getElementById(targetId);
      const chip = btn.querySelector('.section-chip');
      const isOpen = content && content.classList.contains('is-open');

      if (chip) {
        if (isOpen) {
          chip.classList.add('active');
          chip.classList.remove('inactive');
        } else {
          chip.classList.remove('active');
          chip.classList.add('inactive');
        }
      }
    });
  }

  function setupAccordions() {
    const headers = document.querySelectorAll('[data-accordion-btn]');

    headers.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-accordion-target');
        const content = document.getElementById(targetId);
        const icon = btn.querySelector('[data-accordion-icon]');
        const isCurrentlyOpen = content.classList.contains('is-open');

        // On mobile (< 640px), close other sections
        if (window.innerWidth < 640) {
          headers.forEach(otherBtn => {
            const otherId = otherBtn.getAttribute('data-accordion-target');
            if (otherId !== targetId) {
              const otherContent = document.getElementById(otherId);
              const otherIcon = otherBtn.querySelector('[data-accordion-icon]');
              if (otherContent) otherContent.classList.remove('is-open');
              otherBtn.setAttribute('aria-expanded', 'false');
              if (otherIcon) otherIcon.classList.remove('rotate-180');
            }
          });
        }

        if (isCurrentlyOpen) {
          content.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          if (icon) icon.classList.remove('rotate-180');
        } else {
          content.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          if (icon) icon.classList.add('rotate-180');
        }

        updateSectionChips();
      });
    });
  }

  /**
   * Quick Palette Presets
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
   * Logo File upload handling
   */
  function setupLogoHandler() {
    if (!logoInput) return;

    logoInput.addEventListener('change', () => {
      if (logoInput.files && logoInput.files[0]) {
        const file = logoInput.files[0];
        if (logoName) logoName.textContent = file.name;
        if (logoInfo) logoInfo.classList.remove('hidden');
      } else {
        if (logoInfo) logoInfo.classList.add('hidden');
      }
      updatePreview();
    });

    if (clearLogoBtn) {
      clearLogoBtn.addEventListener('click', () => {
        logoInput.value = '';
        if (logoInfo) logoInfo.classList.add('hidden');
        updatePreview();
      });
    }
  }

  /**
   * Initialize Client Logic
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

    // Text inputs -> debounced preview & save
    const textInputs = form.querySelectorAll('textarea, input[type="text"]');
    textInputs.forEach(el => {
      el.addEventListener('input', () => {
        saveSettings();
        debouncedPreview();
      });
    });

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

    // Setup modules
    setupAccordions();
    setupColorPresets();
    setupLogoHandler();
    checkContrastValidation();
    updateSectionChips();

    // Download trigger
    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleDownload);
    }

    // Initial sync
    syncFrameExtraVisibility();
    updatePreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
