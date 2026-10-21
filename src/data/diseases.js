// Seed content for disease information (English + Urdu). In production this lives in the backend
// ("diseases" collection) and admins can edit it from the Admin > Disease information page.
export const DISEASE_IDS = ['LSD', 'FMD', 'Pinkeye', 'Ringworm', 'Mange'];

export const DISEASES_SEED = [
  {
    id: 'LSD',
    kind: 'disease',
    name: { en: 'Lumpy Skin Disease (LSD)', ur: 'لمپی اسکن ڈیزیز (ایل ایس ڈی)' },
    description: {
      en: 'A viral disease spread mainly by biting insects. It causes firm, raised lumps on the skin, fever and a drop in milk.',
      ur: 'یہ ایک وائرل بیماری ہے جو زیادہ تر کاٹنے والے کیڑوں سے پھیلتی ہے۔ اس میں جلد پر سخت ابھری ہوئی گلٹیاں، بخار اور دودھ میں کمی ہو جاتی ہے۔',
    },
    symptoms: {
      en: ['Fever', 'Firm lumps 2 to 5 cm wide on the skin', 'Swollen lymph nodes', 'Poor appetite and less milk'],
      ur: ['بخار', 'جلد پر 2 سے 5 سینٹی میٹر کی سخت گلٹیاں', 'لمف گلینڈز میں سوجن', 'بھوک اور دودھ میں کمی'],
    },
    prevention: {
      en: ['Vaccinate as advised by your vet', 'Control flies, mosquitoes and ticks', 'Keep affected animals apart', 'Limit animal movement'],
      ur: ['ویٹرنری ڈاکٹر کے مشورے سے ویکسین لگوائیں', 'مکھیوں، مچھروں اور چیچڑوں پر قابو رکھیں', 'بیمار جانور کو الگ رکھیں', 'جانوروں کی نقل و حرکت محدود کریں'],
    },
    treatment: {
      en: 'There is no specific antiviral treatment. Give supportive care, and use antibiotics for secondary infection only when a vet directs.',
      ur: 'اس کا کوئی مخصوص اینٹی وائرل علاج نہیں۔ معاون نگہداشت کریں، اور ثانوی انفیکشن کے لیے اینٹی بایوٹک صرف ڈاکٹر کی ہدایت پر دیں۔',
    },
    medicineKeywords: ['Oxytetracycline', 'Fly', 'Electrolyte'],
  },
  {
    id: 'FMD',
    kind: 'disease',
    name: { en: 'Foot-and-Mouth Disease (FMD)', ur: 'منہ اور کھر کی بیماری (ایف ایم ڈی)' },
    description: {
      en: 'A highly contagious viral disease of cloven-hoofed animals. Blisters appear in the mouth and on the feet.',
      ur: 'یہ دو کھروں والے جانوروں میں تیزی سے پھیلنے والی وائرل بیماری ہے۔ منہ اور کھروں پر چھالے نکل آتے ہیں۔',
    },
    symptoms: {
      en: ['High fever', 'Blisters on the tongue, gums and hooves', 'Drooling and smacking lips', 'Lameness and less milk'],
      ur: ['تیز بخار', 'زبان، مسوڑھوں اور کھروں پر چھالے', 'منہ سے رال ٹپکنا', 'لنگڑاہٹ اور دودھ میں کمی'],
    },
    prevention: {
      en: ['Vaccinate regularly', 'Quarantine new animals first', 'Disinfect tools and vehicles', 'Report outbreaks to the livestock department'],
      ur: ['باقاعدگی سے ویکسین لگوائیں', 'نئے جانوروں کو پہلے الگ رکھیں', 'اوزار اور گاڑیوں کو جراثیم سے پاک کریں', 'وبا کی اطلاع لائیو سٹاک ڈیپارٹمنٹ کو دیں'],
    },
    treatment: {
      en: 'Offer soft feed, keep wounds clean and use an antiseptic. See a vet for full treatment.',
      ur: 'نرم چارہ دیں، زخم صاف رکھیں اور اینٹی سیپٹک استعمال کریں۔ مکمل علاج کے لیے ڈاکٹر سے رجوع کریں۔',
    },
    medicineKeywords: ['Antiseptic', 'Electrolyte'],
  },
  {
    id: 'Pinkeye',
    kind: 'disease',
    name: { en: 'Pinkeye (Infectious Bovine Keratoconjunctivitis)', ur: 'آنکھ کی گلابی سوزش (پنک آئی)' },
    description: {
      en: 'A bacterial eye infection spread by flies and close contact. The eye waters and the surface turns cloudy.',
      ur: 'یہ آنکھ کا جراثیمی انفیکشن ہے جو مکھیوں اور میل جول سے پھیلتا ہے۔ آنکھ سے پانی بہتا ہے اور پتلی دھندلی ہو جاتی ہے۔',
    },
    symptoms: {
      en: ['Heavy tearing', 'Squinting or keeping the eye shut', 'Red or cloudy eye', 'Sensitivity to light'],
      ur: ['آنکھ سے بہت پانی بہنا', 'آنکھ بند رکھنا', 'آنکھ کا سرخ اور دھندلا ہونا', 'روشنی سے تکلیف'],
    },
    prevention: {
      en: ['Control flies', 'Provide shade', 'Separate affected animals', 'Cut tall grass in the paddock'],
      ur: ['مکھیوں پر قابو رکھیں', 'جانوروں کو سایے میں رکھیں', 'بیمار جانور کو الگ کریں', 'چراگاہ کی لمبی گھاس کاٹ دیں'],
    },
    treatment: {
      en: 'Use the eye treatment your vet prescribes and keep the animal in shade.',
      ur: 'ڈاکٹر کی تجویز کردہ آنکھ کی دوا استعمال کریں اور جانور کو سایے میں رکھیں۔',
    },
    medicineKeywords: ['Eye', 'Fly'],
  },
  {
    id: 'Ringworm',
    kind: 'disease',
    name: { en: 'Ringworm', ur: 'داد (رِنگ وارم)' },
    description: {
      en: 'A fungal skin infection that forms round, scaly, hairless patches. It can spread to people.',
      ur: 'یہ جلد کا فنگل انفیکشن ہے۔ گول، کھردرے اور بالوں سے خالی دھبے بنتے ہیں۔ یہ انسانوں میں بھی منتقل ہو سکتا ہے۔',
    },
    symptoms: {
      en: ['Round grey-white crusty patches', 'Hair loss', 'Mild itching', 'Often on the head and neck'],
      ur: ['گول، سرمئی سفید پپڑی دار دھبے', 'بال جھڑنا', 'ہلکی خارش', 'عموماً سر اور گردن پر'],
    },
    prevention: {
      en: ['Keep sheds clean and dry', 'Allow sunlight in', 'Separate affected animals', 'Wear gloves when handling'],
      ur: ['باڑہ صاف اور خشک رکھیں', 'دھوپ لگنے دیں', 'متاثرہ جانور کو الگ رکھیں', 'سنبھالتے وقت دستانے پہنیں'],
    },
    treatment: {
      en: 'Use an antifungal as directed by your vet to stop it spreading.',
      ur: 'ڈاکٹر کی ہدایت پر اینٹی فنگل دوا استعمال کریں تاکہ بیماری پھیلنے سے رکے۔',
    },
    medicineKeywords: ['Antifungal'],
  },
  {
    id: 'Mange',
    kind: 'disease',
    name: { en: 'Mange', ur: 'خارش (مینج)' },
    description: {
      en: 'A skin disease caused by mites. It brings intense itching, hair loss and thickened skin.',
      ur: 'یہ جلد کی بیماری چھوٹے کیڑوں (مائٹس) سے ہوتی ہے۔ شدید خارش، بال جھڑنا اور جلد کا موٹا ہو جانا اس کی علامات ہیں۔',
    },
    symptoms: {
      en: ['Intense itching and rubbing', 'Hair loss', 'Thick, wrinkled crusts', 'Sores from scratching'],
      ur: ['شدید خارش اور رگڑنا', 'بال جھڑنا', 'جلد پر موٹی جھریوں والی پپڑیاں', 'کھجانے سے زخم'],
    },
    prevention: {
      en: ['Isolate affected animals', 'Keep housing clean', 'Inspect new animals', 'Check animals regularly'],
      ur: ['متاثرہ جانور کو الگ کریں', 'باڑہ صاف رکھیں', 'نئے جانوروں کا معائنہ کریں', 'باقاعدگی سے جانوروں کو دیکھتے رہیں'],
    },
    treatment: {
      en: 'Use the anti-mite treatment your vet prescribes.',
      ur: 'ڈاکٹر کی تجویز کردہ مائٹس کش دوا استعمال کریں۔',
    },
    medicineKeywords: ['Ivermectin'],
  },
  {
    id: 'Healthy',
    kind: 'healthy',
    name: { en: 'Healthy', ur: 'صحت مند' },
    description: {
      en: 'No signs of the five selected diseases were found in this image. Keep monitoring your animal.',
      ur: 'تصویر میں پانچ منتخب بیماریوں کی کوئی علامت نہیں ملی۔ جانور کی نگرانی جاری رکھیں۔',
    },
    symptoms: { en: [], ur: [] },
    prevention: {
      en: ['Provide clean water and balanced feed', 'Keep to the vaccination schedule', 'Check animals regularly'],
      ur: ['صاف پانی اور متوازن چارہ دیں', 'ویکسین کا شیڈول جاری رکھیں', 'جانوروں کا باقاعدگی سے معائنہ کریں'],
    },
    treatment: { en: 'No treatment is needed.', ur: 'کسی علاج کی ضرورت نہیں۔' },
    medicineKeywords: [],
  },
];
