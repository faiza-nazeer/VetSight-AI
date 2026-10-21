// Built-in demo backend. It mirrors the FastAPI contract in API_CONTRACT.md so the whole UI works
// without a server. Data is kept in localStorage. Demo password for every account: demo1234
import { DISTRICTS, districtById } from '../data/punjab';
import { DISEASES_SEED, DISEASE_IDS } from '../data/diseases';
import { BREEDS, GENDERS, breedSpecies } from '../data/breeds';
import { getToken } from './client';
import { fileToThumb } from '../utils/format';

class MockError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

const KEY = 'vs_mockdb_v3';
const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString();
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const wait = (v, ms = 220) => new Promise((r) => setTimeout(() => r(clone(v)), ms));
const uid = () => Math.random().toString(16).slice(2, 10) + Date.now().toString(16).slice(-6);

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function futureSlots(existing = [], want = 8) {
  const now = Date.now();
  const keep = existing.filter((s) => new Date(s).getTime() > now + 3600e3);
  const set = new Set(keep.map((s) => new Date(s).toISOString()));
  for (let day = 1; set.size < want && day < 30; day += 1) {
    [10, 14].forEach((h) => {
      const d = new Date(now + day * DAY);
      d.setHours(h, 0, 0, 0);
      if (set.size < want) set.add(d.toISOString());
    });
  }
  return [...set].sort();
}

