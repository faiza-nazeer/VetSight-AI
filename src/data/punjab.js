// 36 districts of Punjab with approximate centre coordinates (used by the risk map and region pickers).
export const DISTRICTS = [
  { id: 'Lahore', en: 'Lahore', ur: 'لاہور', lat: 31.5497, lng: 74.3436 },
  { id: 'Faisalabad', en: 'Faisalabad', ur: 'فیصل آباد', lat: 31.4504, lng: 73.135 },
  { id: 'Chiniot', en: 'Chiniot', ur: 'چنیوٹ', lat: 31.7292, lng: 72.9789 },
  { id: 'Rawalpindi', en: 'Rawalpindi', ur: 'راولپنڈی', lat: 33.5651, lng: 73.0169 },
  { id: 'Multan', en: 'Multan', ur: 'ملتان', lat: 30.1575, lng: 71.5249 },
  { id: 'Gujranwala', en: 'Gujranwala', ur: 'گوجرانوالہ', lat: 32.1877, lng: 74.1945 },
  { id: 'Sargodha', en: 'Sargodha', ur: 'سرگودھا', lat: 32.0836, lng: 72.6711 },
  { id: 'Bahawalpur', en: 'Bahawalpur', ur: 'بہاولپور', lat: 29.3956, lng: 71.6836 },
  { id: 'Sialkot', en: 'Sialkot', ur: 'سیالکوٹ', lat: 32.4945, lng: 74.5229 },
  { id: 'Sheikhupura', en: 'Sheikhupura', ur: 'شیخوپورہ', lat: 31.7167, lng: 73.985 },
  { id: 'Jhang', en: 'Jhang', ur: 'جھنگ', lat: 31.2681, lng: 72.3181 },
  { id: 'Gujrat', en: 'Gujrat', ur: 'گجرات', lat: 32.5731, lng: 74.075 },
  { id: 'Kasur', en: 'Kasur', ur: 'قصور', lat: 31.1187, lng: 74.4502 },
  { id: 'RahimYarKhan', en: 'Rahim Yar Khan', ur: 'رحیم یار خان', lat: 28.4202, lng: 70.2952 },
  { id: 'Sahiwal', en: 'Sahiwal', ur: 'ساہیوال', lat: 30.6682, lng: 73.1114 },
  { id: 'Okara', en: 'Okara', ur: 'اوکاڑہ', lat: 30.8138, lng: 73.4534 },
  { id: 'DGKhan', en: 'Dera Ghazi Khan', ur: 'ڈیرہ غازی خان', lat: 30.0489, lng: 70.6455 },
  { id: 'Mianwali', en: 'Mianwali', ur: 'میانوالی', lat: 32.5839, lng: 71.537 },
  { id: 'Bhakkar', en: 'Bhakkar', ur: 'بھکر', lat: 31.6082, lng: 71.0854 },
  { id: 'Layyah', en: 'Layyah', ur: 'لیہ', lat: 30.9693, lng: 70.9428 },
  { id: 'Muzaffargarh', en: 'Muzaffargarh', ur: 'مظفرگڑھ', lat: 30.0703, lng: 71.1933 },
  { id: 'Khanewal', en: 'Khanewal', ur: 'خانیوال', lat: 30.3017, lng: 71.9321 },
  { id: 'Vehari', en: 'Vehari', ur: 'وہاڑی', lat: 30.0445, lng: 72.3556 },
  { id: 'Lodhran', en: 'Lodhran', ur: 'لودھراں', lat: 29.5339, lng: 71.6324 },
  { id: 'Pakpattan', en: 'Pakpattan', ur: 'پاکپتن', lat: 30.3436, lng: 73.3894 },
  { id: 'TobaTekSingh', en: 'Toba Tek Singh', ur: 'ٹوبہ ٹیک سنگھ', lat: 30.9709, lng: 72.4826 },
  { id: 'Narowal', en: 'Narowal', ur: 'نارووال', lat: 32.1019, lng: 74.8731 },
  { id: 'Hafizabad', en: 'Hafizabad', ur: 'حافظ آباد', lat: 32.0709, lng: 73.688 },
  { id: 'MandiBahauddin', en: 'Mandi Bahauddin', ur: 'منڈی بہاؤالدین', lat: 32.5861, lng: 73.4917 },
  { id: 'Khushab', en: 'Khushab', ur: 'خوشاب', lat: 32.2967, lng: 72.3525 },
  { id: 'Attock', en: 'Attock', ur: 'اٹک', lat: 33.766, lng: 72.3609 },
  { id: 'Jhelum', en: 'Jhelum', ur: 'جہلم', lat: 32.9425, lng: 73.7257 },
  { id: 'Chakwal', en: 'Chakwal', ur: 'چکوال', lat: 32.9328, lng: 72.863 },
  { id: 'NankanaSahib', en: 'Nankana Sahib', ur: 'ننکانہ صاحب', lat: 31.4492, lng: 73.706 },
  { id: 'Rajanpur', en: 'Rajanpur', ur: 'راجن پور', lat: 29.1044, lng: 70.3301 },
  { id: 'Bahawalnagar', en: 'Bahawalnagar', ur: 'بہاولنگر', lat: 29.9987, lng: 73.2536 },
];

export const PUNJAB_CENTER = [31.1, 72.7];

export function districtById(id) {
  return DISTRICTS.find((d) => d.id === id || d.en === id) || null;
}

export function districtLabel(id, lang) {
  const d = districtById(id);
  if (!d) return id || '';
  return lang === 'ur' ? d.ur : d.en;
}
