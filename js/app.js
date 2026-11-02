/**
 * MedCardy - Mobile-First JavaScript Core
 * بخش ۱: وضعیت اپلیکیشن، داده‌های بالینی و ۴ تمپلیت داشبورد موبایل
 */

const appState = {
  activeLayout: 'quizlet',
  activeBtnStyle: 'btn-style-glass',
  activeScreen: 'dashboard',
  isCardFlipped: false,
  recoveryMinutes: 15
};

// اطلاعات دک‌های بالینی
const medicalDecks = [
  { id: 1, title: 'الکتروکاردیوگرام (ECG) و آریتمی‌ها', category: 'قلب و عروق', cards: 64, due: 12, overdue: 8, newCards: 6, progress: 78 },
  { id: 2, title: 'داروهای اعصاب و روان و بیهوشی', category: 'فارماکولوژی', cards: 85, due: 18, overdue: 14, newCards: 10, progress: 62 },
  { id: 3, title: 'بیماری‌های انسدادی ریه (COPD و آسم)', category: 'داخلی ریه', cards: 42, due: 8, overdue: 4, newCards: 4, progress: 91 },
  { id: 4, title: 'سندرم‌های مننژیت و مایع مغزی‌نخاعی', category: 'عفونی و نورولوژی', cards: 53, due: 10, overdue: 9, newCards: 5, progress: 45 },
  { id: 5, title: 'تفسیر گازهای خون شریانی (ABG)', category: 'مراقبت‌های ویژه ICU', cards: 38, due: 6, overdue: 2, newCards: 12, progress: 84 },
  { id: 6, title: 'شکم حاد و انسدادهای روده‌ای', category: 'جراحی عمومی', cards: 72, due: 14, overdue: 11, newCards: 8, progress: 55 }
];

