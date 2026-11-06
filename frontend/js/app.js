/**
 * MedCardy - Mobile-First JavaScript Core
 * بخش ۱: وضعیت اپلیکیشن، داده‌های بالینی و ۴ تمپلیت داشبورد موبایل
 */

const appState = {
  activeModule: 'flashcards',
  activeLayout: 'quizlet',
  activeBtnStyle: 'btn-style-glass',
  activeScreen: 'dashboard',
  activeCourseFilter: 'all',
  isCardFlipped: false,
  recoveryMinutes: 15,
  activeSession: null
};

// تابع کمکی محاسبه درصد تسلط و پیشرفت ایمن (Zero Division & Non-numeric Safe)
function calculateProgress(completed, total) {
  const c = (typeof completed === 'number' && !isNaN(completed) && isFinite(completed) && completed > 0) ? completed : 0;
  const t = (typeof total === 'number' && !isNaN(total) && isFinite(total) && total > 0) ? total : 0;
  if (t === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((c / t) * 100)));
}

// ساختار داده ۴ دوره خریداری شده دانشجو (4 Purchased Medical Courses Schema)
const purchasedCourses = [
  {
    id: 'cardiology',
    title: 'بیماری‌های قلب و عروق',
    shortTitle: 'کاردیولوژی',
    enTitle: 'Cardiology',
    icon: '🫀',
    accentColor: '#ef4444',
    badge: 'دوره خریداری شده',
    totalCards: 162,
    cards: 162,
    due: 30,
    overdue: 18,
    newCards: 18,
    progress: 78,
    decks: [
      {
        id: 'cardio-ecg',
        courseId: 'cardiology',
        title: 'الکتروکاردیوگرام (ECG) و آریتمی‌ها',
        category: 'قلب و عروق',
        cards: 64,
        due: 12,
        overdue: 8,
        newCards: 6,
        progress: 78,
        cardsList: [
          {
            id: 'c-ecg-1',
            question: 'تشخیص قطعی اختلال ریتم و داروی خط اول ممنوعه در صورت بروز AF چیست؟',
            answer: 'در حضور AF با WPW تجویز داروهای بلوک‌کننده گره AV مانند آدنوزین، بتابلوکر، وراپامیل و دیگوکسین به علت خطر VF ممنوع است.',
            scenario: 'مرد ۲۸ ساله با طپش قلب ناگهانی و احساس سبکی سر. نوار قلب کوتاهی فاصله PR و شیب اولیه کند در کمپلکس QRS (موج دلتا) را نشان می‌دهد.',
            pearl: 'در ولف-پارکینسون-وایت (WPW) در صورت AF داروی انتخابی پروکائین‌آمید یا کاردیوورژن همزمان است.',
            diagnosis: 'سندرم ولف-پارکینسون-وایت (WPW)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'c-ecg-2',
            question: 'تشخیص اختلال ریتم در نوار قلب و اقدام اورژانسی اولیه چیست؟',
            answer: 'بلوک کامل قلبی درجه ۳ (Complete Heart Block). درمان فوری آتروپین و آمادگی برای تعبیه ضربان‌ساز موقت (Pacing).',
            scenario: 'بیمار ۶۲ ساله دیابتی با سرگیجه و ضربان قلب ۳۸ در دقیقه. در نوار قلب امواج P منظم و کمپلکس‌های QRS منظم بدون ارتباط با هم دیده می‌شوند.',
            pearl: 'در بلوک درجه سه، ریت دهلیز و بطن کاملاً از هم مستقل و تفکیک‌شده (AV dissociation) هستند.',
            diagnosis: 'بلوک کامل دهلیزی-بطنی (CHB)',
            badge: '🚨 اورژانس قلبی'
          }
        ]
      },
      {
        id: 'cardio-acs',
        courseId: 'cardiology',
        title: 'سندرم کرونری حاد و ایسکمی (ACS)',
        category: 'قلب و عروق',
        cards: 52,
        due: 10,
        overdue: 6,
        newCards: 7,
        progress: 82,
        cardsList: [
          {
            id: 'c-acs-1',
            question: 'تشخیص بالینی، شریان درگیر احتمالی و اقدام مداخله‌ای استاندارد چیست؟',
            answer: 'انفارکتوس حاد میوکارد قدامی (Anterior STEMI) ناشی از انسداد LAD. اقدام فوری آنژیوپلاستی اولیه (Primary PCI) زیر ۹۰ دقیقه.',
            scenario: 'مرد ۵۵ ساله با درد فشاری پشت جناغ انتشار یافته به فک چپ همراه با تعریق سرد از ۲ ساعت قبل. در نوار قلب صعود قطعه ST به میزان ۳ میلی‌متر در V1-V4 دیده می‌شود.',
            pearl: 'در STEMI زمان طلایی Door-to-Balloon کمتر از ۹۰ دقیقه است؛ تجویز فوری آسپرین و مهارکننده P2Y12 الزامی است.',
            diagnosis: 'انفارکتوس حاد قدامی میوکارد (Anterior STEMI)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'c-acs-2',
            question: 'تشخیص سندرم ایسکمیک و پروتکل استاندارد درمان ضدپلاکتی و ضد انعقادی چیست؟',
            answer: 'انفارکتوس NSTEMI. شروع درمان با DAPT (آسپرین + کلوپیدوگرل/تیکاگرلور)، انوکساپارین، استاتین دوز بالا و ارزیابی عروقی.',
            scenario: 'زن ۶۸ ساله با سابقه CAD که به علت درد قفسه سینه در استراحت مراجعه کرده، تروپونین مثبت اما ECG بدون صعود ST و همراه با معکوس شدن موج T است.',
            pearl: 'تروپونین بالا بدون بالارفتن قطعه ST مشخصه اصلی NSTEMI است؛ در ناپایداری همودینامیک آنژیوگرافی فوری لازم است.',
            diagnosis: 'انفارکتوس بدون صعود قطعه ST (NSTEMI)',
            badge: '⭐ High Yield بالینی'
          }
        ]
      },
      {
        id: 'cardio-hf',
        courseId: 'cardiology',
        title: 'نارسایی قلب و بیماری‌های دریچه‌ای',
        category: 'قلب و عروق',
        cards: 46,
        due: 8,
        overdue: 4,
        newCards: 5,
        progress: 74,
        cardsList: [
          {
            id: 'c-hf-1',
            question: 'تشخیص بالینی و ۴ رده دارویی کاهنده مرگ‌ومیر در نارسایی قلب (HFrEF) کدامند؟',
            answer: 'نارسایی احتقانی قلب (CHF). داروهای کاهنده مورتالیتی: ARNI/ACEi، بتابلوکر اختصاصی، آنتاگونیست آلدوسترون (MRA) و مهارکننده SGLT2.',
            scenario: 'مرد ۷۰ ساله با تنگی نفس حمله‌ای شبانه (PND)، ارتوپنه و ادم گوده‌گذار اندام تحتانی. در سمع قلب گالوپ S3 و کراکل دوطرفه ریه شنیده می‌شود.',
            pearl: 'فوروزماید احتقان حاد را سریع کنترل می‌کند اما به تنهایی مورتالیتی درازمدت را تغییر نمی‌دهد.',
            diagnosis: 'نارسایی احتقانی قلب (HFrEF)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'c-hf-2',
            question: 'تشخیص ضایعه دریچه‌ای و شایع‌ترین آریتمی ناشی از اتساع دهلیز چپ چیست؟',
            answer: 'تنگی دریچه میترال (Mitral Stenosis). شایع‌ترین عارضه آریتمی فیبریلاسیون دهلیزی (AF) است که نیازمند ضد انعقاد خوراکی است.',
            scenario: 'زن ۴۵ ساله با سابقه تب روماتیسمی با تنگی نفس فعالیتی و هموپتیزی خفیف. در سمع صدای اول خشن، Opening Snap بعد از S2 و سوفل دیاستولیک شنیده می‌شود.',
            pearl: 'در تنگی میترال، هر چه فاصله S2 تا Opening Snap کوتاه‌تر باشد نشان‌دهنده شدت بالاتر تنگی دریچه است.',
            diagnosis: 'تنگی روماتیسمی دریچه میترال (MS)',
            badge: '⭐ High Yield بالینی'
          }
        ]
      }
    ]
  },
  {
    id: 'pharmacology',
    title: 'فارماکولوژی بالینی',
    shortTitle: 'فارماکولوژی',
    enTitle: 'Pharmacology',
    icon: '💊',
    accentColor: '#06b6d4',
    badge: 'دوره خریداری شده',
    totalCards: 211,
    cards: 211,
    due: 43,
    overdue: 27,
    newCards: 23,
    progress: 70,
    decks: [
      {
        id: 'pharma-cns',
        courseId: 'pharmacology',
        title: 'داروهای اعصاب و روان و بیهوشی',
        category: 'فارماکولوژی بالینی',
        cards: 85,
        due: 18,
        overdue: 12,
        newCards: 10,
        progress: 68,
        cardsList: [
          {
            id: 'p-cns-1',
            question: 'مکانیسم این تداخل دارویی-غذایی چیست و درمان اورژانسی پرفشاری خون ناشی از آن کدام است؟',
            answer: 'واکنش تیرامین (Cheese Effect). مهار MAO مانع تخریب تیرامین شده و با آزادسازی کاتکول‌آمین‌ها کریز فشار خون می‌دهد. درمان فنتولامین.',
            scenario: 'بیمار تحت درمان با داروی مهارکننده MAO پس از مصرف پنیر کهنه با سردرد ضربان‌دار شدید، گرگرفتگی و فشار خون ۲۲۰/۱۲۰ مراجعه کرده است.',
            pearl: 'تیرامین یک آمین سمپاتومیمتیک غیرمستقیم است که توسط MAO دستگاه گوارش و کبد متابولیزه می‌شود.',
            diagnosis: 'کریز هیپرتنسیو ناشی از مهارکننده MAO و تیرامین',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'p-cns-2',
            question: 'تشخیص سندرم خطرناک دارویی و داروهای خط اول درمان اختصاصی آن چیست؟',
            answer: 'سندرم بدخیم نورولپتیک (NMS). درمان قطع آنتی‌پسیکوتیک، مایع‌درمانی، دانترولن (شل‌کننده عضلانی) و بروموکریپتین.',
            scenario: 'بیمار اسکیزوفرنیک تحت درمان با هالوپریدول دچار تب ۴۰ درجه، جمود شدید عضلانی لوله‌ای (Lead-pipe)، تعریق و نوسان فشار خون شده است.',
            pearl: 'در NMS سطح کراتین کیناز (CK) به دلیل رابدومیولیز شدید ناشی از انقباض مداوم عضلانی به شدت افزایش می‌یابد.',
            diagnosis: 'سندرم بدخیم نورولپتیک (NMS)',
            badge: '🚨 اورژانس دارویی'
          }
        ]
      },
      {
        id: 'pharma-abx',
        courseId: 'pharmacology',
        title: 'آنتی‌بیوتیک‌ها و درمان‌های ضدمیکروبی',
        category: 'فارماکولوژی بالینی',
        cards: 72,
        due: 15,
        overdue: 9,
        newCards: 8,
        progress: 72,
        cardsList: [
          {
            id: 'p-abx-1',
            question: 'نام این عارضه، مکانیسم پاتوفیزیولوژیک آن و اقدام پیشگیرانه در دفعات بعدی چیست؟',
            answer: 'سندرم مرد قرمز (Red Man Syndrome). ناشی از دگرانولاسیون مستقیم ماست‌سل‌ها توسط وانکومایسین. پیشگیری با کاهش سرعت انفوزیون به بیش از ۶۰ دقیقه و آنتی‌هیستامین.',
            scenario: 'بیمار ۳۵ ساله تحت درمان با وانکومایسین در جریان انفوزیون سریع دچار اریتم منتشر صورت و بالاتنه، خارش شدید و افت فشار خون شد.',
            pearl: 'سندرم ردمن واکنش آلرژیک واقعی با واسطه IgE نیست بلکه واکنش شبه‌آنافیلاکسی وابسته به نرخ تزریق است.',
            diagnosis: 'سندرم مرد قرمز (Red Man Syndrome)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'p-abx-2',
            question: 'کدام دسته آنتی‌بیوتیکی مسبب این عارضه تاندونوپاتی است و مکانیسم عمل آن چیست؟',
            answer: 'فلوروکینولون‌ها (مانند سیپروفلوکساسین). مکانیسم مهار توپوایزومراز II (DNA ژیراز) و IV باکتریایی است که عارضه تاندونیت ایجاد می‌کند.',
            scenario: 'ورزشکار جوان پس از مصرف داروی ضدمیکروبی برای عفونت ادراری، با درد و پارگی خودبه‌خودی تاندون آشیل پا مراجعه کرده است.',
            pearl: 'فلوروکینولون‌ها در مصرف همزمان با کورتیکواستروئیدها بیشترین خطر پارگی تاندون آشیل را به همراه دارند.',
            diagnosis: 'تاندونوپاتی ناشی از فلوروکینولون‌ها',
            badge: '⭐ High Yield بالینی'
          }
        ]
      },
      {
        id: 'pharma-cvs',
        courseId: 'pharmacology',
        title: 'داروهای قلبی، عروقی و فشار خون',
        category: 'فارماکولوژی بالینی',
        cards: 54,
        due: 10,
        overdue: 6,
        newCards: 5,
        progress: 70,
        cardsList: [
          {
            id: 'p-cvs-1',
            question: 'اختلال الکترولیتی ایجاد شده و اولین داروی تثبیت‌کننده غشای قلب در اورژانس چیست؟',
            answer: 'هیپرکالمی شدید ناشی از تداخل دارویی. اقدام اورژانسی اول: تزریق فوری گلوکونات کلسیم ۱۰٪ وریدی جهت پایدارسازی غشای سلول‌های میوکارد.',
            scenario: 'بیمار مبتلا به نارسایی قلبی تحت درمان با انالاپریل و اسپیرونولاکتون دچار ضعف شدید شده و در نوار قلب امواج T نوک‌تیز و بلند (Peaked T) دارد.',
            pearl: 'کلسیم گلوکونات سطح پتاسیم سرم را تغییر نمی‌دهد بلکه آستانه تحریک میوکارد را اصلاح کرده و از آریتمی کشنده ممانعت می‌کند.',
            diagnosis: 'هیپرکالمی ناشی از مهار سیستم RAAS',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'p-cvs-2',
            question: 'علت بیوشیمیایی سرفه خشک ناشی از این دارو چیست و داروی خط اول جایگزین کدام است؟',
            answer: 'تجمع برادی‌کینین و ماده P به علت مهار آنزیم مبدل آنژیوتانسین (ACE). داروی جایگزین مسدودکننده گیرنده آنژیوتانسین (ARB مانند لوزارتان) است.',
            scenario: 'بیمار ۶۰ ساله با فشار خون بالا پس از شروع داروی کاپتوپریل دچار سرفه‌های خشک، مداوم و بدون خلط شبانه شده است.',
            pearl: 'داروهای ARB بر خلاف ACEi باعث افزایش برادی‌کینین نمی‌شوند و سرفه ایجاد نمی‌کنند.',
            diagnosis: 'سرفه القا شده با مهارکننده‌های ACE',
            badge: '⭐ High Yield بالینی'
          }
        ]
      }
    ]
  },
  {
    id: 'pulmonology',
    title: 'بیماری‌های تنفسی و ریه',
    shortTitle: 'داخلی ریه',
    enTitle: 'Pulmonology',
    icon: '🫁',
    accentColor: '#0284c7',
    badge: 'دوره خریداری شده',
    totalCards: 128,
    cards: 128,
    due: 23,
    overdue: 9,
    newCards: 12,
    progress: 83,
    decks: [
      {
        id: 'pulmo-copd',
        courseId: 'pulmonology',
        title: 'بیماری‌های انسدادی ریه (COPD و آسم)',
        category: 'داخلی ریه',
        cards: 48,
        due: 9,
        overdue: 4,
        newCards: 5,
        progress: 85,
        cardsList: [
          {
            id: 'pu-copd-1',
            question: 'تشخیص حمله حاد ریوی و سه داروی اساسی در درمان استاندارد آن کدامند؟',
            answer: 'تشدید حاد COPD (Exacerbation). درمان استاندارد: برونکودیلاتور استنشاقی کوتاه‌اثر (سالبوتامول + ایپراتروپیوم)، استروئید سیستمیک و آنتی‌بیوتیک.',
            scenario: 'بیمار ۶۵ ساله سیگاری مبتلا به COPD با افزایش خلط چرکی، افزایش حجم خلط و تشدید تنگی نفس (معیارهای آنتونیسن) مراجعه کرده است.',
            pearl: 'هدف اشباع اکسیژن در تشدید COPD بین ۸۸ تا ۹۲ درصد است تا مانع از احتباس CO2 شود.',
            diagnosis: 'تشدید حاد بیماری انسدادی مزمن ریه (COPD)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'pu-copd-2',
            question: 'تشخیص بیماری تنفسی و معیار اسپیرومتری پاسخ به برونکودیلاتور چیست؟',
            answer: 'آسم برونشیال. پاسخ مثبت به برونکودیلاتور با افزایش حداقل ۱۲٪ و ۲۰۰ میلی‌لیتر در FEV1 تایید می‌شود.',
            scenario: 'خانم ۲۲ ساله با حملات تنگی نفس دوره‌ای، ویزینگ شبانه و بهبود علائم با اسپری سالبوتامول مراجعه کرده است.',
            pearl: 'برگشت‌پذیری انسداد راه هوایی پس از برونکودیلاتور شاخص اصلی تمایز آسم از بیماری انسدادی مزمن ریه است.',
            diagnosis: 'آسم برونشیال مزمن (Asthma)',
            badge: '⭐ High Yield بالینی'
          }
        ]
      },
      {
        id: 'pulmo-pna',
        courseId: 'pulmonology',
        title: 'پنومونی و عفونت‌های پارانشیم ریه',
        category: 'داخلی ریه',
        cards: 42,
        due: 8,
        overdue: 3,
        newCards: 4,
        progress: 80,
        cardsList: [
          {
            id: 'pu-pna-1',
            question: 'شایع‌ترین پاتوژن باکتریایی و شاخص بالینی جهت ارزیابی بستری این بیمار چیست؟',
            answer: 'استرپتوکوکوس پنومونیه (پنوموکوک). ارزیابی شدت و بستری با معیار CURB-65 (گیجی، اوره، ریت تنفس، فشار خون و سن بالای ۶۵).',
            scenario: 'مرد ۵۰ ساله با تب و لرز ناگهانی، درد پلورتیک قفسه سینه، خلط زنگاری (Rust-colored) و کنسولیداسیون لوب تحتانی راست در گرافی ریه.',
            pearl: 'خلط زنگاری در کنار برونکوگرام هوایی در رادیوگرافی مشخصه کلاسیک پنومونی باکتریایی پنوموکوکی است.',
            diagnosis: 'پنومونی اکتسابی از جامعه (CAP) پنوموکوکی',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'pu-pna-2',
            question: 'تشخیص نوع پنومونی و ارگانیسم غیرمعمول مولد آن چیست؟',
            answer: 'پنومونی آتیپیک ناشی از مایکوپلاسما پنومونیه (Mycoplasma pneumoniae). تیتر آگلوتینین‌های سرد در سرم مثبت می‌شود.',
            scenario: 'جوان ۲۰ ساله در پادگان با سرفه خشک طولانی، سردرد، تب خفیف و نمای ارتشاح بینابینی دوطرفه در گرافی ریه با وضعیت بالینی عمومی مساعد.',
            pearl: 'ناهماهنگی میان نمای رادیوگرافی پر از ارتشاح و وضعیت بالینی نسبتاً پایدار بیمار مشخصه پنومونی آتیپیک (Walking Pneumonia) است.',
            diagnosis: 'پنومونی آتیپیک بینابینی (مایکوپلاسما)',
            badge: '⭐ High Yield بالینی'
          }
        ]
      },
      {
        id: 'pulmo-abg',
        courseId: 'pulmonology',
        title: 'تفسیر گازهای خون شریانی (ABG) و ICU',
        category: 'داخلی ریه',
        cards: 38,
        due: 6,
        overdue: 2,
        newCards: 3,
        progress: 84,
        cardsList: [
          {
            id: 'pu-abg-1',
            question: 'نوع اختلال اسید و باز، مقدار آنیون گپ و علت زمینه‌ای چیست؟',
            answer: 'اسیدوز متابولیک با آنیون گپ بالا (HAGMA) همراه با جبران تنفسی مناسب. آنیون گپ = ۳۲. تشخیص کتواسیدوز دیابتی (DKA).',
            scenario: 'بیمار مبتلا به دیابت با تنفس‌های عمیق کوسمال و تنفس استونی. برگه ABG نشان می‌دهد: pH=7.18, PaCO2=22, HCO3=8, Na=138, Cl=98.',
            pearl: 'فرمول Anion Gap برابر با Na - (Cl + HCO3) است؛ عدد بالاتر از ۱۲ نشانه اسیدوز با گپ بالاست.',
            diagnosis: 'کتواسیدوز دیابتی با اسیدوز متابولیک (DKA / HAGMA)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'pu-abg-2',
            question: 'نوع اختلال اسید-باز و علت اسپاسم عضلانی (کارپوپدال) در این بیمار چیست؟',
            answer: 'آلکالوز تنفسی حاد ناشی از تنفس‌های سریع اضطرابی. آلکالوز کلسیم یونیزه را کاهش داده و علائم تتانی ایجاد می‌کند.',
            scenario: 'دختر ۲۴ ساله پس از استرس شدید با تنگی نفس و اسپاسم دست‌ها مراجعه کرده است: pH=7.55, PaCO2=24, HCO3=22.',
            pearl: 'در آلکالوز تنفسی با کاهش هیدروژن متصل به آلبومین، اتصال کلسیم یونیزه به آلبومین افزایش یافته و هیپوکلسمی کاذب علامتی رخ می‌دهد.',
            diagnosis: 'آلکالوز تنفسی حاد ناشی از هایپرونتیلاسیون',
            badge: '⭐ High Yield بالینی'
          }
        ]
      }
    ]
  },
  {
    id: 'pediatrics',
    title: 'طب کودکان و نوزادان',
    shortTitle: 'پدیاتریکس',
    enTitle: 'Pediatrics',
    icon: '👶',
    accentColor: '#ec4899',
    badge: 'دوره خریداری شده',
    totalCards: 134,
    cards: 134,
    due: 26,
    overdue: 12,
    newCards: 14,
    progress: 76,
    decks: [
      {
        id: 'peds-er',
        courseId: 'pediatrics',
        title: 'اورژانس‌های طب کودکان و تشنج تب‌دار',
        category: 'طب کودکان',
        cards: 50,
        due: 10,
        overdue: 5,
        newCards: 6,
        progress: 76,
        cardsList: [
          {
            id: 'pe-er-1',
            question: 'تشخیص نوع تشنج و رویکرد مدیریتی اورژانس چیست؟',
            answer: 'تشنج تب‌دار ساده (Simple Febrile Seizure). اطمینان‌بخشی به والدین، کنترل تب با استامینوفن؛ نیاز به سی‌تی اسکن یا نوار مغز روتین نیست.',
            scenario: 'کودک ۲ ساله با سابقه سرماخوردگی دچار تب ۳۹.۵ درجه و یک حمله تشنج تونیک-کلونیک ژنرالیزه به مدت ۳ دقیقه شده است.',
            pearl: 'تشنج تب‌دار ساده کمتر از ۱۵ دقیقه طول می‌کشد، منتشر و ژنرالیزه است و در ۲۴ ساعت تکرار نمی‌شود.',
            diagnosis: 'تشنج تب‌دار ساده کودکان (Simple Febrile Seizure)',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'pe-er-2',
            question: 'تشخیص بیماری و درمان دارویی خط اول اورژانسی آن چیست؟',
            answer: 'کروپ حاد ویروسی (لارنگوتراکئوبرونشیت). درمان استاندارد: دگزامتازون (۰.۶ mg/kg) و نبولایزر اپی‌نفرین راسمیک در صورت استریدور استراحتی.',
            scenario: 'کودک ۳ ساله با سرفه پارس‌کننده شبیه سگ (Barking cough)، استریدور دمی در استراحت و خشونت صدا در نیمه شب به اورژانس آورده شده است.',
            pearl: 'در گرافی بافت نرم گردن علامت مناره کلیسا (Steeple sign) ناشی از ادم ناحیه ساب‌گلوتیک دیده می‌شود.',
            diagnosis: 'کروپ حاد کودکان (Laryngotracheobronchitis)',
            badge: '🚨 اورژانس کودکان'
          }
        ]
      },
      {
        id: 'peds-neo',
        courseId: 'pediatrics',
        title: 'بیماری‌های شایع نوزادان و ایکتر',
        category: 'طب کودکان',
        cards: 44,
        due: 9,
        overdue: 4,
        newCards: 4,
        progress: 78,
        cardsList: [
          {
            id: 'pe-neo-1',
            question: 'مکانیسم بروز زردی نوزاد و خط اول مداخله درمانی چیست؟',
            answer: 'همولیز ناشی از ناسازگاری ABO. خط اول درمان فوتوتراپی استاندارد و مانیتورینگ بیلی‌روبین است.',
            scenario: 'نوزاد ترم ۴ روزه با زردی تا شکم و ران. بیلی‌روبین ۱۴ با غلبه غیرمستقیم، مادر O مثبت و نوزاد A مثبت و کومبس مستقیم مثبت.',
            pearl: 'ناسازگاری گروه خونی ABO می‌تواند در زایمان اول نیز رخ دهد چرا که آنتی‌بادی‌های ضد A و ضد B از پیش در گردش خون مادر وجود دارند.',
            diagnosis: 'زردی همولیتیک ناشی از ناسازگاری ABO',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'pe-neo-2',
            question: 'تشخیص بحرانی و رژیم آنتی‌بیوتیکی تجربی خط اول در این نوزاد چیست؟',
            answer: 'سپسیس زودرس نوزادی (Early-onset Sepsis). رژیم تجربی شامل آمپی‌سیلین (پوشش لیستریا و استرپ گروه B) به همراه جنتامایسین.',
            scenario: 'نوزاد دختر ۲ روزه با بی‌حالی، تغذیه ضعیف، افت دمای بدن (هیپوترمی ۳۵.۸) و زمان پر شدن مویرگی ۴ ثانیه.',
            pearl: 'در نوزادان عفونت سیستمیک خطرناک ممکن است به جای تب بالا با افت درجه حرارت و آپنه خود را نشان دهد.',
            diagnosis: 'سپسیس زودرس نوزادی (Neonatal Sepsis)',
            badge: '🚨 اورژانس نوزادان'
          }
        ]
      },
      {
        id: 'peds-dev',
        courseId: 'pediatrics',
        title: 'رشد، تکامل و واکسیناسیون کشوری',
        category: 'طب کودکان',
        cards: 40,
        due: 7,
        overdue: 3,
        newCards: 4,
        progress: 74,
        cardsList: [
          {
            id: 'pe-dev-1',
            question: 'آیا وضعیت تکاملی برای این سن طبیعی است و مهارت پنس انگشتی چه زمانی کامل می‌شود؟',
            answer: 'تکامل ۹ ماهگی طبیعی است. پنس ابتدایی در ۹ ماهگی و پنس ظریف نوک انگشتان (Fine Pincer) در ۱۲ ماهگی کامل می‌شود.',
            scenario: 'شیرخوار ۹ ماهه بدون کمک می‌نشیند، اشیا را بین دو دست جابه‌جا می‌کند و دد/بب می‌گوید اما پنس نوک انگشتان ندارد.',
            pearl: 'نشستن مستقل در ۸-۹ ماهگی و راه رفتن مستقل تا سن ۱۵ ماهگی از نقاط عطف مهم تکامل فیزیکی هستند.',
            diagnosis: 'ارزیابی تکامل طبیعی شیرخوار ۹ ماهه',
            badge: '⭐ High Yield بالینی'
          },
          {
            id: 'pe-dev-2',
            question: 'کدام واکسن‌ها در نوبت ۲ ماهگی طبق جدول ایمن‌سازی کشوری ایران تجویز می‌شوند؟',
            answer: 'واکسن پنج‌گانه (پنتاوالان شامل دیفتری، کزاز، سیاه‌سرفه، هپاتیت B و هموفیلوس)، قطره خوراکی فلج اطفال (OPV) و واکسن کونژوگه پنوموکوک.',
            scenario: 'نوزاد ۲ ماهه برای انجام واکسیناسیون مرحله دوم کشوری به پایگاه بهداشت آورده شده است.',
            pearl: 'واکسن‌های بدو تولد در ایران شامل ب‌ث‌ژ، قطره فلج اطفال خوراکی و هپاتیت B هستند و برنامه ۲ ماهگی با پنتاوالان آغاز می‌شود.',
            diagnosis: 'برنامه واکسیناسیون ۲ ماهگی کشوری',
            badge: '⭐ High Yield بالینی'
          }
        ]
      }
    ]
  }
];