function seed() {
  const now = Date.now();
  const loc = (id) => { const d = districtById(id); return { type: 'Point', coordinates: [d.lng, d.lat], region: id }; };
  const mk = (o) => ({ password: 'demo1234', status: 'active', createdAt: iso(now - 40 * DAY), ...o });
  const users = [
    mk({ _id: 'u_admin', role: 'admin', name: 'VetSight Admin', email: 'admin@vetsight.com', phone: '03009998888' }),
    mk({ _id: 'u_farmer1', role: 'farmer', name: 'Ali Raza', email: 'ali@example.com', phone: '03001234567', location: loc('Chiniot') }),
    mk({ _id: 'u_farmer2', role: 'farmer', name: 'Bashir Ahmad', email: 'bashir@example.com', phone: '03211112233', location: loc('Faisalabad') }),
    mk({ _id: 'u_vet1', role: 'vet', name: 'Dr. Sana Malik', email: 'sana@example.com', phone: '03211234567', specialty: 'Livestock Medicine', clinicAddress: 'Chiniot Veterinary Clinic, Main Road', location: loc('Chiniot'), availableSlots: futureSlots() }),
    mk({ _id: 'u_vet2', role: 'vet', name: 'Dr. Imran Qureshi', email: 'imran@example.com', phone: '03331239876', specialty: 'Cattle and Buffalo Health', clinicAddress: 'Canal Road Animal Clinic, Faisalabad', location: loc('Faisalabad'), availableSlots: futureSlots() }),
    mk({ _id: 'u_vet3', role: 'vet', name: 'Dr. Ayesha Tariq', email: 'ayesha@example.com', phone: '03451239000', specialty: 'Dairy Herd Management', clinicAddress: 'Model Town Vet Hospital, Lahore', location: loc('Lahore'), availableSlots: futureSlots() }),
    mk({ _id: 'u_vet4', role: 'vet', name: 'Dr. Bilal Hussain', email: 'bilal@example.com', phone: '03011119999', specialty: 'Large Animal Surgery', clinicAddress: 'Sargodha Road Clinic', location: loc('Sargodha'), status: 'pending', availableSlots: [], createdAt: iso(now - 1 * DAY) }),
    mk({ _id: 'u_store1', role: 'store', name: 'VetMeds Pharmacy', email: 'vetmeds@example.com', phone: '03001112222', address: 'Main Bazaar, Chiniot', location: loc('Chiniot') }),
    mk({ _id: 'u_store2', role: 'store', name: 'Kisan Agri Vet Store', email: 'kisan@example.com', phone: '03124445566', address: 'Jhang Road, Faisalabad', location: loc('Faisalabad') }),
  ];
  const farms = [
    { _id: 'f1', ownerId: 'u_farmer1', species: 'cattle', cattleCount: 12, region: 'Chiniot', address: 'Chak 12 JB, Village Road, Chiniot', createdAt: iso(now - 38 * DAY) },
    { _id: 'f2', ownerId: 'u_farmer2', species: 'buffalo', cattleCount: 20, region: 'Faisalabad', address: 'Chak 55 GB, Jhang Road, Faisalabad', createdAt: iso(now - 30 * DAY) },
  ];
  const animals = [
    { _id: 'an1', farmId: 'f1', ownerId: 'u_farmer1', animalTag: 'A-101', breed: 'Sahiwal', ageYears: 4, gender: 'female', weightKg: 380, photoUrl: '', createdAt: iso(now - 37 * DAY) },
    { _id: 'an2', farmId: 'f1', ownerId: 'u_farmer1', animalTag: 'A-102', breed: 'Tharparkar', ageYears: 3, gender: 'male', weightKg: 420, photoUrl: '', createdAt: iso(now - 37 * DAY) },
    { _id: 'an3', farmId: 'f1', ownerId: 'u_farmer1', animalTag: 'A-103', breed: 'Sahiwal', ageYears: 6, gender: 'female', weightKg: 360, photoUrl: '', createdAt: iso(now - 36 * DAY) },
    { _id: 'an4', farmId: 'f2', ownerId: 'u_farmer2', animalTag: 'B-201', breed: 'Nili-Ravi', ageYears: 5, gender: 'female', weightKg: 520, photoUrl: '', createdAt: iso(now - 29 * DAY) },
    { _id: 'an5', farmId: 'f2', ownerId: 'u_farmer2', animalTag: 'B-202', breed: 'Kundi', ageYears: 3, gender: 'female', weightKg: 480, photoUrl: '', createdAt: iso(now - 29 * DAY) },
  ];
  const records = [
    { _id: 'r1', farmId: 'f1', animalId: 'an1', diagnosis: { disease: 'LSD', confidenceScore: 0.91, imageUrl: '', modelVersion: 'v0.1' }, treatmentInfo: 'Isolate animal, consult vet within 48 hours', status: 'recovered', referredToDoctor: true, createdAt: iso(now - 18 * DAY) },
    { _id: 'r2', farmId: 'f1', animalId: 'an2', diagnosis: { disease: 'Healthy', confidenceScore: 0.95, imageUrl: '', modelVersion: 'v0.1' }, treatmentInfo: '', status: 'healthy', referredToDoctor: false, createdAt: iso(now - 3 * DAY) },
    { _id: 'r3', farmId: 'f2', animalId: 'an4', diagnosis: { disease: 'Mange', confidenceScore: 0.84, imageUrl: '', modelVersion: 'v0.1' }, treatmentInfo: '', status: 'active', referredToDoctor: false, createdAt: iso(now - 6 * DAY) },
  ];
  const slotA = futureSlots()[1];
  const appointments = [
    { _id: 'a1', userId: 'u_farmer1', farmId: 'f1', animalId: 'an1', doctorId: 'u_vet1', healthRecordId: 'r1', appointmentType: 'farm-visit', scheduledAt: iso(now - 12 * DAY), status: 'completed', consultationNotes: 'Isolated infected animal, started supportive care.', cancelReason: '', createdAt: iso(now - 16 * DAY) },
    { _id: 'a2', userId: 'u_farmer1', farmId: 'f1', animalId: null, doctorId: 'u_vet1', healthRecordId: null, appointmentType: 'in-person', scheduledAt: slotA, status: 'requested', consultationNotes: '', cancelReason: '', createdAt: iso(now - 1 * DAY) },
  ];
  const prescriptions = [
    { _id: 'p1', appointmentId: 'a1', farmId: 'f1', userId: 'u_farmer1', doctorId: 'u_vet1', medicine: [{ name: 'Oxytetracycline', dosage: '10 ml', duration: '5 days' }], notes: 'Give once daily. Keep the animal in shade.', createdAt: iso(now - 12 * DAY) },
  ];
  const categories = [
    { _id: 'c1', name: 'Antibiotics', nameUr: 'اینٹی بایوٹکس' },
    { _id: 'c2', name: 'Antiparasitic', nameUr: 'طفیلی کش' },
    { _id: 'c3', name: 'Wound care', nameUr: 'زخم کی دیکھ بھال' },
    { _id: 'c4', name: 'Supplements', nameUr: 'سپلیمنٹس' },
    { _id: 'c5', name: 'Eye care', nameUr: 'آنکھ کی دیکھ بھال' },
    { _id: 'c6', name: 'Pest control', nameUr: 'کیڑے مار' },
    { _id: 'c7', name: 'Skin care', nameUr: 'جلد کی دیکھ بھال' },
  ];
  const P = (productId, storeId, medicineName, categoryId, description, price, stock, requiresPrescription) => ({ productId, storeId, medicineName, categoryId, description, price, stock, requiresPrescription, isActive: true });
  const products = [
    P('pr1', 'u_store1', 'Oxytetracycline Injection', 'c1', 'Injectable antibiotic for bacterial infections. Use only as directed by a vet.', 450, 20, true),
    P('pr2', 'u_store1', 'Ivermectin Injection', 'c2', 'Treats mites, lice and internal parasites. Dose depends on body weight.', 300, 15, true),
    P('pr3', 'u_store1', 'Antiseptic Wound Spray', 'c3', 'Cleans and protects skin wounds and blisters.', 380, 40, false),
    P('pr4', 'u_store1', 'Electrolyte and Vitamin Powder', 'c4', 'Helps recovery from fever, heat stress and weakness.', 250, 60, false),
    P('pr5', 'u_store2', 'Oxytetracycline Eye Ointment', 'c5', 'Ointment for eye infections such as pinkeye.', 220, 25, true),
    P('pr6', 'u_store2', 'Fly Repellent Spray', 'c6', 'Keeps flies and biting insects away from animals and sheds.', 520, 30, false),
    P('pr7', 'u_store2', 'Antifungal Skin Lotion', 'c7', 'Topical lotion for ringworm patches.', 410, 18, false),
    P('pr8', 'u_store2', 'Mineral Mixture 1 kg', 'c4', 'Daily mineral supplement for dairy animals.', 600, 45, false),
  ];
  const orders = [
    { _id: 'o1', userId: 'u_farmer1', storeId: 'u_store1', prescriptionId: 'p1', items: [{ productId: 'pr1', medicineName: 'Oxytetracycline Injection', quantity: 1, price: 450 }], totalAmount: 450, paymentMethod: 'cod', deliveryAddress: 'Chak 12 JB, Village Road, Chiniot', deliveryStatus: 'delivered', orderedAt: iso(now - 11 * DAY) },
    { _id: 'o2', userId: 'u_farmer1', storeId: 'u_store2', prescriptionId: null, items: [{ productId: 'pr6', medicineName: 'Fly Repellent Spray', quantity: 2, price: 520 }], totalAmount: 1040, paymentMethod: 'cod', deliveryAddress: 'Chak 12 JB, Village Road, Chiniot', deliveryStatus: 'processing', orderedAt: iso(now - 1 * DAY) },
  ];
  const n = (userId, type, message, ago, isRead = false) => ({ _id: uid(), userId, type, message, isRead, createdAt: iso(now - ago) });
  const notifications = [
    n('u_farmer1', 'riskAlert', 'High risk of FMD reported in your region (Chiniot).', 2 * 3600e3),
    n('u_farmer1', 'riskAlert', 'Medium risk of LSD reported in your region (Chiniot).', 2 * 3600e3),
    n('u_farmer1', 'appointmentUpdate', 'Your request to Dr. Sana Malik was sent and is waiting for confirmation.', 20 * 3600e3),
    n('u_farmer1', 'orderUpdate', 'Your order from Kisan Agri Vet Store is now being processed.', 10 * 3600e3),
    n('u_farmer1', 'prescription', 'Dr. Sana Malik added a digital prescription for your farm.', 12 * DAY, true),
    n('u_vet1', 'newRequest', 'New in-person request from Ali Raza.', 20 * 3600e3),
    n('u_store1', 'newOrder', 'New order received from Ali Raza.', 11 * DAY, true),
    n('u_store2', 'newOrder', 'New order received from Ali Raza.', 1 * DAY),
    n('u_admin', 'newRequest', 'Dr. Bilal Hussain is waiting for account approval.', 1 * DAY),
  ];
  const feedback = [
    { _id: 'fb1', userId: 'u_farmer1', userName: 'Ali Raza', rating: 5, message: 'The photo check was quick and the Urdu advice was easy to follow.', status: 'new', createdAt: iso(now - 5 * DAY) },
    { _id: 'fb2', userId: 'u_farmer2', userName: 'Bashir Ahmad', rating: 3, message: 'Please add more vets in my district.', status: 'new', createdAt: iso(now - 2 * DAY) },
  ];
  return { users, farms, animals, records, appointments, prescriptions, categories, products, orders, notifications, feedback, diseases: clone(DISEASES_SEED), pendingReg: {} };
}

