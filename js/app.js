/**
 * MedCardy - Application Core & Interactive Prototype
 * بخش ۱: وضعیت، داده‌های آزمایشی پزشکی، و چیدمان‌های ۴ گانه داشبورد
 */

const appState = {
  activeLayout: 'quizlet',
  activeBtnStyle: 'btn-style-glass',
  activeScreen: 'dashboard',
  isCardFlipped: false,
  studyCardIndex: 0,
  recoveryMinutes: 15
};

// لیست داده‌های آزمایشی دروس پزشکی
const medicalDecks = [
  { id: 1, title: 'الکتروکاردیوگرام و آریتمی‌ها', category: 'قلب و عروق', cards: 64, due: 12, newCards: 6, progress: 78 },
  { id: 2, title: 'داروهای اعصاب و روان و بیهوشی', category: 'فارماکولوژی', cards: 85, due: 18, newCards: 10, progress: 62 },
  { id: 3, title: 'بیماری‌های انسدادی ریه (COPD و آسم)', category: 'داخلی ریه', cards: 42, due: 8, newCards: 4, progress: 91 },
  { id: 4, title: 'سندرم‌های مننژیت و مایع مغزی‌نخاعی', category: 'عفونی و نورولوژی', cards: 53, due: 10, newCards: 5, progress: 45 },
  { id: 5, title: 'تفسیر گازهای خون شریانی (ABG)', category: 'مراقبت‌های ویژه ICU', cards: 38, due: 0, newCards: 12, progress: 84 },
  { id: 6, title: 'شکم حاد و انسدادهای روده‌ای', category: 'جراحی عمومی', cards: 72, due: 14, newCards: 8, progress: 55 }
];