// دک‌های بالینی به صورت Flat-Map از ۴ دوره (سازگاری کامل با تمپلیت‌های موجود)
const medicalDecks = purchasedCourses.flatMap(c => c.decks);

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
          <span>مرور هوشمند • ۳۴ کارت</span>
        </button>
      </div>

      <div class="mobile-decks-section">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 class="mobile-decks-title" style="margin:0;">۴ دوره تخصصی خریداری‌شده شما</h3>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">۱۲ دک تخصصی فعال</span>
        </div>
        <div class="mobile-decks-grid-desktop">
          ${purchasedCourses.map(course => `
            <div class="mobile-deck-card glass-card" style="border-right: 4px solid ${course.accentColor || 'var(--med-primary)'}; margin-bottom:14px;">
              <div class="m-deck-header">
                <span style="font-weight:800; font-size:1rem; color:${course.accentColor || 'var(--med-primary)'};">${course.title}</span>
                <span style="font-size:0.75rem; color:var(--text-light);">${course.totalCards} کارت کل</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin:8px 0 12px 0;">
                <span class="m-deck-due-tag">⚠️ ${course.due} مرور سررسید شده</span>
                <span style="font-size:0.78rem; color:var(--text-main); font-weight:800;">${course.progress}٪ تسلط</span>
              </div>
              
              <!-- سینی دک‌های تخصصی هر دوره (Deck Trays) -->
              <div class="course-deck-tray">
                ${course.decks.map(deck => `
                  <div class="tray-deck-pill glass-card" onclick="app.startDeckStudy('${course.id}', '${deck.id}')">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-size:0.8rem; font-weight:700;">📂 دک ${deck.title}</span>
                    </div>
                    <span class="badge-tag">${deck.due} کارت ←</span>
                  </div>
                `).join('')}
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
            <span>ادامه زنجیره • ۳۴ کارت</span>
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
          <span>حالت کشیک شب و اورژانس (Clinical Shift)</span>
        </div>
        <p class="shift-desc-text">
          طراحی ویژه استفاده با یک دست در پاویون بیمارستان برای تریاژ ۴ دوره بالینی و مرورهای ۵ دقیقه‌ای.
        </p>
        <button class="glass-btn danger block-btn" onclick="app.showScreen('recovery')">
          <i data-lucide="zap"></i>
          <span>ریکاوری اضطراری عقب‌افتادگی</span>
        </button>
      </div>

      <div class="shift-wards-grid">
        <!-- ایستگاه تریاژ ۱: قلب و کاردیولوژی -->
        <div class="shift-action-btn-card glass-card" onclick="app.startDeckStudy('cardiology', 'cardio-ecg')" style="border-right: 4px solid #ef4444;">
          <div class="icon-box" style="background:#fee2e2; color:#dc2626;">
            <i data-lucide="heart-pulse"></i>
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="font-size:0.95rem; font-weight:800; color:#b91c1c;">ایستگاه تریاژ قلب و کاردیولوژی (ECG)</h4>
              <span class="badge-tag" style="background:#fee2e2; color:#b91c1c; font-size:0.7rem;">🚨 تریاژ قرمز</span>
            </div>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:4px 0 8px 0;">آریتمی‌های کشنده، موج دلتا و سندرم کرونری حاد</p>
            <button class="glass-btn danger sm" style="width:100%;">مرور سریع ۵ دقیقه (قلب)</button>
          </div>
        </div>

        <!-- ایستگاه تریاژ ۲: فارماکولوژی و پادزهرها -->
        <div class="shift-action-btn-card glass-card" onclick="app.startDeckStudy('pharmacology', 'pharma-antidotes')" style="border-right: 4px solid #f59e0b;">
          <div class="icon-box" style="background:#fef3c7; color:#d97706;">
            <i data-lucide="pill"></i>
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="font-size:0.95rem; font-weight:800; color:#b45309;">ایستگاه تریاژ فارماکولوژی و مسمومیت‌ها</h4>
              <span class="badge-tag" style="background:#fef3c7; color:#b45309; font-size:0.7rem;">⚠️ داروهای پرخطر</span>
            </div>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:4px 0 8px 0;">پادزهرها، دوزهای اورژانسی و تداخلات دارویی حاد</p>
            <button class="glass-btn primary sm" style="width:100%;">مرور سریع ۵ دقیقه (داروها)</button>
          </div>
        </div>

        <!-- ایستگاه تریاژ ۳: ریه و مراقبت‌های ویژه ICU -->
        <div class="shift-action-btn-card glass-card" onclick="app.startDeckStudy('pulmonology', 'pulmo-copd')" style="border-right: 4px solid #0284c7;">
          <div class="icon-box" style="background:#e0f2fe; color:#0284c7;">
            <i data-lucide="wind"></i>
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="font-size:0.95rem; font-weight:800; color:#0369a1;">ایستگاه تریاژ ریه و مراقبت‌های ویژه ICU</h4>
              <span class="badge-tag" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem;">🏥 تنفس حاد</span>
            </div>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:4px 0 8px 0;">حمله حاد آسم، دیسترس تنفسی و تفسیر گاز خون ABG</p>
            <button class="glass-btn primary sm" style="width:100%;">مرور سریع ۵ دقیقه (ریه)</button>
          </div>
        </div>

        <!-- ایستگاه تریاژ ۴: اورژانس کودکان و اطفال -->
        <div class="shift-action-btn-card glass-card" onclick="app.startDeckStudy('pediatrics', 'peds-emergencies')" style="border-right: 4px solid #10b981;">
          <div class="icon-box" style="background:#ecfdf5; color:#059669;">
            <i data-lucide="baby"></i>
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="font-size:0.95rem; font-weight:800; color:#047857;">ایستگاه تریاژ کودکان و اورژانس اطفال</h4>
              <span class="badge-tag" style="background:#ecfdf5; color:#047857; font-size:0.7rem;">👶 اطفال</span>
            </div>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:4px 0 8px 0;">تب و تشنج، سپسیس نوزادی، کروپ و لارنگوتراکئیت</p>
            <button class="glass-btn primary sm" style="width:100%;">مرور سریع ۵ دقیقه (کودکان)</button>
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
  // فراخوانی امن آیکون‌های Lucide با مدیریت خطا (Fail-Soft)
  safeCreateIcons() {
    try {
      if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    } catch (_) {
      // Fail-soft: Icon rendering error must never disrupt app state
    }
  },

  init() {
    this.renderDashboard();
    this.setupListeners();
    this.updateRecoveryPrescription(appState.recoveryMinutes);
    this.renderCourses();
    this.renderPlatformCourses();
    this.safeCreateIcons();
  },

  // بازگشت به پلتفرم اصلی MedCardy
  backToPlatform() {
    appState.activeScreen = 'platform-hub';
    appState.activeModule = 'platform-hub';
    this.showScreen('platform-hub');
    this.renderPlatformCourses();
  },

  // راه‌اندازی مجدد جلسه مطالعه جاری
  restartCurrentSession() {
    const session = appState.activeSession;
    if (session && session.courseId && session.deckId && session.courseId !== 'custom') {
      this.startDeckStudy(session.courseId, session.deckId);
    } else if (session && session.queue && session.queue.length > 0) {
      this.startCustomSession(session.queue);
    } else {
      this.startDeckStudy('cardiology', 'cardio-ecg');
    }
  },

  // ورود به ماژول فلش‌کارت از پلتفرم اصلی با اعتبارسنجی شناسه دوره
  openCardsModule(courseId = 'all') {
    appState.activeModule = 'flashcards';
    const VALID_COURSES = ['all', 'cardiology', 'pharmacology', 'pulmonology', 'pediatrics'];
    appState.activeCourseFilter = (typeof courseId === 'string' && VALID_COURSES.includes(courseId)) ? courseId : 'all';
    this.showScreen('dashboard');
  },

  // تعویض چیدمان داشبورد و سراسر پلتفرم (با گارد امنیتی در برابر کلیدهای Prototype)
  setLayout(variant) {
    const VALID_LAYOUTS = ['quizlet', 'duolingo', 'anki', 'shift'];
    const safeVariant = (typeof variant === 'string' && VALID_LAYOUTS.includes(variant)) ? variant : 'quizlet';

    appState.activeLayout = safeVariant;
    if (document.body) {
      document.body.setAttribute('data-layout', safeVariant);
    }

    document.querySelectorAll('#layoutSwitcher .v-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-variant') === safeVariant);
    });

    this.renderDashboard();
    this.renderCourses();
    this.updateStudyRoomAccent();
    this.showToast(`حالت به «${safeVariant}» تغییر یافت`);
  },

  // شروع مطالعه یک دک با صف کارت‌های داینامیک و مدیریت Session
  startDeckStudy(courseId, deckId) {
    let course = null;
    let deck = null;

    const normalize = str => (typeof str === 'string' ? str.toLowerCase().replace(/[\(\)\-_\s]/g, '') : '');

    // ۱. جستجو بر اساس شناسه یا عنوان ارسالی
    if (courseId && !deckId) {
      const q = String(courseId).trim();
      const normQ = normalize(q);

      for (const c of purchasedCourses) {
        const match = (c.decks || []).find(d => {
          if (d.id === q || d.title === q) return true;
          if (d.title && d.title.includes(q)) return true;
          const normTitle = normalize(d.title);
          return normTitle.includes(normQ) || normQ.includes(normTitle);
        });
        if (match) {
          course = c;
          deck = match;
          break;
        }
      }

      // هدایت هوشمند کلمات کلیدی پزشکی
      if (!course) {
        if (/مسموم|سم|پادزهر|antidote/i.test(q)) {
          course = purchasedCourses.find(c => c.id === 'pharmacology');
          deck = course ? (course.decks.find(d => d.id === 'pharma-cvs') || course.decks[0]) : null;
        } else if (/قلب|ecg|آریتمی|cardio/i.test(q)) {
          course = purchasedCourses.find(c => c.id === 'cardiology');
          deck = course ? (course.decks.find(d => d.id === 'cardio-ecg') || course.decks[0]) : null;
        } else if (/ریه|تنفس|abg|icu|copd|آسم/i.test(q)) {
          course = purchasedCourses.find(c => c.id === 'pulmonology');
          deck = course ? (course.decks.find(d => d.id === 'pulmo-copd') || course.decks[0]) : null;
        } else if (/کودک|اطفال|نوزاد|ped|peds/i.test(q)) {
          course = purchasedCourses.find(c => c.id === 'pediatrics');
          deck = course ? (course.decks.find(d => d.id === 'peds-er') || course.decks[0]) : null;
        }
      }

      if (!course) {
        course = purchasedCourses.find(c => c.id === q || c.shortTitle === q || (c.title && c.title.includes(q)));
        if (course && course.decks && course.decks.length > 0) {
          deck = course.decks[0];
        }
      }
    } else if (courseId && deckId) {
      course = purchasedCourses.find(c => c.id === courseId);
      if (course) {
        deck = (course.decks || []).find(d => d.id === deckId || d.title === deckId || (d.title && d.title.includes(deckId)));
        if (!deck && course.decks && course.decks.length > 0) {
          // نگاشت نام‌های مستعار دک‌ها در چیدمان شیفت
          if (deckId === 'pharma-antidotes') {
            deck = course.decks.find(d => d.id === 'pharma-cvs') || course.decks[0];
          } else if (deckId === 'peds-emergencies') {
            deck = course.decks.find(d => d.id === 'peds-er') || course.decks[0];
          } else {
            deck = course.decks[0];
          }
        }
      }
    }

    if (!course) course = (purchasedCourses && purchasedCourses.length > 0) ? purchasedCourses[0] : { id: 'cardiology', title: 'کاردیولوژی', decks: [] };
    if (!deck) deck = (course && course.decks && course.decks.length > 0) ? course.decks[0] : { id: 'default-deck', title: 'مرور بالینی', cardsList: [] };

    const rawCards = (deck && Array.isArray(deck.cardsList) && deck.cardsList.length > 0) ? deck.cardsList : [];
    const validCards = rawCards.filter(c => c && typeof c === 'object').map(c => ({ ...c }));

    const cardsQueue = validCards.length > 0
      ? validCards
      : [
          {
            id: `${deck ? deck.id : 'card'}-1`,
            question: 'تشخیص اولیه و رویکرد اورژانسی در این بیمار چیست؟',
            answer: 'ارزیابی علائم حیاتی، پایش قلبی و تجویز اکسیژن هدفمند.',
            scenario: 'بیمار با درد حاد قفسه سینه و تنگی نفس به اورژانس مراجعه کرده است.',
            pearl: 'همواره ABCDE و ECG ۱۲ لید در ۱۰ دقیقه اول باید انجام شود.',
            diagnosis: 'سندرم کرونری حاد (ACS)',
            badge: '⭐ High Yield بالینی'
          }
        ];

    appState.activeSession = {
      courseId: course.id,
      deckId: deck ? deck.id : 'default-deck',
      deckTitle: deck ? deck.title : 'مرور بالینی',
      queue: cardsQueue,
      currentIndex: 0,
      reviewsCount: 0,
      correctCount: 0,
      startTime: Date.now()
    };

    const titleEl = document.getElementById('studyDeckTitle');
    if (titleEl && deck) {
      titleEl.textContent = deck.title;
    }

    this.showScreen('study');
    this.renderCurrentCard();
  },

  // به‌روزرسانی نوار بالای مطالعه متناسب با حالت انتخابی (دولینگو / آنکی / شیفت / کویزلت)
  updateStudyRoomAccent() {
    const container = document.getElementById('studyModeAccent');
    if (!container) return;

    if (appState.activeLayout === 'duolingo') {
      container.innerHTML = `
        <div class="duo-hearts-pill" title="جون‌های باقی‌مانده آزمون">
          <span>❤️❤️❤️</span>
          <span style="color:#ea580c; font-weight:800;">+15 XP</span>
        </div>
      `;
    } else if (appState.activeLayout === 'anki') {
      container.innerHTML = `
        <div class="anki-fsrs-study-pill" title="پارامتر پایداری حافظه FSRS v4">
          <span>FSRS: S=14.2d | R=92%</span>
        </div>
      `;
    } else if (appState.activeLayout === 'shift') {
      container.innerHTML = `
        <div class="shift-timer-pill" title="زمان‌سنج تریاژ بالینی">
          <span>⏱️ ۰۰:۱۸</span>
        </div>
      `;
    } else {
      const current = (appState.activeSession && typeof appState.activeSession.currentIndex === 'number')
        ? appState.activeSession.currentIndex + 1
        : 1;
      const total = (appState.activeSession && appState.activeSession.queue)
        ? appState.activeSession.queue.length
        : 12;
      container.innerHTML = `<span class="badge-tag">کارت ${this.toPersianDigits(current)} از ${this.toPersianDigits(total)}</span>`;
    }
    this.safeCreateIcons();
  },

  // تغییر استایل دکمه‌ها با اعتبارسنجی مقادیر مجاز
  setBtnStyle(btnStyle) {
    const VALID_STYLES = ['btn-style-glass', 'btn-style-3d', 'btn-style-outline'];
    const safeStyle = (typeof btnStyle === 'string' && VALID_STYLES.includes(btnStyle)) ? btnStyle : 'btn-style-glass';

    if (document.body) {
      document.body.classList.remove('btn-style-glass', 'btn-style-3d', 'btn-style-outline');
      document.body.classList.add(safeStyle);
    }
    appState.activeBtnStyle = safeStyle;

    document.querySelectorAll('#btnStyleSwitcher .style-choice-card').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-btn-style') === safeStyle);
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

  // کنترل باز و بسته شدن مودال اکوسیستم مدکاردی
  toggleModuleModal(show) {
    const backdrop = document.getElementById('moduleModalBackdrop');
    if (!backdrop) return;
    if (typeof show === 'boolean') {
      backdrop.classList.toggle('active', show);
    } else {
      backdrop.classList.toggle('active');
    }
  },

  selectModule(modName) {
    this.toggleModuleModal(false);
    this.showToast('ماژول فلش‌کارت و مرور فعال است.');
  },

  // تعویض صفحات اپلیکیشن با نوار ناوبری پایین و نوار بردکرامب
  showScreen(screenId) {
    const VALID_SCREENS = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results'];
    if (!screenId || typeof screenId !== 'string' || !VALID_SCREENS.includes(screenId)) {
      screenId = 'platform-hub';
    }
    let target = document.getElementById(`screen-${screenId}`);
    if (!target) {
      target = document.getElementById('screen-platform-hub') || document.getElementById('screen-dashboard');
    }
    appState.activeScreen = screenId;

    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    if (target) {
      target.classList.add('active');
    }

    // کنترل نمایش نوار بردکرامب و دکمه بازگشت به پلتفرم
    const breadcrumbBar = document.getElementById('moduleBreadcrumbs') || document.querySelector('.module-breadcrumb-bar');
    if (breadcrumbBar) {
      if (screenId === 'platform-hub') {
        breadcrumbBar.classList.add('hidden');
        breadcrumbBar.style.display = 'none';
      } else {
        breadcrumbBar.classList.remove('hidden');
        breadcrumbBar.style.display = 'flex';
      }
    }

    // به‌روزرسانی متن شاخه فعال در نوار مسیر (Breadcrumbs Trail)
    const leafEl = document.getElementById('activeBreadcrumbLeaf');
    if (leafEl) {
      const titles = {
        'platform-hub': 'پلتفرم اصلی',
        'dashboard': 'داشبورد',
        'study': (appState.activeSession && appState.activeSession.deckTitle) ? appState.activeSession.deckTitle : 'اتاق مطالعه',
        'recovery': 'ریکاوری هوشمند',
        'courses': 'دوره‌ها و مباحث',
        'results': 'کارنامه جلسه'
      };
      leafEl.textContent = titles[screenId] || screenId;
    }

    // به‌روزرسانی فعال بودن آیکون در نوار پایین
    document.querySelectorAll('.bottom-nav-bar .b-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
    });

    if (screenId === 'study') {
      this.resetCardState();
      this.updateStudyRoomAccent();
      if (!appState.activeSession) {
        this.startDeckStudy('cardiology', 'cardio-ecg');
      } else if (appState.activeSession.isCompleted || (appState.activeSession.queue && appState.activeSession.currentIndex >= appState.activeSession.queue.length)) {
        appState.activeSession.currentIndex = 0;
        appState.activeSession.isCompleted = false;
        this.renderCurrentCard();
      } else {
        this.renderCurrentCard();
      }
    } else if (screenId === 'courses') {
      this.renderCourses();
    } else if (screenId === 'platform-hub') {
      this.renderPlatformCourses();
    } else if (screenId === 'results') {
      this.renderResults();
    } else if (screenId === 'dashboard') {
      this.renderDashboard();
    }

    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.safeCreateIcons();
  },

  // رندر داشبورد با گارد کامل در برابر Prototype Pollution
  renderDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    let templateFn = null;
    const layout = appState.activeLayout;
    if (
      typeof mobileDashboardTemplates === 'object' &&
      mobileDashboardTemplates !== null &&
      layout &&
      typeof layout === 'string' &&
      Object.prototype.hasOwnProperty.call(mobileDashboardTemplates, layout)
    ) {
      const candidate = mobileDashboardTemplates[layout];
      if (typeof candidate === 'function') {
        templateFn = candidate;
      }
    }

    if (!templateFn) {
      templateFn = mobileDashboardTemplates.quizlet;
    }

    try {
      container.innerHTML = templateFn();
    } catch (_) {
      container.innerHTML = mobileDashboardTemplates.quizlet();
    }
    this.safeCreateIcons();
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

  // رندر کارت جاری در اتاق مطالعه از روی صف activeSession
  renderCurrentCard() {
    const session = appState.activeSession;
    if (!session || !session.queue || session.queue.length === 0) return;

    const card = session.queue[session.currentIndex] || session.queue[0];
    if (!card) return;

    const titleEl = document.getElementById('studyDeckTitle');
    if (titleEl && session.deckTitle) {
      titleEl.textContent = session.deckTitle;
    }

    const scenarioEl = document.querySelector('.card-front .scenario-text');
    if (scenarioEl) {
      scenarioEl.textContent = card.scenario || card.question || '';
    }
    const questionEl = document.querySelector('.card-front .ecg-caption');
    if (questionEl) {
      questionEl.textContent = card.question || card.scenario || '';
    }
    const badgeEl = document.querySelector('.card-front .badge-high-yield');
    if (badgeEl && card.badge) {
      badgeEl.textContent = card.badge;
    }

    const pearlBox = document.querySelector('.card-back .pearl-highlight-box');
    if (pearlBox) {
      const h3 = pearlBox.querySelector('h3');
      if (h3) h3.textContent = card.diagnosis || card.answer || '';
      const p = pearlBox.querySelector('p');
      if (p) p.textContent = card.pearl || card.answer || '';
    }
    const dangerBox = document.querySelector('.card-back .danger-contraindication-box p');
    if (dangerBox && card.answer) {
      dangerBox.textContent = card.answer;
    }

    const todayCount = document.querySelector('.dot-today');
    if (todayCount) {
      todayCount.textContent = `کارت ${session.currentIndex + 1} از ${session.queue.length}`;
    }

    appState.isCardFlipped = false;
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
      flashcard.classList.remove('flipped');
    }
    this.safeCreateIcons();
  },

  // ثبت پاسخ FSRS و پیشبرد نوبت مطالعه در صف با کنترل خطا
  rateCard(rating) {
    const session = appState.activeSession;
    if (!session || !Array.isArray(session.queue) || session.queue.length === 0) {
      return; // بازگشت بی‌صدا بدون ثبت در غیاب جلسه فعال
    }

    const parsed = (typeof rating === 'number' || typeof rating === 'string') ? parseInt(rating, 10) : NaN;
    const numericRating = (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) ? parsed : 3;

    const labels = { 1: 'دوباره (<1m)', 2: 'سخت (12h)', 3: 'خوب (1d)', 4: 'راحت (4d)' };
    const stabilities = { 1: 0.4, 2: 1.2, 3: 2.5, 4: 4.0 };
    this.showToast(`پاسخ «${labels[numericRating]}» در حافظه ثبت شد`);

    const course = session.courseId ? purchasedCourses.find(c => c.id === session.courseId) : null;
    let deck = null;

    if (course && Array.isArray(course.decks) && session.deckId) {
      deck = course.decks.find(d => d.id === session.deckId) || null;
    }

    const currentCard = session.queue[session.currentIndex];
    if (currentCard && typeof currentCard === 'object') {
      currentCard.lastRating = numericRating;

      let baseReviews = 0;
      if (deck && Array.isArray(deck.cardsList)) {
        const srcCard = deck.cardsList.find(c => c && c.id === currentCard.id);
        if (srcCard && typeof srcCard === 'object' && typeof srcCard.fsrsReviews === 'number') {
          baseReviews = srcCard.fsrsReviews;
        } else if (typeof currentCard.fsrsReviews === 'number') {
          baseReviews = currentCard.fsrsReviews;
        }
      } else if (typeof currentCard.fsrsReviews === 'number') {
        baseReviews = currentCard.fsrsReviews;
      }

      currentCard.fsrsReviews = baseReviews + 1;
      currentCard.stability = stabilities[numericRating];

      if (deck && Array.isArray(deck.cardsList)) {
        const srcCard = deck.cardsList.find(c => c && c.id === currentCard.id);
        if (srcCard && typeof srcCard === 'object') {
          srcCard.lastRating = numericRating;
          srcCard.fsrsReviews = currentCard.fsrsReviews;
          srcCard.stability = currentCard.stability;
        }
      }
    }

    session.reviewsCount = (session.reviewsCount || 0) + 1;
    if (numericRating >= 3) {
      session.correctCount = (session.correctCount || 0) + 1;
    }

    if (deck) {
      if (numericRating >= 2 && deck.due > 0) {
        deck.due--;
      }
      if (numericRating >= 3 && deck.progress < 100) {
        deck.progress = Math.min(100, deck.progress + 1);
      }
    }

    if (course) {
      this.recalculateCourseStats(course.id);
    }

    if (numericRating === 1 && currentCard && typeof currentCard === 'object') {
      session.queue.push({ ...currentCard });
    }

    if (session.currentIndex < session.queue.length - 1) {
      session.currentIndex++;
      this.renderCurrentCard();
    } else {
      session.isCompleted = true;
      this.renderResults();
      this.showScreen('results');
    }
  },

  // موتور ایزوله محاسبه آمار دوره‌ها (تنها دوره مورد نظر به‌روزرسانی می‌شود)
  recalculateCourseStats(courseId) {
    if (!courseId || typeof courseId !== 'string' || courseId === '__proto__' || courseId === 'constructor') return;
    const course = purchasedCourses.find(c => c.id === courseId);
    if (!course || !Array.isArray(course.decks) || course.decks.length === 0) return;

    course.due = Math.max(0, course.decks.reduce((sum, d) => sum + (d.due || 0), 0));
    course.overdue = Math.max(0, course.decks.reduce((sum, d) => sum + (d.overdue || 0), 0));
    course.newCards = Math.max(0, course.decks.reduce((sum, d) => sum + (d.newCards || 0), 0));
    course.totalCards = course.decks.reduce((sum, d) => sum + (d.cards || 0), 0);
    course.cards = course.totalCards;
    course.progress = Math.min(100, Math.max(0, Math.round(
      course.decks.reduce((sum, d) => sum + (d.progress || 0), 0) / course.decks.length
    )));
  },

  // تجمیع آمار کل ۴ دوره جهت داشبورد و هدر
  calculateGlobalStats() {
    const totalCards = purchasedCourses.reduce((sum, c) => sum + (c.totalCards || c.cards || 0), 0);
    const totalDue = purchasedCourses.reduce((sum, c) => sum + (c.due || 0), 0);
    const totalOverdue = purchasedCourses.reduce((sum, c) => sum + (c.overdue || 0), 0);
    const totalNew = purchasedCourses.reduce((sum, c) => sum + (c.newCards || 0), 0);
    const avgProgress = purchasedCourses.length > 0
      ? Math.round(purchasedCourses.reduce((sum, c) => sum + (c.progress || 0), 0) / purchasedCourses.length)
      : 0;

    return {
      totalCards,
      totalDue,
      totalOverdue,
      totalNew,
      avgProgress
    };
  },

  // تبدیل اعداد انگلیسی به ارقام فارسی
  toPersianDigits(num) {
    if (num === null || num === undefined) return '';
    return String(num).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  },

  // رندر آمار داینامیک کارنامه جلسه مرور در صفحه نتایج
  renderResults() {
    const session = appState.activeSession;
    if (!session) return;

    const reviewedEl = document.getElementById('resCardsReviewed') || document.querySelector('#screen-results #resCardsReviewed');
    const accuracyEl = document.getElementById('resAccuracy') || document.querySelector('#screen-results #resAccuracy');
    const timeEl = document.getElementById('resStudyTime') || document.querySelector('#screen-results #resStudyTime');
    const overdueReductionEl = document.getElementById('resOverdueReduction') || document.querySelector('#screen-results #resOverdueReduction');

    const reviews = session.reviewsCount || 0;
    const correct = session.correctCount || 0;
    const accuracy = Math.round((correct / Math.max(1, reviews)) * 100);

    if (reviewedEl) {
      reviewedEl.textContent = this.toPersianDigits(reviews);
    }
    if (accuracyEl) {
      accuracyEl.textContent = `${this.toPersianDigits(accuracy)}٪`;
    }
    if (overdueReductionEl) {
      const reducedCount = reviews > 0 ? correct : 0;
      overdueReductionEl.textContent = reducedCount > 0 ? `-${this.toPersianDigits(reducedCount)}` : '۰';
    }
    if (timeEl && session.startTime) {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - session.startTime) / 1000));
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      timeEl.textContent = `${this.toPersianDigits(String(mins).padStart(2, '0'))}:${this.toPersianDigits(String(secs).padStart(2, '0'))}`;
    }
  },

  // رندر دوره‌های پلتفرم اصلی
  renderPlatformCourses(coursesList = purchasedCourses) {
    const container = document.getElementById('platformCoursesContainer');
    if (!container) return;
    if (!coursesList || !Array.isArray(coursesList) || coursesList.length === 0) {
      container.innerHTML = '<div class="glass-card" style="padding:16px; text-align:center; color:var(--text-muted);">هیچ دوره‌ای در پلتفرم فعال نیست.</div>';
      return;
    }

    container.innerHTML = coursesList.map(c => {
      const deckCount = (c.decks && Array.isArray(c.decks)) ? c.decks.length : 0;
      const totalCards = c.totalCards || c.cards || 0;
      const dueCount = c.due || 0;
      const progress = c.progress || 0;
      const displayTitle = c.title + (c.shortTitle ? ` (${c.shortTitle})` : '');
      const subtitleText = `${c.enTitle || ''} • ${this.toPersianDigits(deckCount)} مجموعه تخصصی • ${this.toPersianDigits(totalCards)} کارت`;

      return `
        <div class="platform-course-card glass-card" data-course-id="${c.id}">
          <div class="p-course-header">
            <div class="p-course-title-wrap">
              <span class="p-course-icon">${c.icon || '📚'}</span>
              <div>
                <h4 class="p-course-title">${displayTitle}</h4>
                <span class="p-course-subtitle">${subtitleText}</span>
              </div>
            </div>
            <span class="badge-tag">${c.badge || 'دوره خریداری شده'}</span>
          </div>
          <div class="p-course-metrics">
            <div class="p-metric-item">
              <span class="p-metric-val text-primary">${this.toPersianDigits(totalCards)}</span>
              <span class="p-metric-lbl">کل کارت‌ها</span>
            </div>
            <div class="p-metric-item">
              <span class="p-metric-val text-danger">${this.toPersianDigits(dueCount)}</span>
              <span class="p-metric-lbl">سررسید مرور</span>
            </div>
            <div class="p-metric-item">
              <span class="p-metric-val text-success">${this.toPersianDigits(progress)}٪</span>
              <span class="p-metric-lbl">میزان تسلط</span>
            </div>
          </div>
          <div class="p-course-progress-bar">
            <div class="p-progress-fill" style="width:${progress}%; background-color:${c.accentColor || '#0284c7'};"></div>
          </div>
          <div class="p-course-actions">
            <button class="glass-btn primary block-btn sm" onclick="app.openCardsModule('${c.id}')">
              <i data-lucide="play-circle"></i>
              <span>ورود به ماژول / مطالعه دوره</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.safeCreateIcons();
  },

  // راه‌اندازی جلسه مطالعه با کارت‌های دلخواه با پالایش کامل داده‌ها
  startCustomSession(cards = []) {
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      this.showToast('هیچ کارتی برای مطالعه در صف قرار ندارد.');
      return;
    }

    const sanitizedQueue = cards
      .filter(c => c && typeof c === 'object')
      .map((c, i) => ({
        id: c.id || `custom-${i + 1}`,
        question: c.question || c.title || 'سؤال بالینی',
        answer: c.answer || c.pearl || 'پاسخ بالینی',
        scenario: c.scenario || c.question || 'سناریوی بالینی کیس',
        diagnosis: c.diagnosis || c.answer || 'تشخیص بالینی',
        pearl: c.pearl || c.answer || 'نکته مروارید بالینی',
        badge: c.badge || '⭐ کارت سفارشی',
        ...c
      }));

    if (sanitizedQueue.length === 0) {
      this.showToast('فرمت کارت‌های ارسالی معتبر نیست.');
      return;
    }

    appState.activeSession = {
      courseId: 'custom',
      deckId: 'custom',
      deckTitle: 'مطالعه سفارشی',
      queue: sanitizedQueue,
      currentIndex: 0,
      reviewsCount: 0,
      correctCount: 0,
      startTime: Date.now()
    };
    this.showScreen('study');
    this.renderCurrentCard();
  },

  // راه‌اندازی جلسه مطالعه ریکاوری هوشمند با گردآوری کارت‌های بحرانی
  startRecoverySession(minutes) {
    let min = appState.recoveryMinutes || 15;
    if (typeof minutes === 'number' && !isNaN(minutes)) {
      min = Math.max(5, Math.min(60, Math.trunc(minutes)));
    } else if (typeof minutes === 'string') {
      const parsed = parseInt(minutes, 10);
      min = Number.isFinite(parsed) ? Math.max(5, Math.min(60, parsed)) : (appState.recoveryMinutes || 15);
    }
    const cardsCount = Math.round(min * 1.8);
    let recoveryCards = [];
    purchasedCourses.forEach(c => {
      (c.decks || []).forEach(d => {
        if (Array.isArray(d.cardsList)) {
          recoveryCards.push(...d.cardsList);
        }
      });
    });
    if (recoveryCards.length === 0) {
      this.startDeckStudy('cardiology', 'cardio-ecg');
      return;
    }
    const selected = recoveryCards.slice(0, Math.max(1, cardsCount));
    appState.activeSession = {
      courseId: 'recovery',
      deckId: 'recovery-smart',
      deckTitle: `ریکاوری هوشمند (${this.toPersianDigits(selected.length)} کارت)`,
      queue: [...selected],
      currentIndex: 0,
      reviewsCount: 0,
      correctCount: 0,
      startTime: Date.now()
    };
    this.showScreen('study');
    this.renderCurrentCard();
  },

  // محاسبه نسخه ریکاوری هوشمند با ایمن‌سازی کامل ورودی زمان
  updateRecoveryPrescription(minutes) {
    let safeMinutes = 15;
    if (typeof minutes === 'number' && !isNaN(minutes)) {
      safeMinutes = Math.max(5, Math.min(60, Math.trunc(minutes)));
    } else if (typeof minutes === 'string') {
      const parsed = parseInt(minutes, 10);
      safeMinutes = Number.isFinite(parsed) ? Math.max(5, Math.min(60, parsed)) : 15;
    }

    appState.recoveryMinutes = safeMinutes;
    const display = document.getElementById('timeValueDisplay');
    const box = document.getElementById('prescriptionBox');
    if (display) display.textContent = `${safeMinutes} دقیقه`;

    if (!box) return;

    const cardsCount = Math.round(safeMinutes * 1.8);
    const retentionRate = Math.min(95, Math.max(50, Math.round(62 + (safeMinutes * 0.72))));

    box.innerHTML = `
      <div class="mobile-prescription">
        <h4>📋 نسخه پیشنهادی (${safeMinutes} دقیقه):</h4>
        <p>
          الگوریتم تعداد <strong>${cardsCount} کارت بحرانی</strong> را گزینش کرد. مطالعه این موارد نرخ یادآوری را به <strong>${retentionRate}٪</strong> می‌رساند.
        </p>
        <button class="glass-btn primary block-btn" onclick="app.startRecoverySession(${safeMinutes})">
          <i data-lucide="play"></i>
          <span>شروع نجات کارت‌ها (${cardsCount} کارت)</span>
        </button>
      </div>
    `;
    this.safeCreateIcons();
  },

  // رندر کامپوننت دروس متناسب با ۴ حالت مختلف
  renderCourses() {
    const container = document.getElementById('coursesDynamicContent');
    if (!container) return;

    // ۱. حالت دولینگو: مسیر یادگیری مرحله‌ای (Learning Path)
    if (appState.activeLayout === 'duolingo') {
      container.innerHTML = `
        <div class="glass-card" style="padding:16px; margin-bottom:14px; text-align:center;">
          <h3 style="font-size:1.1rem; font-weight:900; color:#ea580c;">نقشه یادگیری دولینگو (Learning Path)</h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">با فتح هر مرحله، گره بعدی قفل‌گشایی می‌شود!</p>
        </div>

        <div class="duo-path-view">
          <div class="path-node-row" onclick="app.startDeckStudy('الکتروکاردیوگرام و آریتمی‌ها')">
            <div class="path-circle-node completed">
              <span class="node-stars-badge">★★★</span>
              <span>🫀</span>
            </div>
            <span class="node-title-chip">۱. آریتمی‌های قلبی</span>
          </div>

          <div class="path-connector-line"></div>

          <div class="path-node-row" onclick="app.startDeckStudy('داروهای اعصاب و روان و بیهوشی')">
            <div class="path-circle-node completed">
              <span class="node-stars-badge">★★☆</span>
              <span>💊</span>
            </div>
            <span class="node-title-chip">۲. فارماکولوژی بالینی</span>
          </div>

          <div class="path-connector-line"></div>

          <div class="path-node-row" onclick="app.startDeckStudy('بیماری‌های انسدادی ریه')">
            <div class="path-circle-node" style="border-color:#0284c7; box-shadow: 0 0 16px rgba(2,132,199,0.5);">
              <span class="node-stars-badge">★☆☆</span>
              <span>🫁</span>
            </div>
            <span class="node-title-chip" style="background:#e0f2fe; color:#0369a1;">۳. آسم و COPD (فعال)</span>
          </div>

          <div class="path-connector-line"></div>

          <div class="path-node-row" onclick="app.showToast('این مرحله قفل است! ابتدا مرحله ۳ را تکمیل کنید.')">
            <div class="path-circle-node locked">
              <span>🔒</span>
            </div>
            <span class="node-title-chip">۴. مننژیت و مایع مغزی</span>
          </div>

          <div class="path-connector-line"></div>

          <div class="path-node-row" onclick="app.showToast('آزمون نهایی جامع پره‌انترنی')">
            <div class="path-circle-node" style="border-color:#f59e0b; background:#fffbeb;">
              <span>🏆</span>
            </div>
            <span class="node-title-chip" style="color:#b45309;">۵. جام پره‌انترنی</span>
          </div>
        </div>
      `;
    } 
    // ۲. حالت آنکی: ماتریس درختی و دیتامحور
    else if (appState.activeLayout === 'anki') {
      container.innerHTML = `
        <div class="glass-card" style="padding:16px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:1.05rem; font-weight:800;">درخت دک‌های آنکی (Hierarchical Decks)</h3>
            <span class="anki-fsrs-badge">ماتریس FSRS v4</span>
          </div>
        </div>

        <div class="anki-decks-tree">
          ${medicalDecks.map(deck => `
            <div class="mobile-deck-card glass-card" onclick="app.startDeckStudy('${deck.title}')" style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h4 style="font-size:0.92rem; font-weight:700;">📁 ${deck.title}</h4>
                  <span style="font-size:0.72rem; color:var(--text-light);">${deck.category}</span>
                </div>
                <div class="anki-card-chips">
                  <span class="anki-chip due" title="سررسید">${deck.due}</span>
                  <span class="anki-chip overdue" title="عقب‌افتاده">${deck.overdue}</span>
                  <span class="anki-chip new" title="جدید">${deck.newCards}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } 
    // ۳. حالت شیفت و اورژانس: تفکیک بر اساس بخش‌های بیمارستان
    else if (appState.activeLayout === 'shift') {
      container.innerHTML = `
        <div class="glass-card" style="padding:16px; margin-bottom:14px; border-right:4px solid var(--med-danger);">
          <h3 style="font-size:1.05rem; font-weight:800; color:#b91c1c;">تریاژ مباحث بر اساس بخش‌های بیمارستان</h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">کارت‌های بالینی تفکیک‌شده برای کشیک‌های فشرده</p>
        </div>

        <div class="shift-courses-grid" style="display:grid; grid-template-columns:1fr; gap:10px;">
          <div class="mobile-deck-card glass-card" onclick="app.startDeckStudy('اورژانس قلب و ECG')" style="border-right:3px solid #ef4444;">
            <h4 style="font-weight:800;">🚨 اورژانس و تروما روم (۱۲ کارت حیاتی)</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">پروتکل‌های احیا، شوک و اینتوباسیون فوری</p>
          </div>
          <div class="mobile-deck-card glass-card" onclick="app.startDeckStudy('داروهای بخش مسمومین')" style="border-right:3px solid #f59e0b;">
            <h4 style="font-weight:800;">🧪 مسمومیت‌ها و پادزهرها (۸ کارت)</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">آنتی‌دوت‌های اورژانسی و گاواژ معده</p>
          </div>
          <div class="mobile-deck-card glass-card" onclick="app.startDeckStudy('مراقبت‌های ویژه ICU و ABG')" style="border-right:3px solid #0284c7;">
            <h4 style="font-weight:800;">🏥 مراقبت‌های ویژه ICU (۶ کارت)</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">تنظیم ونتیلاتور و اختلالات اسید-باز</p>
          </div>
        </div>
      `;
    } 
    // ۴. حالت پیش‌فرض کویزلت مدرن
    else {
      container.innerHTML = `
        <div class="courses-search-bar glass-card" style="margin-bottom:14px; padding:10px 14px; display:flex; align-items:center; gap:8px;">
          <i data-lucide="search" style="color:var(--text-light); width:18px;"></i>
          <input type="text" placeholder="جستجو در درس‌ها، داروها و علائم..." style="border:none; background:transparent; width:100%; outline:none; font-family:inherit; font-size:0.85rem;">
        </div>

        <div class="courses-list">
          ${medicalDecks.map(d => `
            <div class="mobile-deck-card glass-card" onclick="app.startDeckStudy('${d.title}')" style="margin-bottom:12px;">
              <div class="m-deck-header">
                <span>${d.category}</span>
                <span>کل: ${d.cards} کارت</span>
              </div>
              <h4 class="m-deck-title">${d.title}</h4>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span class="m-deck-due-tag">⚠️ ${d.due} کارت در نوبت مرور</span>
                <span style="font-size:0.74rem; color:var(--med-primary); font-weight:700;">مطالعه ←</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    this.safeCreateIcons();
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

    // مودال اکوسیستم جامع مدکاردی
    const btnOpenModule = document.getElementById('btnOpenModuleModal');
    if (btnOpenModule) {
      btnOpenModule.addEventListener('click', () => this.toggleModuleModal(true));
    }

    const btnCloseModule = document.getElementById('btnCloseModuleModal');
    if (btnCloseModule) {
      btnCloseModule.addEventListener('click', () => this.toggleModuleModal(false));
    }

    const moduleBackdrop = document.getElementById('moduleModalBackdrop');
    if (moduleBackdrop) {
      moduleBackdrop.addEventListener('click', (e) => {
        if (e.target === moduleBackdrop) this.toggleModuleModal(false);
      });
    }

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

    // دکمه‌های پاسخ FSRS با محافظت از کلیک مکرر و دوگانه (Debounce Guard)
    let lastRatingTriggerTime = 0;
    const RATING_DEBOUNCE_MS = 250;

    document.querySelectorAll('.thumb-fsrs-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastRatingTriggerTime < RATING_DEBOUNCE_MS) {
          return; // نادیده‌گرفتن کلیک مضاعف ناخواسته
        }
        lastRatingTriggerTime = now;

        const btnContainer = document.getElementById('fsrsButtons');
        if (btnContainer) {
          btnContainer.style.pointerEvents = 'none';
          setTimeout(() => {
            if (btnContainer) btnContainer.style.pointerEvents = '';
          }, RATING_DEBOUNCE_MS);
        }

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

    // کلیدهای میانبر کیبورد (پشتیبانی از اعداد فارسی، انگلیسی، نام‌پد و محافظت تکرار کلید)
    const validRateKeys = {
      '1': 1, '2': 2, '3': 3, '4': 4,
      '۱': 1, '۲': 2, '۳': 3, '۴': 4,
      '١': 1, '٢': 2, '٣': 3, '٤': 4,
      'Numpad1': 1, 'Numpad2': 2, 'Numpad3': 3, 'Numpad4': 4,
      'Digit1': 1, 'Digit2': 2, 'Digit3': 3, 'Digit4': 4
    };

    let lastKeyRatingTime = 0;
    window.addEventListener('keydown', (e) => {
      // چشم‌پوشی در صورت فوکوس روی فیلدهای ورودی متنی
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        return;
      }
      if (e.repeat) return;

      if (appState.activeScreen === 'study') {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.toggleCardFlip();
        } else {
          const rating = validRateKeys[e.key] || validRateKeys[e.code];
          if (rating) {
            e.preventDefault();
            const now = Date.now();
            if (now - lastKeyRatingTime < RATING_DEBOUNCE_MS) return;
            lastKeyRatingTime = now;
            this.rateCard(rating);
          }
        }
      }
    });
  }
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      app.init();
    });
  } else {
    app.init();
  }
}