// ۴ تمپلیت چیدمان اختصاصی موبایل
const mobileDashboardTemplates = {
  // ۱. چیدمان کویزلت مدرن (Mobile Quizlet)
  quizlet: () => `
    <div class="layout-quizlet">
      <div class="mobile-hero-quizlet glass-card">
        <div class="greeting-row">
          <div>
            <span class="badge-algo-tag">جلسه آماده مطالعه</span>
            <h2 class="hero-title" style="margin-top:6px;">امروز ۳۴ مرور سررسید شده داری</h2>
          </div>
        </div>
        
        <div class="quick-stats-row">
          <div class="m-stat-box">
            <span class="num text-primary">۳۴</span>
            <span class="label">مرور امروز</span>
          </div>
          <div class="m-stat-box">
            <span class="num text-danger">۴۸</span>
            <span class="label">عقب‌افتاده</span>
          </div>
          <div class="m-stat-box">
            <span class="num text-success">۹۲٪</span>
            <span class="label">پایداری FSRS</span>
          </div>
        </div>

        <button class="glass-btn primary block-btn lg" onclick="app.showScreen('study')">
          <i data-lucide="play-circle"></i>
          <span>شروع مرور هوشمند (۳۴ کارت)</span>
        </button>
      </div>

      <div class="mobile-decks-section">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h3 class="mobile-decks-title" style="margin:0;">مجموعه‌های مطالعاتی فعال</h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">۶ درس فعال</span>
        </div>
        <div class="mobile-decks-grid-desktop">
          ${medicalDecks.map(deck => `
            <div class="mobile-deck-card glass-card" onclick="app.showScreen('study')">
              <div class="m-deck-header">
                <span>${deck.category}</span>
                <span>${deck.cards} کارت</span>
              </div>
              <h4 class="m-deck-title">${deck.title}</h4>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span class="m-deck-due-tag">⚠️ ${deck.due} کارت سررسید</span>
                <span style="font-size:0.75rem; color:var(--text-light);">${deck.progress}٪ تسلط</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `,

  // ۲. چیدمان دولینگو انگیزشی (Mobile Duolingo)
  duolingo: () => `
    <div class="layout-duolingo">
      <div class="duo-streak-hero glass-card">
        <span class="flame-icon-big">🔥</span>
        <h2>زنجیره ۷ روزه مطالعه!</h2>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">پیوستگی شما حافظه بالینی‌تان را بیمه کرده است.</p>

        <div class="duo-progress-container">
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700;">
            <span>هدف روزانه XP</span>
            <span style="color:var(--med-success);">۳۴ از ۵۰ کارت</span>
          </div>
          <div class="duo-progress-track">
            <div class="duo-progress-bar" style="width: 68%;"></div>
          </div>
        </div>

        <div class="duo-pulse-action">
          <button class="glass-btn primary block-btn duo-pulse-btn" onclick="app.showScreen('study')">
            <i data-lucide="zap"></i>
            <span>حفظ زنجیره و مطالعه (۳۴ کارت)</span>
          </button>
        </div>
      </div>

      <div class="duo-quests-section">
        <h4 style="font-size:0.95rem; font-weight:800; margin-bottom:10px;">ماموریت‌های روزانه پزشک:</h4>
        <div class="duo-quests-list">
          <div class="duo-quest-item glass-card">
            <span class="quest-badge-icon">🎯</span>
            <div class="quest-details">
              <h4>مرور صبحگاهی بخش</h4>
              <p>مرور حداقل ۱۵ کارت قبل از ساعت ۱۲ ظهر</p>
            </div>
            <span class="badge-confirmed" style="margin-right:auto; font-size:0.68rem;">+20 XP ✅</span>
          </div>

          <div class="duo-quest-item glass-card" onclick="app.showScreen('recovery')">
            <span class="quest-badge-icon">🛡️</span>
            <div class="quest-details">
              <h4>عملیات نجات کارت‌ها</h4>
              <p>کاهش حداقل ۱۰ کارت از عقب‌افتاده‌ها</p>
            </div>
            <button class="glass-btn outline sm" style="margin-right:auto;">شروع</button>
          </div>
        </div>
      </div>
    </div>
  `,

  // ۳. چیدمان آنکی FSRS
  anki: () => `
    <div class="layout-anki">
      <div class="anki-mobile-summary glass-card">
        <div class="anki-header-row">
          <div>
            <h3 style="font-size:1.05rem; font-weight:800;">آنکی دیتامحور (FSRS)</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">تحلیل الگوریتمی بازه‌های مرور</span>
          </div>
          <span class="anki-fsrs-badge">الگوریتم فعال: FSRS v4</span>
        </div>

        <button class="glass-btn primary block-btn" onclick="app.showScreen('study')" style="margin-top:10px;">
          <i data-lucide="play"></i>
          <span>مرور کلیه کارت‌های سررسید (Space)</span>
        </button>
      </div>

      <div class="anki-decks-stream">
        ${medicalDecks.map(deck => `
          <div class="anki-mobile-card glass-card" onclick="app.showScreen('study')">
            <div>
              <h4 style="font-size:0.9rem; font-weight:700;">${deck.title}</h4>
              <span style="font-size:0.72rem; color:var(--text-light);">${deck.category}</span>
            </div>
            <div class="anki-card-chips">
              <span class="anki-chip due" title="سررسید">${deck.due}</span>
              <span class="anki-chip overdue" title="عقب‌افتاده">${deck.overdue}</span>
              <span class="anki-chip new" title="جدید">${deck.newCards}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `,

  // ۴. چیدمان شیفت و کشیک اورژانس
  shift: () => `
    <div class="layout-shift">
      <div class="shift-mobile-alert">
        <div class="shift-title-box">
          <i data-lucide="moon"></i>
          <span>حالت کشیک شب و اورژانس</span>
        </div>
        <p class="shift-desc-text">
          طراحی ویژه استفاده با یک دست در پاویون بیمارستان برای مرورهای سریع و پربازده.
        </p>
        <button class="glass-btn danger block-btn" onclick="app.showScreen('recovery')">
          <i data-lucide="zap"></i>
          <span>ریکاوری اضطراری عقب‌افتادگی</span>
        </button>
      </div>

      <div class="shift-thumb-actions">
        <div class="shift-action-btn-card glass-card" onclick="app.showScreen('study')">
          <div class="icon-box">
            <i data-lucide="heart-pulse"></i>
          </div>
          <div>
            <h4 style="font-size:0.95rem; font-weight:800;">مرور فوری ECG و آریتمی</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">۵ دقیقه مرور کارت‌های مرگ‌وزندگی</p>
          </div>
        </div>

        <div class="shift-action-btn-card glass-card" onclick="app.showScreen('recovery')">
          <div class="icon-box" style="background:#fee2e2; color:#dc2626;">
            <i data-lucide="refresh-cw"></i>
          </div>
          <div>
            <h4 style="font-size:0.95rem; font-weight:800;">تخلیه ۱۰ کارت با ریسک بالا</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">جلوگیری از انباشته شدن کارت‌ها</p>
          </div>
        </div>
      </div>
    </div>
  `
};

/**
 * بخش ۲: کنترلرهای تعاملی، چرخش کارت، الگوریتم ریکاوری و ناوبری موبایل
 */

const app = {
  init() {
    this.renderDashboard();
    this.setupListeners();
    this.updateRecoveryPrescription(appState.recoveryMinutes);
    this.renderCourses();
    lucide.createIcons();
  },

  // تعویض چیدمان داشبورد
  setLayout(variant) {
    appState.activeLayout = variant;
    document.body.setAttribute('data-layout', variant);

    document.querySelectorAll('#layoutSwitcher .v-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-variant') === variant);
    });

    this.renderDashboard();
    this.showToast(`چیدمان به «${variant}» تغییر یافت`);
  },

  // تغییر استایل دکمه‌ها
  setBtnStyle(btnStyle) {
    document.body.classList.remove('btn-style-glass', 'btn-style-3d', 'btn-style-outline');
    document.body.classList.add(btnStyle);
    appState.activeBtnStyle = btnStyle;

    document.querySelectorAll('#btnStyleSwitcher .style-choice-card').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-btn-style') === btnStyle);
    });

    this.toggleVariantSheet(false);
    this.showToast('فیزیک دکمه‌ها به‌روز شد');
  },

  // کنترل باز و بسته شدن باتم‌شیت
  toggleVariantSheet(show) {
    const backdrop = document.getElementById('variantSheetBackdrop');
    if (!backdrop) return;
    if (typeof show === 'boolean') {
      backdrop.classList.toggle('active', show);
    } else {
      backdrop.classList.toggle('active');
    }
  },

  // تعویض صفحات اپلیکیشن با نوار ناوبری پایین
  showScreen(screenId) {
    appState.activeScreen = screenId;

    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // به‌روزرسانی فعال بودن آیکون در نوار پایین
    document.querySelectorAll('.bottom-nav-bar .b-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
    });

    if (screenId === 'study') {
      this.resetCardState();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  },

  // رندر داشبورد
  renderDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    const templateFn = mobileDashboardTemplates[appState.activeLayout] || mobileDashboardTemplates.quizlet;
    container.innerHTML = templateFn();
    lucide.createIcons();
  },

  // چرخش کارت فلش‌کارت
  toggleCardFlip() {
    const card = document.getElementById('flashcard');
    if (!card) return;
    appState.isCardFlipped = !appState.isCardFlipped;
    card.classList.toggle('flipped', appState.isCardFlipped);
  },

  resetCardState() {
    const card = document.getElementById('flashcard');
    if (card) {
      card.classList.remove('flipped');
      appState.isCardFlipped = false;
    }
  },

  // ثبت پاسخ FSRS
  rateCard(rating) {
    const labels = { 1: 'دوباره (<1m)', 2: 'سخت (12h)', 3: 'خوب (1d)', 4: 'راحت (4d)' };
    this.showToast(`پاسخ «${labels[rating]}» در حافظه ثبت شد`);

    setTimeout(() => {
      this.showScreen('results');
    }, 500);
  },

  // محاسبه نسخه ریکاوری هوشمند
  updateRecoveryPrescription(minutes) {
    appState.recoveryMinutes = minutes;
    const display = document.getElementById('timeValueDisplay');
    const box = document.getElementById('prescriptionBox');
    if (display) display.textContent = `${minutes} دقیقه`;

    if (!box) return;

    const cardsCount = Math.round(minutes * 1.8);
    const retentionRate = Math.min(95, Math.round(62 + (minutes * 0.72)));

    box.innerHTML = `
      <div class="mobile-prescription">
        <h4>📋 نسخه پیشنهادی (${minutes} دقیقه):</h4>
        <p>
          الگوریتم تعداد <strong>${cardsCount} کارت بحرانی</strong> را گزینش کرد. مطالعه این موارد نرخ یادآوری را به <strong>${retentionRate}٪</strong> می‌رساند.
        </p>
        <button class="glass-btn primary block-btn" onclick="app.showScreen('study')">
          <i data-lucide="play"></i>
          <span>شروع نجات کارت‌ها (${cardsCount} کارت)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
  },

  // رندر لیست مباحث در تب دروس
  renderCourses() {
    const container = document.getElementById('coursesGrid');
    if (!container) return;

    container.innerHTML = medicalDecks.map(d => `
      <div class="mobile-deck-card glass-card" onclick="app.showScreen('study')">
        <div class="m-deck-header">
          <span>${d.category}</span>
          <span>کل: ${d.cards} کارت</span>
        </div>
        <h4 class="m-deck-title">${d.title}</h4>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span class="m-deck-due-tag">⚠️ ${d.due} کارت در نوبت مرور</span>
          <button class="glass-btn outline sm">شروع</button>
        </div>
      </div>
    `).join('');
  },

  // پیام اطلاع‌رسانی Toast
  showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '85px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(15, 23, 42, 0.92)';
    toast.style.color = '#fff';
    toast.style.padding = '8px 18px';
    toast.style.borderRadius = '9999px';
    toast.style.fontSize = '0.82rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  },

  // تنظیم کلیه رویدادها
  setupListeners() {
    // ناوبری فیکس پایین (Bottom Nav)
    document.querySelectorAll('.bottom-nav-bar .b-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showScreen(btn.getAttribute('data-screen'));
      });
    });

    // سوییچر چیدمان‌ها در نوار اسلایدر بالا
    document.querySelectorAll('#layoutSwitcher .v-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setLayout(btn.getAttribute('data-variant'));
      });
    });

    // باتم‌شیت تنظیم دکمه‌ها
    const btnToggleSheet = document.getElementById('btnToggleVariantSheet');
    if (btnToggleSheet) {
      btnToggleSheet.addEventListener('click', () => this.toggleVariantSheet(true));
    }

    const btnCloseSheet = document.getElementById('btnCloseSheet');
    if (btnCloseSheet) {
      btnCloseSheet.addEventListener('click', () => this.toggleVariantSheet(false));
    }

    const backdrop = document.getElementById('variantSheetBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.toggleVariantSheet(false);
      });
    }

    // سوییچر استایل دکمه‌ها در باتم‌شیت
    document.querySelectorAll('#btnStyleSwitcher .style-choice-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(12);
        this.setBtnStyle(btn.getAttribute('data-btn-style'));
      });
    });

    // رویداد لمس/کلیک کارت جهت چرخش
    const cardStage = document.getElementById('flashcardWrapper');
    if (cardStage) {
      cardStage.addEventListener('click', (e) => {
        this.toggleCardFlip();
      });
    }

    // دکمه‌های پاسخ FSRS
    document.querySelectorAll('.thumb-fsrs-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.rateCard(btn.getAttribute('data-rating'));
      });
    });

    // اسلایدر ریکاوری
    const slider = document.getElementById('timeSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.updateRecoveryPrescription(parseInt(e.target.value, 10));
      });
    }

    // کلیدهای میانبر کیبورد
    window.addEventListener('keydown', (e) => {
      if (appState.activeScreen === 'study') {
        if (e.code === 'Space') {
          e.preventDefault();
          this.toggleCardFlip();
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          this.rateCard(e.key);
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