// رندرهای ۴ چیدمان مختلف داشبورد
const dashboardTemplates = {
  // ۱. چیدمان کویزلت مدرن
  quizlet: () => `
    <div class="layout-quizlet">
      <div class="dash-hero">
        <div class="hero-main-card glass-card">
          <div class="hero-title-row">
            <div>
              <span class="badge-tag">جلسه آماده مطالعه</span>
              <h1 style="margin-top: 8px;">سلام دکتر سید! امروز ۳۴ کارت در انتظار مرور دارید</h1>
            </div>
          </div>
          <p class="study-prompt">مرور به موقع امروز، از انباشته شدن کارت‌ها و فرسودگی ذهنی در روزهای آینده جلوگیری می‌کند.</p>
          <div class="action-row">
            <button class="glass-btn primary lg" onclick="app.showScreen('study')">
              <i data-lucide="play-circle"></i>
              <span>شروع مرور هوشمند امروز (۳۴ کارت)</span>
            </button>
            <button class="glass-btn outline lg" onclick="app.showScreen('recovery')">
              <i data-lucide="refresh-cw"></i>
              <span>اتاق بازیابی (۴۸ عقب‌افتاده)</span>
            </button>
          </div>
        </div>

        <div class="stats-sidebar">
          <div class="stat-box-quizlet glass-card">
            <div class="stat-info">
              <h4>مرورهای امروز</h4>
              <div class="num text-primary">۳۴</div>
            </div>
            <i data-lucide="calendar" style="color: var(--med-primary);"></i>
          </div>
          <div class="stat-box-quizlet glass-card">
            <div class="stat-info">
              <h4>کارت‌های عقب‌افتاده</h4>
              <div class="num text-danger">۴۸</div>
            </div>
            <i data-lucide="alert-circle" style="color: var(--med-danger);"></i>
          </div>
          <div class="stat-box-quizlet glass-card">
            <div class="stat-info">
              <h4>نرخ پایداری حافظه (FSRS)</h4>
              <div class="num text-success">۹۲٪</div>
            </div>
            <i data-lucide="shield-check" style="color: var(--med-success);"></i>
          </div>
        </div>
      </div>

      <div class="decks-section">
        <h3>مجموعه‌های مطالعاتی فعال شما</h3>
        <div class="quizlet-deck-grid">
          ${medicalDecks.map(deck => `
            <div class="quizlet-deck-card glass-card" onclick="app.showScreen('study')">
              <div>
                <div class="deck-meta-row">
                  <span>${deck.category}</span>
                  <span>${deck.cards} کارت</span>
                </div>
                <h4 class="deck-name">${deck.title}</h4>
                <span class="deck-tags">${deck.due > 0 ? `⚠️ ${deck.due} کارت سررسید شده` : '✅ به‌روز است'}</span>
              </div>
              <div>
                <div class="deck-progress-bar">
                  <div class="deck-progress-fill" style="width: ${deck.progress}%;"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `,

  // ۲. چیدمان دولینگو انگیزشی
  duolingo: () => `
    <div class="layout-duolingo">
      <div class="gamify-hero glass-card">
        <div class="streak-badge-container">
          <div class="flame-icon-pulse">🔥</div>
          <div class="streak-text">
            <h2>زنجیره ۷ روزه مطالعه!</h2>
            <p>فوق‌العاده است! شما ۷ روز متوالی مرورهای پزشکی‌تان را تکمیل کرده‌اید.</p>
          </div>
        </div>
        <div class="daily-goal-container">
          <div class="goal-label-row">
            <span>پیشرفت هدف روزانه (XP)</span>
            <span style="color: var(--med-success);">۳۴ از ۵۰ کارت</span>
          </div>
          <div class="duo-progress-track">
            <div class="duo-progress-bar" style="width: 68%;"></div>
          </div>
        </div>
      </div>

      <div class="duo-big-action">
        <button class="glass-btn primary lg duo-play-btn" onclick="app.showScreen('study')">
          <i data-lucide="zap"></i>
          <span>حفظ زنجیره آتشین و شروع مرور (۳۴ کارت)</span>
        </button>
      </div>

      <div class="duo-quest-grid">
        <div class="quest-card glass-card">
          <span class="quest-icon">🎯</span>
          <h4 class="quest-title">مرورهای صبحگاهی</h4>
          <p class="quest-desc">مرور ۱۵ کارت قبل از ساعت ۱۲ ظهر</p>
          <span class="badge-tag" style="background:#dcfce7; color:#15803d;">تکمیل شد (+20 XP)</span>
        </div>
        <div class="quest-card glass-card">
          <span class="quest-icon">🛡️</span>
          <h4 class="quest-title">چالش نجات کارت‌ها</h4>
          <p class="quest-desc">کاهش حداقل ۱۰ کارت از بخش عقب‌افتاده‌ها</p>
          <button class="glass-btn outline sm" onclick="app.showScreen('recovery')">شروع چالش</button>
        </div>
        <div class="quest-card glass-card">
          <span class="quest-icon">🧠</span>
          <h4 class="quest-title">تسلط کامل بر ECG</h4>
          <p class="quest-desc">پاسخ صحیح به ۵ تست متوالی آریتمی</p>
          <span class="badge-tag">در حال انجام (3/5)</span>
        </div>
      </div>
    </div>
  `,

  // ۳. چیدمان آنکی کامند سنتر
  anki: () => `
    <div class="layout-anki">
      <div class="glass-card" style="padding: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800;">آنکی دیتامحور | مرکز فرماندهی الگوریتم FSRS v4</h2>
            <p style="font-size:0.85rem; color:var(--text-muted);">نمایش دقیق پارامترهای حافظه و وضعیت کارت‌های سررسید شده</p>
          </div>
          <button class="glass-btn primary" onclick="app.showScreen('study')">
            <i data-lucide="play"></i>
            <span>مرور کل دک‌ها (Space)</span>
          </button>
        </div>

        <table class="anki-matrix-table">
          <thead>
            <tr>
              <th>عنوان مجموعه مطالعاتی</th>
              <th>جدید (New)</th>
              <th>یادگیری (Learn)</th>
              <th>سررسید امروز (Due)</th>
              <th>عقب‌افتاده (Overdue)</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${medicalDecks.map(deck => `
              <tr class="anki-row">
                <td>${deck.title} <span style="font-size:0.75rem; color:var(--text-light);">(${deck.category})</span></td>
                <td><span class="anki-badge new">${deck.newCards}</span></td>
                <td><span class="anki-badge learning">4</span></td>
                <td><span class="anki-badge due">${deck.due}</span></td>
                <td><span class="anki-badge overdue">${Math.round(deck.due * 0.7)}</span></td>
                <td>
                  <button class="glass-btn outline sm" onclick="app.showScreen('study')">مطالعه</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- هیت‌مپ روزانه -->
        <div class="heatmap-container glass-card" style="margin-top: 24px; background: rgba(255,255,255,0.6);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; font-size:0.9rem;">📅 ماتریس فعالیت ۳۰ روز گذشته (Review Heatmap)</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">کمترین ← بیشترین</span>
          </div>
          <div class="heatmap-grid" id="heatmapGrid">
            <!-- به صورت پویا ساخته می‌شود -->
          </div>
        </div>
      </div>
    </div>
  `,

  // ۴. چیدمان شیفت و کشیک
  shift: () => `
    <div class="layout-shift">
      <div class="shift-warning-card">
        <div>
          <h2 class="shift-urgent-title">
            <i data-lucide="moon"></i>
            <span>حالت ویژه کشیک شب و اورژانس (Clinical Shift)</span>
          </h2>
          <p style="font-size:0.9rem; color:#7f1d1d; margin-top:6px;">
            طراحی شده برای مرور سریع بین ویزیت بیماران؛ با دکمه‌های ارگونومیک بزرگ مخصوص استفاده با یک دست.
          </p>
        </div>
        <button class="glass-btn danger lg" onclick="app.showScreen('recovery')">
          <i data-lucide="zap"></i>
          <span>تخلیه اضطراری عقب‌افتادگی</span>
        </button>
      </div>

      <div class="thumb-friendly-grid">
        <div class="thumb-action-card glass-card" onclick="app.showScreen('study')">
          <div class="icon-circle">
            <i data-lucide="heart-pulse"></i>
          </div>
          <h3>مرور سریع نکات حیاتی و ECG</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">کارت‌های مرگ‌وزندگی (High-Yield) را در کمتر از ۸ دقیقه مرور کنید.</p>
          <button class="glass-btn primary" style="width:100%;">شروع مرور ۱۰ کارته</button>
        </div>

        <div class="thumb-action-card glass-card" onclick="app.showScreen('recovery')">
          <div class="icon-circle" style="background:#fee2e2; color:#dc2626;">
            <i data-lucide="refresh-cw"></i>
          </div>
          <h3>ریکاوری اضطراری (۵ دقیقه)</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">اگر فقط ۵ دقیقه وقت بین راند بخش دارید، این بهترین گزینه است.</p>
          <button class="glass-btn danger" style="width:100%;">شروع ریکاوری سریع</button>
        </div>
      </div>
    </div>
  `
};

/**
 * بخش ۲: توابع ناوبری تعاملی، چرخش کارت، الگوریتم ریکاوری و راه‌اندازی
 */

const app = {
  init() {
    this.renderDashboard();
    this.setupListeners();
    this.updateRecoveryPrescription(appState.recoveryMinutes);
    this.renderCourses();
    lucide.createIcons();
  },

  // تنظیم چیدمان داشبورد
  setLayout(variant) {
    appState.activeLayout = variant;
    document.body.setAttribute('data-layout', variant);

    document.querySelectorAll('#layoutSwitcher .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-variant') === variant);
    });

    this.renderDashboard();
  },

  // تنظیم استایل دکمه‌ها
  setBtnStyle(btnStyle) {
    document.body.classList.remove('btn-style-glass', 'btn-style-3d', 'btn-style-outline');
    document.body.classList.add(btnStyle);
    appState.activeBtnStyle = btnStyle;

    document.querySelectorAll('#btnStyleSwitcher .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-btn-style') === btnStyle);
    });
  },

  // تعویض صفحات اپلیکیشن
  showScreen(screenId) {
    appState.activeScreen = screenId;

    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    document.querySelectorAll('.main-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
    });

    if (screenId === 'study') {
      this.resetCardState();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  },

  // رندر داشبورد بر اساس چیدمان فعال
  renderDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    const templateFn = dashboardTemplates[appState.activeLayout] || dashboardTemplates.quizlet;
    container.innerHTML = templateFn();

    // اگر آنکی انتخاب شده بود، هیت‌مپ را تولید کن
    if (appState.activeLayout === 'anki') {
      this.generateHeatmap();
    }

    lucide.createIcons();
  },

  // تولید هیت‌مپ فعالیت ۳۰ روز گذشته
  generateHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;

    let html = '';
    const levels = ['level-1', 'level-2', 'level-3', 'level-4'];

    for (let c = 0; c < 22; c++) {
      html += '<div class="heatmap-col">';
      for (let r = 0; r < 5; r++) {
        const rand = Math.random();
        let lvl = '';
        if (rand > 0.3) {
          lvl = levels[Math.floor(Math.random() * levels.length)];
        }
        html += `<div class="heatmap-cell ${lvl}" title="فعالیت روزانه"></div>`;
      }
      html += '</div>';
    }
    grid.innerHTML = html;
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

  // ثبت پاسخ FSRS و گذر به کارت یا صفحه بعد
  rateCard(rating) {
    const ratingLabels = { 1: 'دوباره', 2: 'سخت', 3: 'خوب', 4: 'راحت' };
    
    // شبیه‌سازی ثبت موفقیت‌آمیز
    this.showToast(`پاسخ «${ratingLabels[rating]}» در الگوریتم FSRS ثبت شد.`);

    setTimeout(() => {
      this.showScreen('results');
    }, 600);
  },

  // محاسبه‌گر داینامیک اتاق بازیابی (Recovery Mode)
  updateRecoveryPrescription(minutes) {
    appState.recoveryMinutes = minutes;
    const display = document.getElementById('timeValueDisplay');
    const box = document.getElementById('prescriptionBox');
    if (display) display.textContent = `${minutes} دقیقه`;

    if (!box) return;

    const cardsCount = Math.round(minutes * 1.8);
    const retentionBoost = Math.min(95, Math.round(60 + (minutes * 0.75)));

    box.innerHTML = `
      <div class="prescription-card">
        <div class="prescription-info">
          <h4>📋 نسخه جبرانی برای زمان انتخابی (${minutes} دقیقه):</h4>
          <p>
            تعداد <strong>${cardsCount} کارت با بالاترین ریسک فراموشی</strong> برای شما تفکیک شد. 
            تکمیل این جلسه پایداری حافظه شما را تا <strong>${retentionBoost}٪</strong> بازمی‌گرداند.
          </p>
        </div>
        <button class="glass-btn primary" onclick="app.showScreen('study')">
          <i data-lucide="play"></i>
          <span>شروع ریکاوری هوشمند (${cardsCount} کارت)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
  },

  // رندر کارت‌های دروس در صفحه دروس
  renderCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    grid.innerHTML = medicalDecks.map(d => `
      <div class="quizlet-deck-card glass-card" style="margin-bottom:14px;" onclick="app.showScreen('study')">
        <div class="deck-meta-row">
          <span>${d.category}</span>
          <span>کل: ${d.cards} کارت</span>
        </div>
        <h3 class="deck-name">${d.title}</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin: 6px 0 12px 0;">شامل نکات پره‌انترنی، آزمون دستیاری و فلش‌کارت‌های مرور بالینی</p>
        <button class="glass-btn outline sm" style="width:100%;">مرور این مبحث</button>
      </div>
    `).join('');
  },

  // نمایش پیام نرم Toast
  showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(15, 23, 42, 0.9)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '9999px';
    toast.style.fontSize = '0.88rem';
    toast.style.zIndex = '9999';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  },

  // ثبت رویدادها
  setupListeners() {
    // سوئیچر چیدمان‌ها
    document.querySelectorAll('#layoutSwitcher .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setLayout(btn.getAttribute('data-variant'));
      });
    });

    // سوئیچر استایل دکمه‌ها
    document.querySelectorAll('#btnStyleSwitcher .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setBtnStyle(btn.getAttribute('data-btn-style'));
      });
    });

    // منوی ناوبری اصلی
    document.querySelectorAll('.main-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showScreen(btn.getAttribute('data-screen'));
      });
    });

    // چرخش کارت
    const cardWrapper = document.getElementById('flashcardWrapper');
    if (cardWrapper) {
      cardWrapper.addEventListener('click', (e) => {
        if (!e.target.closest('#fsrsButtons')) {
          this.toggleCardFlip();
        }
      });
    }

    const btnFlip = document.getElementById('btnFlipCard');
    if (btnFlip) btnFlip.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCardFlip();
    });

    const btnFlipBack = document.getElementById('btnFlipBack');
    if (btnFlipBack) btnFlipBack.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCardFlip();
    });

    // دکمه‌های امتیازدهی FSRS
    document.querySelectorAll('.fsrs-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rating = btn.getAttribute('data-rating');
        this.rateCard(rating);
      });
    });

    // اسلایدر ریکاوری
    const slider = document.getElementById('timeSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.updateRecoveryPrescription(parseInt(e.target.value, 10));
      });
    }

    // کلیدهای میانبر کیبورد (Space و 1,2,3,4)
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

// شروع به کار برنامه هنگام لود صفحه
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