let db;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } }
db = load();
db.users.forEach((u) => { if (u.role === 'vet' && u.status === 'active') u.availableSlots = futureSlots(u.availableSlots); });
save();

// ---------- helpers ----------
const strip = ({ password, ...u }) => u;
function me() {
  const u = db.users.find((x) => x._id === getToken());
  if (!u) throw new MockError('unauthorized');
  return u;
}
const userName = (id) => db.users.find((u) => u._id === id)?.name || '';
function notify(userId, type, message) {
  db.notifications.unshift({ _id: uid(), userId, type, message, isRead: false, createdAt: iso(Date.now()) });
}
function kmBetween(a, b) {
  const R = 6371; const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const ownsFarm = (u, farmId) => db.farms.some((f) => f._id === farmId && f.ownerId === u._id);
function popAppt(a) {
  const farm = db.farms.find((f) => f._id === a.farmId);
  const doc = db.users.find((u) => u._id === a.doctorId);
  const rec = db.records.find((r) => r._id === a.healthRecordId);
  const an = db.animals.find((x) => x._id === (a.animalId || rec?.animalId));
  return {
    ...a,
    animalId: a.animalId || rec?.animalId || null,
    farmerName: userName(a.userId),
    doctorName: doc?.name || '',
    doctorSpecialty: doc?.specialty || '',
    clinicAddress: doc?.clinicAddress || '',
    farmRegion: farm?.region || '',
    farmAddress: farm?.address || '',
    farmSpecies: farm?.species || '',
    cattleCount: farm?.cattleCount || 0,
    animal: an ? { animalTag: an.animalTag, breed: an.breed, ageYears: an.ageYears, gender: an.gender, weightKg: an.weightKg, photoUrl: an.photoUrl } : null,
    diagnosis: rec?.diagnosis || null,
    hasPrescription: db.prescriptions.some((p) => p.appointmentId === a._id),
  };
}
function popOrder(o) { return { ...o, storeName: userName(o.storeId), farmerName: userName(o.userId) }; }
function popProduct(p) {
  const s = db.users.find((u) => u._id === p.storeId);
  const c = db.categories.find((x) => x._id === p.categoryId);
  return { ...p, category: c?.name || '', categoryUr: c?.nameUr || '', storeName: s?.name || '', storeRegion: s?.location?.region || '' };
}
const activeStoreIds = () => db.users.filter((u) => u.role === 'store' && u.status === 'active').map((u) => u._id);
const vetCanSeeAnimal = (vetId, animalId) => db.appointments.some((a) => a.doctorId === vetId && (a.animalId === animalId || db.records.find((r) => r._id === a.healthRecordId)?.animalId === animalId));

// ---------- risk (deterministic demo predictions; real backend runs a scheduled job) ----------
const CLIMATES = ['Hot and humid', 'Hot and dry', 'Monsoon rains', 'Mild and dry', 'Cool and humid'];
let riskCache = null;
function buildRisk() {
  if (riskCache) return riskCache;
  const out = [];
  DISTRICTS.forEach((d) => {
    const climate = CLIMATES[hash(`c${d.id}`) % CLIMATES.length];
    DISEASE_IDS.forEach((dis) => {
      const n = hash(d.id + dis) % 100;
      let level = n < 45 ? 'Low' : n < 75 ? 'Medium' : 'High';
      let prob = level === 'Low' ? 0.05 + (n / 45) * 0.3 : level === 'Medium' ? 0.4 + ((n - 45) / 30) * 0.25 : 0.7 + ((n - 75) / 25) * 0.25;
      if (d.id === 'Chiniot' && dis === 'FMD') { level = 'High'; prob = 0.88; }
      if (d.id === 'Chiniot' && dis === 'LSD') { level = 'Medium'; prob = 0.52; }
      const stale = d.id === 'Rajanpur';
      out.push({
        _id: `${d.id}-${dis}`, region: d.id,
        location: { type: 'Point', coordinates: [d.lng, d.lat] },
        disease: dis, riskLevel: level, probability: Math.round(prob * 100) / 100, climate,
        modelVersion: 'risk-v0.1', isStale: stale, source: stale ? 'cached' : 'live',
        predictedAt: iso(Date.now() - (stale ? 30 : 1 + (hash(d.id) % 10)) * 3600e3),
      });
    });
  });
  riskCache = out;
  return out;
}

// ---------- chatbot ----------
const KW = {
  LSD: ['lump', 'nodule', 'bump', 'swelling on skin', 'گلٹی', 'گلٹیاں', 'گانٹھ', 'ابھار', 'لمپی'],
  FMD: ['mouth', 'blister', 'drool', 'saliva', 'limp', 'hoof', 'foot', 'tongue', 'منہ', 'چھالے', 'رال', 'لنگڑ', 'کھر', 'زبان'],
  Pinkeye: ['eye', 'tear', 'cloudy', 'watery', 'آنکھ', 'آنکھوں', 'پانی بہ', 'دھندل'],
  Ringworm: ['ring', 'circular', 'round patch', 'scaly', 'crust', 'گول', 'دھبے', 'داد', 'پپڑی'],
  Mange: ['itch', 'scratch', 'mite', 'rubbing', 'hair loss', 'خارش', 'کھجا', 'بال جھڑ'],
};

// ---------- API ----------
export const api = {
  async login(email, password) {
    const u = db.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!u || u.password !== password) throw new MockError('invalid_credentials');
    if (u.status === 'pending') throw new MockError('account_pending');
    if (u.status === 'blocked') throw new MockError('account_blocked');
    if (u.status === 'rejected') throw new MockError('account_rejected');
    return wait({ token: u._id, user: strip(u) });
  },
  async register(p) {
    const email = String(p.email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) throw new MockError('email_exists');
    db.pendingReg[email] = { payload: { ...p, email }, otp: '123456', expiresAt: Date.now() + 5 * 60e3 };
    save();
    return wait({ email, expiresInSeconds: 300, demoOtp: '123456' });
  },
  async resendOtp(email) {
    const r = db.pendingReg[String(email).toLowerCase()];
    if (!r) throw new MockError('not_found');
    r.expiresAt = Date.now() + 5 * 60e3; save();
    return wait({ email, expiresInSeconds: 300, demoOtp: r.otp });
  },
  async verifyOtp(email, otp) {
    const r = db.pendingReg[String(email).toLowerCase()];
    if (!r) throw new MockError('not_found');
    if (Date.now() > r.expiresAt) throw new MockError('otp_expired');
    if (String(otp).trim() !== r.otp) throw new MockError('otp_invalid');
    const p = r.payload;
    const district = districtById(p.region) || districtById('Lahore');
    const user = {
      _id: `u_${uid()}`, role: p.role, name: `${p.firstName} ${p.lastName}`.trim(), email: p.email, phone: p.phone || '',
      password: p.password, status: p.role === 'farmer' ? 'active' : 'pending', createdAt: iso(Date.now()),
      location: { type: 'Point', coordinates: [district.lng, district.lat], region: district.id },
      ...(p.role === 'vet' ? { specialty: '', clinicAddress: '', availableSlots: [] } : {}),
      ...(p.role === 'store' ? { address: '' } : {}),
    };
    db.users.push(user);
    delete db.pendingReg[user.email];
    db.users.filter((u) => u.role === 'admin').forEach((a) => notify(a._id, 'newRequest', `${user.name} registered as ${user.role}${user.status === 'pending' ? ' and is waiting for approval.' : '.'}`));
    save();
    if (user.status === 'pending') return wait({ pendingApproval: true });
    return wait({ token: user._id, user: strip(user) });
  },
  async me() { return wait(strip(me())); },
  async updateProfile(p) {
    const u = me();
    ['name', 'phone', 'address', 'clinicAddress', 'specialty'].forEach((k) => { if (p[k] !== undefined) u[k] = p[k]; });
    if (p.region) {
      const d = districtById(p.region);
      if (d) u.location = { type: 'Point', coordinates: [d.lng, d.lat], region: d.id };
    }
    save();
    return wait(strip(u));
  },

  // farms
  async listFarms() { const u = me(); return wait(db.farms.filter((f) => f.ownerId === u._id)); },
  async saveFarm(p) {
    const u = me();
    if (!['cattle', 'buffalo', 'mixed'].includes(p.species) || !p.region || !(Number(p.cattleCount) >= 1) || String(p.address || '').trim().length < 5) throw new MockError('invalid_input');
    const fields = { species: p.species, region: p.region, cattleCount: Number(p.cattleCount), address: String(p.address).trim() };
    if (p._id) {
      const f = db.farms.find((x) => x._id === p._id && x.ownerId === u._id);
      if (!f) throw new MockError('not_found');
      Object.assign(f, fields); save(); return wait(f);
    }
    const f = { _id: `f_${uid()}`, ownerId: u._id, ...fields, createdAt: iso(Date.now()) };
    db.farms.push(f); save(); return wait(f);
  },
  async deleteFarm(id) {
    const u = me();
    db.farms = db.farms.filter((f) => !(f._id === id && f.ownerId === u._id));
    save(); return wait({ ok: true });
  },

  // animals (registered inside a farm)
  async listAnimals(farmId) {
    const u = me();
    const mine = db.animals.filter((a) => a.ownerId === u._id && (!farmId || a.farmId === farmId));
    return wait(mine.sort((a, b) => a.animalTag.localeCompare(b.animalTag)));
  },
  async saveAnimal(p) {
    const u = me();
    const tag = String(p.animalTag || '').trim();
    const age = Number(p.ageYears);
    const w = p.weightKg === '' || p.weightKg == null ? null : Number(p.weightKg);
    if (!ownsFarm(u, p.farmId) || !tag || !BREEDS.some((b) => b.id === p.breed) || !GENDERS.includes(p.gender) || !(age >= 0 && age <= 30) || (w !== null && !(w > 0))) throw new MockError('invalid_input');
    if (db.animals.some((a) => a.farmId === p.farmId && a._id !== p._id && a.animalTag.toLowerCase() === tag.toLowerCase())) throw new MockError('animal_exists');
    let photoUrl;
    if (p.photoFile) photoUrl = await fileToThumb(p.photoFile, 320);
    const fields = { farmId: p.farmId, animalTag: tag, breed: p.breed, ageYears: age, gender: p.gender, weightKg: w };
    if (p._id) {
      const a = db.animals.find((x) => x._id === p._id && x.ownerId === u._id);
      if (!a) throw new MockError('not_found');
      Object.assign(a, fields);
      if (p.removePhoto) a.photoUrl = '';
      if (photoUrl !== undefined) a.photoUrl = photoUrl;
      save(); return wait(a);
    }
    const a = { _id: `an_${uid()}`, ownerId: u._id, ...fields, photoUrl: photoUrl || '', createdAt: iso(Date.now()) };
    db.animals.push(a); save(); return wait(a);
  },
  async deleteAnimal(id) {
    const u = me();
    db.animals = db.animals.filter((a) => !(a._id === id && a.ownerId === u._id));
    save(); return wait({ ok: true });
  },

  // detection
  async detectDisease(farmId, animalId, file) {
    const u = me();
    const animal = db.animals.find((a) => a._id === animalId && a.farmId === farmId && a.ownerId === u._id);
    if (!animal) throw new MockError('invalid_input');
    const h = hash(`${file.name}${file.size}`);
    const bucket = h % 8; // 0-4 diseases, 5 healthy, 6 low confidence, 7 out of scope
    if (bucket >= 6) {
      return wait({ outOfScope: true, reason: bucket === 6 ? 'low_confidence' : 'out_of_scope', demo: true }, 1600);
    }
    const disease = bucket === 5 ? 'Healthy' : DISEASE_IDS[bucket];
    const rec = {
      _id: `r_${uid()}`, farmId, animalId,
      diagnosis: { disease, confidenceScore: Math.round((0.78 + (h % 19) / 100) * 100) / 100, imageUrl: await fileToThumb(file), modelVersion: 'v0.1' },
      treatmentInfo: '', status: disease === 'Healthy' ? 'healthy' : 'active', referredToDoctor: false, createdAt: iso(Date.now()),
    };
    db.records.unshift(rec); save();
    return wait({ ...rec, demo: true }, 1600);
  },
  async listRecords(params = {}) {
    const u = me();
    let rows;
    if (u.role === 'vet') {
      rows = params.animalId && vetCanSeeAnimal(u._id, params.animalId) ? db.records.filter((r) => r.animalId === params.animalId) : [];
    } else if (u.role === 'admin') {
      rows = db.records.filter((r) => (!params.farmId || r.farmId === params.farmId) && (!params.animalId || r.animalId === params.animalId));
    } else {
      const mine = db.farms.filter((f) => f.ownerId === u._id).map((f) => f._id);
      rows = db.records.filter((r) => mine.includes(r.farmId) && (!params.farmId || r.farmId === params.farmId) && (!params.animalId || r.animalId === params.animalId));
    }
    return wait([...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async listDiseases() { return wait(db.diseases); },

  // chatbot
  async sendChatMessage({ text, language = 'en', action, diseaseId }) {
    const u = me();
    const ur = language === 'ur';
    const dz = (id) => db.diseases.find((d) => d.id === id);
    const pickL = (o) => (ur ? o.ur : o.en);
    if (action === 'medicines') {
      const dis = dz(diseaseId);
      const stores = activeStoreIds();
      const medicines = db.products
        .filter((p) => p.isActive && stores.includes(p.storeId) && (dis?.medicineKeywords || []).some((k) => p.medicineName.toLowerCase().includes(k.toLowerCase())))
        .map((p) => p.medicineName);
      return wait({
        kind: 'medicines', medicines,
        text: ur ? `مارکیٹ پلیس میں ${pickL(dis.name)} کے لیے درج ادویات:` : `Medicines listed in the marketplace for ${pickL(dis.name)}:`,
      }, 500);
    }
    if (action === 'vets') {
      const vets = (await api.listVets(u.location?.region)).slice(0, 3);
      return wait({ kind: 'vets', vets, text: ur ? 'آپ کے قریب یہ ویٹرنری ڈاکٹر موجود ہیں۔' : 'These veterinarians are closest to you.' }, 500);
    }
    const q = String(text || '').toLowerCase();
    const scores = DISEASE_IDS.map((id) => [id, KW[id].filter((k) => q.includes(k.toLowerCase())).length]).sort((a, b) => b[1] - a[1]);
    if (!scores[0][1]) {
      return wait({
        kind: 'clarify',
        text: ur
          ? 'میں ان علامات کو اپنی پانچ بیماریوں (ایل ایس ڈی، ایف ایم ڈی، پنک آئی، داد، خارش) میں سے کسی سے ملا نہیں سکا۔ براہِ کرم مزید تفصیل بتائیں، مثلاً جسم کے کس حصے پر علامت ہے، یا ڈاکٹر سے رجوع کریں۔'
          : 'I could not match that to the five diseases I cover (LSD, FMD, Pinkeye, Ringworm, Mange). Add more detail, such as where on the body you see it, or speak to a veterinarian.',
        actions: ['vets'],
      }, 600);
    }
    const dis = dz(scores[0][0]);
    return wait({
      kind: 'answer', diseaseId: dis.id,
      text: ur
        ? `آپ کی بتائی ہوئی علامات کے مطابق یہ ${pickL(dis.name)} ہو سکتی ہے۔ ${pickL(dis.description)} یہ صرف ممکنہ معلومات ہے، تصدیق شدہ تشخیص نہیں۔`
        : `From what you describe, this may be ${pickL(dis.name)}. ${pickL(dis.description)} This is possible information, not a confirmed diagnosis.`,
      prevention: pickL(dis.prevention),
      actions: ['medicines', 'vets'],
    }, 700);
  },

  // risk
  async listRisk({ disease, region } = {}) {
    return wait(buildRisk().filter((r) => (!disease || r.disease === disease) && (!region || r.region === region)), 300);
  },

  // vets, appointments
  async listVets(region) {
    const origin = districtById(region);
    const vets = db.users.filter((u) => u.role === 'vet' && u.status === 'active').map((v) => {
      const d = districtById(v.location?.region);
      const distanceKm = origin && d ? Math.round(kmBetween(origin, d)) : null;
      const { password, ...rest } = v;
      return { ...rest, availableSlots: futureSlots(v.availableSlots, 0), distanceKm };
    });
    vets.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    return wait(vets);
  },
  async listAppointments() {
    const u = me();
    const rows = db.appointments.filter((a) => (u.role === 'farmer' ? a.userId === u._id : u.role === 'vet' ? a.doctorId === u._id : true));
    return wait(rows.map(popAppt).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)));
  },
  async bookAppointment(p) {
    const u = me();
    const vet = db.users.find((x) => x._id === p.doctorId && x.role === 'vet');
    const farm = db.farms.find((f) => f._id === p.farmId && f.ownerId === u._id);
    if (!vet || !farm) throw new MockError('not_found');
    if (p.appointmentType === 'farm-visit' && !String(farm.address || '').trim()) throw new MockError('farm_address_required');
    const when = new Date(p.scheduledAt).toISOString();
    if (!vet.availableSlots.some((s) => new Date(s).toISOString() === when)) throw new MockError('slot_unavailable');
    vet.availableSlots = vet.availableSlots.filter((s) => new Date(s).toISOString() !== when);
    const rec = db.records.find((r) => r._id === p.healthRecordId);
    const a = { _id: `a_${uid()}`, userId: u._id, farmId: p.farmId, animalId: p.animalId || rec?.animalId || null, doctorId: p.doctorId, healthRecordId: p.healthRecordId || null, appointmentType: p.appointmentType, scheduledAt: when, status: 'requested', consultationNotes: '', cancelReason: '', createdAt: iso(Date.now()) };
    db.appointments.push(a);
    notify(vet._id, 'newRequest', `New ${p.appointmentType === 'farm-visit' ? 'farm visit' : 'in-person'} request from ${u.name}.`);
    notify(u._id, 'appointmentUpdate', `Your request to ${vet.name} was sent and is waiting for confirmation.`);
    save(); return wait(popAppt(a));
  },
  async updateAppointment(id, { action, scheduledAt, notes, reason }) {
    const u = me();
    const a = db.appointments.find((x) => x._id === id);
    if (!a) throw new MockError('not_found');
    const vet = db.users.find((x) => x._id === a.doctorId);
    const freeSlot = () => { if (vet && !vet.availableSlots.includes(a.scheduledAt) && new Date(a.scheduledAt) > new Date()) vet.availableSlots = [...vet.availableSlots, a.scheduledAt].sort(); };
    if (action === 'confirm') { a.status = 'confirmed'; notify(a.userId, 'appointmentUpdate', `${vet.name} confirmed your appointment.`); }
    else if (action === 'reschedule') { freeSlot(); a.scheduledAt = new Date(scheduledAt).toISOString(); a.status = 'rescheduled'; vet.availableSlots = vet.availableSlots.filter((s) => s !== a.scheduledAt); notify(a.userId, 'appointmentUpdate', `${vet.name} proposed a new time for your appointment.`); }
    else if (action === 'complete') { a.status = 'completed'; a.consultationNotes = notes || a.consultationNotes; notify(a.userId, 'appointmentUpdate', `${vet.name} recorded the consultation for your farm.`); }
    else if (action === 'cancel') {
      a.status = 'cancelled'; a.cancelReason = reason || ''; a.cancelledBy = u.role; freeSlot();
      if (u.role === 'vet') notify(a.userId, 'appointmentUpdate', `${vet.name} cancelled your appointment.${reason ? ` Reason: ${reason}` : ''}`);
      else notify(a.doctorId, 'appointmentUpdate', `${u.name} cancelled an appointment.`);
    }
    else if (action === 'accept-reschedule') { a.status = 'confirmed'; notify(a.doctorId, 'appointmentUpdate', `${u.name} accepted the new time.`); }
    else throw new MockError('invalid_input');
    save(); return wait(popAppt(a));
  },
  async savePrescription(appointmentId, p) {
    me();
    const a = db.appointments.find((x) => x._id === appointmentId);
    if (!a) throw new MockError('not_found');
    const med = (p.medicine || []).filter((m) => m.name && m.dosage && m.duration);
    if (!med.length) throw new MockError('invalid_input');
    const rx = { _id: `p_${uid()}`, appointmentId, farmId: a.farmId, userId: a.userId, doctorId: a.doctorId, medicine: med, notes: p.notes || '', createdAt: iso(Date.now()) };
    db.prescriptions.push(rx);
    notify(a.userId, 'prescription', `${userName(a.doctorId)} added a digital prescription for your farm.`);
    save(); return wait(rx);
  },
  async listPrescriptions() {
    const u = me();
    const rows = db.prescriptions.filter((p) => (u.role === 'farmer' ? p.userId === u._id : u.role === 'vet' ? p.doctorId === u._id : true));
    return wait(rows.map((p) => ({ ...p, doctorName: userName(p.doctorId) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async saveAvailability(slots) {
    const u = me();
    u.availableSlots = [...new Set(slots.map((s) => new Date(s).toISOString()))].sort();
    save(); return wait(strip(u));
  },

  // marketplace
  async listCategories() { me(); return wait([...db.categories].sort((a, b) => a.name.localeCompare(b.name))); },
  async listProducts() {
    const stores = activeStoreIds();
    return wait(db.products.filter((p) => p.isActive && stores.includes(p.storeId)).map(popProduct));
  },
  async placeOrder(p) {
    const u = me();
    const items = [];
    for (const it of p.items) {
      const prod = db.products.find((x) => x.productId === it.productId && x.isActive);
      if (!prod || prod.stock < it.quantity) throw new MockError('out_of_stock');
      if (prod.requiresPrescription && !p.prescriptionId) throw new MockError('prescription_required');
      items.push({ productId: prod.productId, medicineName: prod.medicineName, quantity: Number(it.quantity), price: prod.price });
    }
    const o = { _id: `o_${uid()}`, userId: u._id, storeId: p.storeId, prescriptionId: p.prescriptionId || null, items, totalAmount: items.reduce((s, i) => s + i.price * i.quantity, 0), paymentMethod: 'cod', deliveryAddress: p.deliveryAddress, deliveryStatus: 'ordered', orderedAt: iso(Date.now()) };
    db.orders.unshift(o);
    notify(p.storeId, 'newOrder', `New order received from ${u.name}.`);
    notify(u._id, 'orderUpdate', `Your order from ${userName(p.storeId)} was placed.`);
    save(); return wait(popOrder(o));
  },
  async listOrders() {
    const u = me();
    const rows = db.orders.filter((o) => (u.role === 'farmer' ? o.userId === u._id : u.role === 'store' ? o.storeId === u._id : true));
    return wait(rows.map(popOrder).sort((a, b) => b.orderedAt.localeCompare(a.orderedAt)));
  },
  async updateOrder(id, { action, reason }) {
    me();
    const o = db.orders.find((x) => x._id === id);
    if (!o) throw new MockError('not_found');
    const store = userName(o.storeId);
    const map = { accept: 'accepted', reject: 'rejected', processing: 'processing', 'out-for-delivery': 'out-for-delivery', delivered: 'delivered' };
    if (!map[action]) throw new MockError('invalid_input');
    if (action === 'accept') o.items.forEach((it) => { const p = db.products.find((x) => x.productId === it.productId); if (p) p.stock = Math.max(0, p.stock - it.quantity); });
    o.deliveryStatus = map[action];
    if (action === 'reject') o.rejectReason = reason || '';
    notify(o.userId, 'orderUpdate', action === 'reject' ? `${store} could not accept your order.` : `Your order from ${store} is now ${map[action].replace(/-/g, ' ')}.`);
    save(); return wait(popOrder(o));
  },

  // notifications and feedback
  async listNotifications() { const u = me(); return wait(db.notifications.filter((n) => n.userId === u._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 120); },
  async markNotificationRead(id) { const u = me(); db.notifications.forEach((n) => { if (n._id === id && n.userId === u._id) n.isRead = true; }); save(); return wait({ ok: true }, 60); },
  async markAllRead() { const u = me(); db.notifications.forEach((n) => { if (n.userId === u._id) n.isRead = true; }); save(); return wait({ ok: true }, 60); },
  async sendFeedback({ rating, message }) {
    const u = me();
    db.feedback.unshift({ _id: `fb_${uid()}`, userId: u._id, userName: u.name, rating: Number(rating), message, status: 'new', createdAt: iso(Date.now()) });
    save(); return wait({ ok: true });
  },

  // admin
  async adminStats() {
    me();
    const byRole = (r) => db.users.filter((u) => u.role === r).length;
    const dist = {};
    db.records.forEach((r) => { const k = r.diagnosis.disease; dist[k] = (dist[k] || 0) + 1; });
    const risk = buildRisk();
    return wait({
      users: { farmer: byRole('farmer'), vet: byRole('vet'), store: byRole('store'), admin: byRole('admin') },
      pendingApprovals: db.users.filter((u) => u.status === 'pending').length,
      farms: db.farms.length, animals: db.animals.length, detections: db.records.length, orders: db.orders.length, appointments: db.appointments.length,
      diseaseDistribution: dist,
      riskCounts: { Low: risk.filter((r) => r.riskLevel === 'Low').length, Medium: risk.filter((r) => r.riskLevel === 'Medium').length, High: risk.filter((r) => r.riskLevel === 'High').length },
    });
  },
  async adminUsers() { me(); return wait(db.users.map(strip).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); },
  async adminSetUserStatus(id, status) {
    me();
    const u = db.users.find((x) => x._id === id);
    if (!u) throw new MockError('not_found');
    u.status = status; save(); return wait(strip(u));
  },
  async adminDeleteUser(id) {
    me();
    if (id === 'u_admin') throw new MockError('invalid_input');
    db.users = db.users.filter((u) => u._id !== id); save(); return wait({ ok: true });
  },
  async adminListProducts() { me(); return wait(db.products.map(popProduct)); },
  async adminSaveProduct(p) {
    me();
    if (!p.storeId || !p.medicineName?.trim() || !db.categories.some((c) => c._id === p.categoryId) || !(Number(p.price) >= 0) || !(Number(p.stock) >= 0)) throw new MockError('invalid_input');
    const clean = { storeId: p.storeId, medicineName: p.medicineName.trim(), categoryId: p.categoryId, description: p.description || '', price: Number(p.price), stock: Number(p.stock), requiresPrescription: !!p.requiresPrescription, isActive: p.isActive !== false };
    if (p.productId) {
      const x = db.products.find((y) => y.productId === p.productId);
      if (!x) throw new MockError('not_found');
      Object.assign(x, clean); save(); return wait(popProduct(x));
    }
    const x = { productId: `pr_${uid()}`, ...clean };
    db.products.push(x); save(); return wait(popProduct(x));
  },
  async adminDeleteProduct(id) { me(); db.products = db.products.filter((p) => p.productId !== id); save(); return wait({ ok: true }); },
  async adminSaveCategory(p) {
    me();
    const name = String(p.name || '').trim();
    if (!name || db.categories.some((c) => c._id !== p._id && c.name.toLowerCase() === name.toLowerCase())) throw new MockError('invalid_input');
    if (p._id) {
      const c = db.categories.find((x) => x._id === p._id);
      if (!c) throw new MockError('not_found');
      Object.assign(c, { name, nameUr: String(p.nameUr || '').trim() }); save(); return wait(c);
    }
    const c = { _id: `c_${uid()}`, name, nameUr: String(p.nameUr || '').trim() };
    db.categories.push(c); save(); return wait(c);
  },
  async adminDeleteCategory(id) {
    me();
    if (db.products.some((p) => p.categoryId === id)) throw new MockError('category_in_use');
    db.categories = db.categories.filter((c) => c._id !== id); save(); return wait({ ok: true });
  },
  async adminSaveDisease(p) {
    me();
    const i = db.diseases.findIndex((d) => d.id === p.id);
    if (i < 0) throw new MockError('not_found');
    db.diseases[i] = { ...db.diseases[i], ...p }; save(); return wait(db.diseases[i]);
  },
  async adminListFeedback() { me(); return wait(db.feedback); },
  async adminUpdateFeedback(id, status) { me(); const f = db.feedback.find((x) => x._id === id); if (f) f.status = status; save(); return wait({ ok: true }); },
};
