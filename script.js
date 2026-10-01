/**
 * MAYDON.UZ — FOOTBALL PITCH BOOKING (TASHKENT)
 * Interactive Script: Full navigation, filters, modal booking, price calculation,
 * phone formatting, favorites, gallery, and toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // =========================================================================
  // 1. UTILITIES & HELPERS
  // =========================================================================

  // Format number with spaces (e.g. 280000 -> "280 000")
  function formatMoney(amount) {
    return Number(amount).toLocaleString('ru-RU').replace(/\u00A0/g, ' ') + ' UZS';
  }

  // Declension of Russian nouns
  function declOfNum(n, titles) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return titles[2];
    if (n1 > 1 && n1 < 5) return titles[1];
    if (n1 === 1) return titles[0];
    return titles[2];
  }

  // Web Audio synthetic chime for booking success
  function playSuccessChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (e) {
      // Audio might be muted or blocked by browser policy
    }
  }

  // =========================================================================
  // 2. TOAST NOTIFICATION SYSTEM
  // =========================================================================

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  function showToast(title, message = '', type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '⚽';
    if (type === 'info') icon = 'ℹ️';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';
    if (type === 'heart') icon = '❤️';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button type="button" class="toast-close" aria-label="Закрыть уведомление">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    const closeToast = () => {
      toast.classList.remove('is-visible');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);

    // Auto dismiss after 3.8s
    setTimeout(closeToast, 3800);
  }

  // =========================================================================
  // 3. HEADER, MOBILE MENU & SCROLLSPY
  // =========================================================================

  const header = document.querySelector('.header');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelectorAll('.nav-link');
  const mainLogo = document.getElementById('main-logo');

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }, { passive: true });

  // Scrollspy & Smooth scroll for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetElem = document.querySelector(targetId);
        if (targetElem) {
          // Close mobile menu if open
          if (navToggle && navToggle.checked) {
            navToggle.checked = false;
          }

          // Smooth scroll with header height offset
          const headerHeight = header ? header.offsetHeight : 70;
          const targetPos = targetElem.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });

          // Set active class
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  });

  // Main logo click -> scroll top
  if (mainLogo) {
    mainLogo.addEventListener('click', (e) => {
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Header phone link click
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  phoneLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const phone = link.textContent.trim().replace(/[^\d+() -]/g, '');
      // If desktop, copy to clipboard for user convenience
      if (window.innerWidth > 768 && navigator.clipboard) {
        navigator.clipboard.writeText(phone).then(() => {
          showToast('Номер скопирован', `${phone} скопирован в буфер обмена`, 'info');
        }).catch(() => {});
      }
    });
  });

  // =========================================================================
  // 4. DATE PICKERS INITIALIZATION
  // =========================================================================

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Set min date and default values for all date inputs
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.min = todayStr;
    if (!input.value || input.value < todayStr) {
      input.value = todayStr;
    }
  });

  // =========================================================================
  // 5. PITCH CARDS & FAVORITES SYSTEM
  // =========================================================================

  const FAVORITES_KEY = 'maydon_favorites_v1';
  let favorites = [];
  try {
    favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch (e) {
    favorites = [];
  }

  function updateFavoriteButtons() {
    const favButtons = document.querySelectorAll('.btn-fav');
    favButtons.forEach(btn => {
      const id = btn.getAttribute('data-fav-id');
      const isFav = favorites.includes(id);
      if (isFav) {
        btn.classList.add('is-favorite');
        btn.title = 'Удалить из избранного';
      } else {
        btn.classList.remove('is-favorite');
        btn.title = 'Добавить в избранное';
      }
    });
  }

  // Delegated click for favorite buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-fav');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const id = btn.getAttribute('data-fav-id');
    const card = document.getElementById(`field-${id}`);
    const pitchTitle = card ? card.querySelector('.pitch-title')?.textContent?.trim() : `Поле #${id}`;

    const index = favorites.indexOf(id);
    if (index > -1) {
      favorites.splice(index, 1);
      btn.classList.remove('is-favorite');
      showToast('Удалено из избранного', `Поле «${pitchTitle}» удалено`, 'info');
    } else {
      favorites.push(id);
      btn.classList.add('is-favorite');
      showToast('Добавлено в избранное ❤️', `Поле «${pitchTitle}» сохранено`, 'heart');
    }

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (err) {}
  });

  updateFavoriteButtons();

  // =========================================================================
  // 6. FILTER & SEARCH ENGINE
  // =========================================================================

  const searchForm = document.getElementById('search-form');
  const districtSelect = document.getElementById('district-select');
  const catalogHeadingDesc = document.querySelector('.catalog-heading-wrap .section-desc');
  const pitchGrid = document.querySelector('.pitch-grid');
  const cards = Array.from(document.querySelectorAll('.pitch-card'));
  const emptyState = document.getElementById('empty-catalog-state');
  const resetBtn = document.querySelector('.btn-reset');
  const resetEmptyBtn = document.getElementById('btn-reset-empty');

  function applyFilters(scrollToCatalog = false) {
    if (!searchForm) return;

    const formData = new FormData(searchForm);
    const selectedDistrict = formData.get('district') || 'all';
    const selectedSize = formData.get('size') || 'all';
    const selectedSurfaces = formData.getAll('surface[]');
    const selectedAmenities = formData.getAll('amenity[]');
    const minPrice = parseInt(formData.get('min_price') || '0', 10);
    const maxPrice = parseInt(formData.get('max_price') || '999999999', 10);

    let matchCount = 0;

    cards.forEach(card => {
      const cardDistrict = (card.getAttribute('data-district') || '').toLowerCase();
      const cardSizes = (card.getAttribute('data-size') || '').toLowerCase().split(',');
      const cardSurfaces = (card.getAttribute('data-surface') || '').toLowerCase().split(',');
      const cardAmenities = (card.getAttribute('data-amenities') || '').toLowerCase().split(',');
      const cardPrice = parseInt(card.getAttribute('data-price') || '0', 10);

      // 1. District check
      let matchesDistrict = (selectedDistrict === 'all' || selectedDistrict === cardDistrict);

      // 2. Size check
      let matchesSize = (selectedSize === 'all' || cardSizes.includes(selectedSize));

      // 3. Surface check: if user checked any surface, card must match at least one
      let matchesSurface = true;
      if (selectedSurfaces.length > 0) {
        matchesSurface = selectedSurfaces.some(s => cardSurfaces.includes(s));
      }

      // 4. Amenities check: card must satisfy all checked amenities
      let matchesAmenities = true;
      if (selectedAmenities.length > 0) {
        matchesAmenities = selectedAmenities.every(a => cardAmenities.includes(a));
      }

      // 5. Price check
      let matchesPrice = true;
      if (!isNaN(minPrice) && minPrice > 0) {
        matchesPrice = matchesPrice && (cardPrice >= minPrice);
      }
      if (!isNaN(maxPrice) && maxPrice > 0) {
        matchesPrice = matchesPrice && (cardPrice <= maxPrice);
      }

      const isMatch = matchesDistrict && matchesSize && matchesSurface && matchesAmenities && matchesPrice;

      if (isMatch) {
        card.classList.remove('is-hidden');
        matchCount++;
      } else {
        card.classList.add('is-hidden');
      }
    });

    // Update catalog section count text
    if (catalogHeadingDesc) {
      if (matchCount > 0) {
        const word = declOfNum(matchCount, ['лучшая площадка', 'лучшие площадки', 'лучших площадок']);
        catalogHeadingDesc.textContent = `Найдено ${matchCount} ${word} по вашему запросу`;
      } else {
        catalogHeadingDesc.textContent = 'Ничего не найдено по заданным параметрам';
      }
    }

    // Toggle empty state
    if (emptyState) {
      emptyState.style.display = matchCount === 0 ? 'flex' : 'none';
    }

    if (scrollToCatalog) {
      const catalogSec = document.getElementById('catalog');
      if (catalogSec) {
        const headerHeight = header ? header.offsetHeight : 70;
        const targetPos = catalogSec.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    }

    return matchCount;
  }

  // Intercept Search Form Submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const count = applyFilters(true);
      const word = declOfNum(count, ['поле', 'поля', 'полей']);
      showToast('Поиск завершён', `Найдено ${count} ${word} в Ташкенте`, 'success');
    });

    // Instant filter on district select change
    if (districtSelect) {
      districtSelect.addEventListener('change', () => {
        applyFilters(false);
      });
    }

    // Instant filter on size radio change
    const sizeRadios = searchForm.querySelectorAll('input[name="size"]');
    sizeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        applyFilters(false);
      });
    });
  }

  // Reset Filters Function
  function resetAllFilters() {
    if (!searchForm) return;

    if (districtSelect) districtSelect.value = 'all';

    const sizeAllRadio = searchForm.querySelector('input[name="size"][value="all"]');
    if (sizeAllRadio) sizeAllRadio.checked = true;

    // Reset surface checkboxes to defaults
    const surfaceCheckboxes = searchForm.querySelectorAll('input[name="surface[]"]');
    surfaceCheckboxes.forEach(cb => {
      cb.checked = (cb.value === 'artificial' || cb.value === 'outdoor');
    });

    // Reset amenities checkboxes to unchecked
    const amenityCheckboxes = searchForm.querySelectorAll('input[name="amenity[]"]');
    amenityCheckboxes.forEach(cb => {
      cb.checked = false;
    });

    // Reset price
    const minPriceInput = searchForm.querySelector('input[name="min_price"]');
    const maxPriceInput = searchForm.querySelector('input[name="max_price"]');
    if (minPriceInput) minPriceInput.value = '150000';
    if (maxPriceInput) maxPriceInput.value = '600000';

    applyFilters(false);
    showToast('Фильтры сброшены', 'Показаны все доступные площадки', 'info');
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
    });
  }

  if (resetEmptyBtn) {
    resetEmptyBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // =========================================================================
  // 7. DISTRICT PILLS & FOOTER LINKS (QUICK JUMP)
  // =========================================================================

  document.addEventListener('click', (e) => {
    const pill = e.target.closest('.district-pill, .footer-links a[href*="district="]');
    if (!pill) return;

    const href = pill.getAttribute('href');
    if (!href || !href.includes('district=')) return;

    e.preventDefault();
    const urlParams = new URLSearchParams(href.split('?')[1]);
    const district = urlParams.get('district');

    if (district && districtSelect) {
      districtSelect.value = district;

      // Reset size to any
      const sizeAllRadio = searchForm?.querySelector('input[name="size"][value="all"]');
      if (sizeAllRadio) sizeAllRadio.checked = true;

      const count = applyFilters(true);
      const districtText = pill.textContent.replace(/\(\d+\)/, '').trim();
      showToast(`Выбран район: ${districtText}`, `Найдено доступных полей: ${count}`, 'info');
    }
  });

  // =========================================================================
  // 8. CATALOG SORTING
  // =========================================================================

  const sortSelect = document.getElementById('catalog-sort');
  if (sortSelect && pitchGrid) {
    sortSelect.addEventListener('change', () => {
      const mode = sortSelect.value;
      const sortedCards = [...cards].sort((a, b) => {
        const priceA = parseInt(a.getAttribute('data-price') || '0', 10);
        const priceB = parseInt(b.getAttribute('data-price') || '0', 10);
        const ratingA = parseFloat(a.getAttribute('data-rating') || '0');
        const ratingB = parseFloat(b.getAttribute('data-rating') || '0');
        const nameA = a.getAttribute('data-name') || '';
        const nameB = b.getAttribute('data-name') || '';

        if (mode === 'price-asc') return priceA - priceB;
        if (mode === 'price-desc') return priceB - priceA;
        if (mode === 'name-asc') return nameA.localeCompare(nameB, 'ru');
        // default 'popular' (rating descending)
        return ratingB - ratingA;
      });

      sortedCards.forEach(card => pitchGrid.appendChild(card));
      if (emptyState) pitchGrid.appendChild(emptyState);

      showToast('Сортировка обновлена', sortSelect.options[sortSelect.selectedIndex].text, 'info');
    });
  }

  // =========================================================================
  // 9. MODAL CONTROLS & BOOKING FLOW
  // =========================================================================

  const allModals = document.querySelectorAll('.modal');

  function openModal(modal) {
    if (!modal) return;
    // Close other modals first
    allModals.forEach(m => m.classList.remove('is-open'));

    modal.classList.add('is-open');
    document.body.classList.add('modal-open');

    // Recalculate price in this modal
    updateModalPrice(modal);
  }

  function closeModal(modal) {
    if (!modal) {
      allModals.forEach(m => m.classList.remove('is-open'));
    } else {
      modal.classList.remove('is-open');
    }
    // If no modals are open, unlock body scroll
    const anyOpen = Array.from(allModals).some(m => m.classList.contains('is-open'));
    if (!anyOpen) {
      document.body.classList.remove('modal-open');
      if (window.location.hash.startsWith('#modal-booking-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }

  // Intercept trigger buttons for modals
  document.addEventListener('click', (e) => {
    // 1. Button to open modal
    const openBtn = e.target.closest('a[href^="#modal-booking-"], [data-modal^="modal-booking-"]');
    if (openBtn) {
      e.preventDefault();
      const href = openBtn.getAttribute('href') || ('#' + openBtn.getAttribute('data-modal'));
      const targetModal = document.querySelector(href);
      if (targetModal) {
        openModal(targetModal);
      }
      return;
    }

    // 2. Close button or backdrop
    const closeBtn = e.target.closest('.modal-close-btn, .modal-backdrop, a[href="#close"], .btn-modal-cancel');
    if (closeBtn) {
      e.preventDefault();
      const modal = closeBtn.closest('.modal');
      closeModal(modal);
      return;
    }

    // 3. Disabled booked slot clicked -> shake and warn
    const bookedLabel = e.target.closest('.slot-booked');
    if (bookedLabel) {
      e.preventDefault();
      bookedLabel.classList.remove('shake');
      // trigger reflow
      void bookedLabel.offsetWidth;
      bookedLabel.classList.add('shake');
      showToast('Слот занят', 'Этот часовой слот уже забронирован. Пожалуйста, выберите другое свободное время.', 'warning');
      return;
    }
  });

  // ESC key to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // =========================================================================
  // 10. PHONE NUMBER INPUT AUTO-FORMATTER (+998 ...)
  // =========================================================================

  function formatUzbekPhone(value) {
    // Extract digits only
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.substring(3);
    }
    // Limit to 9 digits after 998
    digits = digits.substring(0, 9);

    let formatted = '+998';
    if (digits.length > 0) {
      formatted += ' (' + digits.substring(0, 2);
    }
    if (digits.length >= 2) {
      formatted += ') ' + digits.substring(2, 5);
    }
    if (digits.length >= 5) {
      formatted += '-' + digits.substring(5, 7);
    }
    if (digits.length >= 7) {
      formatted += '-' + digits.substring(7, 9);
    }
    return formatted;
  }

  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    // Initialize with +998
    if (!input.value || input.value.trim() === '+998') {
      input.value = '+998 ';
    }

    input.addEventListener('input', (e) => {
      const cursor = input.selectionStart;
      const prevVal = input.value;
      input.value = formatUzbekPhone(input.value);
    });

    input.addEventListener('focus', () => {
      if (!input.value.trim()) {
        input.value = '+998 ';
      }
    });
  });

  // =========================================================================
  // 11. DYNAMIC MODAL PRICE CALCULATION
  // =========================================================================

  function updateModalPrice(modal) {
    if (!modal) return;
    const form = modal.querySelector('form');
    if (!form) return;

    const basePrice = parseInt(form.querySelector('input[name="price_per_hour"]')?.value || '250000', 10);
    const extraBalls = form.querySelector('input[name="extra_balls"]')?.checked;
    const extraBibs = form.querySelector('input[name="extra_bibs"]')?.checked;

    let total = basePrice;
    if (extraBalls) total += 20000;
    if (extraBibs) total += 25000;

    const submitBtn = form.querySelector('.btn-confirm-booking, button[type="submit"]');
    if (submitBtn) {
      submitBtn.setAttribute('data-total-price', total);
      submitBtn.innerHTML = `⚽ Подтвердить бронь (${formatMoney(total)})`;
    }
  }

  // Listen to extra options changes
  document.addEventListener('change', (e) => {
    if (e.target.matches('input[name="extra_balls"], input[name="extra_bibs"]')) {
      const modal = e.target.closest('.modal');
      updateModalPrice(modal);
    }
  });

  // =========================================================================
  // 12. BOOKING FORM SUBMISSION & SUCCESS MODAL
  // =========================================================================

  const successModal = document.getElementById('modal-booking-success');
  const receiptFieldName = document.getElementById('receipt-field-name');
  const receiptDate = document.getElementById('receipt-date');
  const receiptTime = document.getElementById('receipt-time');
  const receiptPlayer = document.getElementById('receipt-player');
  const receiptExtras = document.getElementById('receipt-extras');
  const receiptPrice = document.getElementById('receipt-price');
  const receiptBookingId = document.getElementById('receipt-booking-id');
  const btnShareTelegram = document.getElementById('btn-share-telegram');
  const btnCopyReceipt = document.getElementById('btn-copy-receipt');
  const btnCloseSuccess = document.getElementById('btn-close-success');

  let lastBookingData = null;

  const bookingForms = document.querySelectorAll('.booking-post-form');
  bookingForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const modal = form.closest('.modal');
      const submitBtn = form.querySelector('button[type="submit"]');

      // 1. Validation
      const nameInput = form.querySelector('input[name="customer_name"]');
      const phoneInput = form.querySelector('input[name="customer_phone"]');
      const dateInput = form.querySelector('input[name="booking_date"]');
      const timeRadio = form.querySelector('input[name="time"]:checked');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';

      if (!nameVal || nameVal.length < 2) {
        showToast('Введите ваше имя', 'Пожалуйста, укажите имя игрока для бронирования', 'warning');
        if (nameInput) nameInput.focus();
        return;
      }

      // Check digits in phone
      const phoneDigits = phoneVal.replace(/\D/g, '');
      if (phoneDigits.length < 12) { // 998 + 9 digits = 12 digits
        showToast('Неполный номер телефона', 'Введите корректный номер формата +998 (XX) XXX-XX-XX', 'warning');
        if (phoneInput) phoneInput.focus();
        return;
      }

      if (!timeRadio) {
        showToast('Выберите время', 'Выберите удобный часовой слот из доступных', 'warning');
        return;
      }

      // 2. Extract values
      const fieldName = form.querySelector('input[name="field_name"]')?.value || modal.querySelector('.modal-title')?.textContent || 'Футбольное поле';
      const timeVal = timeRadio.value;
      const dateVal = dateInput ? dateInput.value : todayStr;
      const basePrice = parseInt(form.querySelector('input[name="price_per_hour"]')?.value || '250000', 10);
      const extraBalls = form.querySelector('input[name="extra_balls"]')?.checked;
      const extraBibs = form.querySelector('input[name="extra_bibs"]')?.checked;

      let total = basePrice;
      const extrasList = [];
      if (extraBalls) {
        total += 20000;
        extrasList.push('Мяч Select (+20 000 UZS)');
      }
      if (extraBibs) {
        total += 25000;
        extrasList.push('Манишки (+25 000 UZS)');
      }
      const extrasText = extrasList.length > 0 ? extrasList.join(', ') : 'Без инвентаря';

      // 3. Show button loading state
      if (submitBtn) {
        submitBtn.classList.add('is-loading');
      }

      // Format date nicely (e.g. 19 сентября 2026)
      let formattedDate = dateVal;
      try {
        const [py, pm, pd] = dateVal.split('-');
        const dateObj = new Date(py, pm - 1, pd);
        formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (err) {}

      // 4. Simulate fast network processing
      setTimeout(() => {
        if (submitBtn) submitBtn.classList.remove('is-loading');

        // Mark the chosen time slot as booked in this modal
        const selectedSlotLabel = timeRadio.closest('.time-slot-label');
        if (selectedSlotLabel) {
          selectedSlotLabel.classList.add('slot-booked');
          timeRadio.disabled = true;
          const box = selectedSlotLabel.querySelector('.time-slot-box');
          if (box) box.textContent = `${timeVal.split('-')[0]} (Занято)`;
        }

        // Close booking modal
        closeModal(modal);

        // Generate unique booking ID
        const bookingId = '#MYD-' + Math.floor(10000 + Math.random() * 90000);

        // Store last booking data
        lastBookingData = {
          id: bookingId,
          fieldName,
          date: formattedDate,
          time: timeVal,
          player: `${nameVal} (${phoneVal})`,
          extras: extrasText,
          total: formatMoney(total),
          phone: phoneVal,
          name: nameVal
        };

        // Populate Success Modal
        if (receiptBookingId) receiptBookingId.textContent = bookingId;
        if (receiptFieldName) receiptFieldName.textContent = fieldName;
        if (receiptDate) receiptDate.textContent = formattedDate;
        if (receiptTime) receiptTime.textContent = timeVal;
        if (receiptPlayer) receiptPlayer.textContent = `${nameVal} (${phoneVal})`;
        if (receiptExtras) receiptExtras.textContent = extrasText;
        if (receiptPrice) receiptPrice.textContent = formatMoney(total);

        // Prepare Telegram share URL
        if (btnShareTelegram) {
          const shareText = encodeURIComponent(
            `⚽ Бронь футбольного поля на Maydon.uz!\n\n` +
            `🏟 Площадка: ${fieldName}\n` +
            `📅 Дата: ${formattedDate}\n` +
            `⏰ Время: ${timeVal}\n` +
            `👤 Игрок: ${nameVal}\n` +
            `💰 К оплате: ${formatMoney(total)}\n` +
            `🔖 Код брони: ${bookingId}\n\n` +
            `Ждём всех на игре!`
          );
          btnShareTelegram.href = `https://t.me/share/url?url=https://maydon.uz&text=${shareText}`;
        }

        // Open Confirmation Modal
        openModal(successModal);

        // Play synthetic sound effect
        playSuccessChime();

        // Show Toast
        showToast('Бронь подтверждена! ⚽', `${fieldName} • ${timeVal}`, 'success');

        // Reset form inputs (except date)
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '+998 ';
        const checkBalls = form.querySelector('input[name="extra_balls"]');
        const checkBibs = form.querySelector('input[name="extra_bibs"]');
        if (checkBalls) checkBalls.checked = false;
        if (checkBibs) checkBibs.checked = false;

        // Auto select next available time slot
        const nextFreeSlot = form.querySelector('input[name="time"]:not([disabled])');
        if (nextFreeSlot) nextFreeSlot.checked = true;

      }, 450);
    });
  });

  // Copy receipt details button in success modal
  if (btnCopyReceipt) {
    btnCopyReceipt.addEventListener('click', () => {
      if (!lastBookingData) return;
      const text =
        `⚽ БРОНЬ MAYDON.UZ\n` +
        `Код брони: ${lastBookingData.id}\n` +
        `Площадка: ${lastBookingData.fieldName}\n` +
        `Дата: ${lastBookingData.date}\n` +
        `Время: ${lastBookingData.time}\n` +
        `Игрок: ${lastBookingData.player}\n` +
        `Дополнительно: ${lastBookingData.extras}\n` +
        `Сумма: ${lastBookingData.total}`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('Скопировано!', 'Детали бронирования скопированы в буфер обмена 📋', 'info');
        }).catch(() => {});
      }
    });
  }

  // Close success modal button
  if (btnCloseSuccess) {
    btnCloseSuccess.addEventListener('click', () => {
      closeModal(successModal);
    });
  }

  // =========================================================================
  // 13. INTERACTIVE LEAFLET MAP OF TASHKENT
  // =========================================================================

  function initTashkentMap() {
    const mapEl = document.getElementById('tashkent-map');
    if (!mapEl || typeof L === 'undefined') return;

    // Tashkent city center coordinates
    const map = L.map('tashkent-map', {
      center: [41.2995, 69.2401],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    // All 12 football fields with real Tashkent coordinates
    const fields = [
      { id: 1, name: 'Bunyodkor Arena Mini',       district: 'Чиланзарский',      lat: 41.2887, lng: 69.1951, price: 280000, status: 'partial' },
      { id: 2, name: 'Yunusabad Indoor Arena',      district: 'Юнусабадский',      lat: 41.3476, lng: 69.2790, price: 320000, status: 'free' },
      { id: 3, name: 'Lokomotiv Stadium Park',      district: 'Мирабадский',       lat: 41.3114, lng: 69.2726, price: 450000, status: 'free' },
      { id: 4, name: 'Milliy Park Football Hub',    district: 'Шайхантахурский',   lat: 41.3063, lng: 69.2440, price: 240000, status: 'partial' },
      { id: 5, name: 'TTZ Olympic Sport Complex',   district: 'Мирзо-Улугбекский', lat: 41.3290, lng: 69.3198, price: 200000, status: 'free' },
      { id: 6, name: 'Sergeli Champions Club',      district: 'Сергелийский',      lat: 41.2247, lng: 69.2015, price: 220000, status: 'free' },
      { id: 7, name: 'Olmazor Sport Palace',        district: 'Алмазарский',       lat: 41.3368, lng: 69.2101, price: 260000, status: 'free' },
      { id: 8, name: 'Yakkasaroy FC Arena',         district: 'Яккасарайский',     lat: 41.2938, lng: 69.2620, price: 380000, status: 'partial' },
      { id: 9, name: 'Uchtepa Sport Center',        district: 'Учтепинский',       lat: 41.2780, lng: 69.1720, price: 230000, status: 'free' },
      { id: 10, name: 'Yashnobod Champion Ground',  district: 'Яшнабадский',       lat: 41.2650, lng: 69.3100, price: 300000, status: 'free' },
      { id: 11, name: 'Bektemir Stadium Mini',      district: 'Бектемирский',      lat: 41.2500, lng: 69.3320, price: 180000, status: 'booked' },
      { id: 12, name: 'Shaykhontohur Green Pitch',  district: 'Шайхантахурский',   lat: 41.3010, lng: 69.2300, price: 250000, status: 'free' }
    ];

    // Custom marker colors by status
    const statusColors = {
      free:    { color: '#00ff87', bg: '#09220f' },
      partial: { color: '#ffa94d', bg: '#221700' },
      booked:  { color: '#ff4757', bg: '#220009' }
    };

    fields.forEach(field => {
      const sc = statusColors[field.status] || statusColors.free;

      // Custom SVG icon
      const svgIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px; height:36px; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
          background:${sc.bg}; border:2px solid ${sc.color};
          box-shadow: 0 0 12px ${sc.color}88;
          display:flex; align-items:center; justify-content:center;
        "><span style="transform:rotate(45deg); font-size:16px; line-height:1;">⚽</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38]
      });

      const priceStr = field.price.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
      const statusLabel = { free: '🟢 Свободно', partial: '🟡 Частично занято', booked: '🔴 Забито' }[field.status];

      const popupHtml = `
        <div class="map-popup-inner">
          <div class="map-popup-district">${field.district} район</div>
          <div class="map-popup-name">${field.name}</div>
          <div style="font-size:0.78rem; color:#95ab9e; margin-bottom:0.3rem;">${statusLabel}</div>
          <div class="map-popup-footer">
            <span class="map-popup-price-val">${priceStr} UZS/ч</span>
            <a href="#modal-booking-${field.id}" class="map-popup-book-btn">⚽ Бронь</a>
          </div>
        </div>`;

      const marker = L.marker([field.lat, field.lng], { icon: svgIcon });
      marker.bindPopup(popupHtml, { maxWidth: 260 });
      marker.addTo(map);
    });

    // Enable scroll wheel zoom on click
    map.on('click', () => { map.scrollWheelZoom.enable(); });
    map.on('mouseout', () => { map.scrollWheelZoom.disable(); });
  }

  // Initialize map when DOM is ready (Leaflet already loaded in head)
  initTashkentMap();

  // =========================================================================
  // 14. UPDATE CATALOG COUNT
  // =========================================================================

  const catalogCountEl = document.querySelector('.catalog-section .section-desc');
  if (catalogCountEl) {
    const totalCards = document.querySelectorAll('.pitch-card').length;
    catalogCountEl.textContent = `Найдено ${totalCards} лучших площадок по вашему запросу`;
  }

  // =========================================================================
  // 15. CONSOLE WELCOME GREETING
  // =========================================================================

  console.log('%c Maydon.uz %c Football Platform Loaded Successfully ⚽',
    'background: #00ff87; color: #090e0b; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;',
    'color: #00ff87; font-weight: bold; font-size: 13px;'
  );
});
