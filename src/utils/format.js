export const cx = (...a) => a.filter(Boolean).join(' ');

const loc = (lang) => (lang === 'ur' ? 'ur-PK' : 'en-GB');

export function fmtDate(v, lang = 'en') {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(loc(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function fmtDateTime(v, lang = 'en') {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(loc(lang), {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(d);
}

export function fmtDayKey(v) {
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtTime(v, lang = 'en') {
  const d = new Date(v);
  return new Intl.DateTimeFormat(loc(lang), { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function fmtMoney(n, lang = 'en') {
  const num = new Intl.NumberFormat(loc(lang)).format(Number(n) || 0);
  return lang === 'ur' ? `${num} روپے` : `Rs ${num}`;
}

export function fmtPercent(n) {
  return `${Math.round((Number(n) || 0) * 100)}%`;
}

export function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
}

export function fileToThumb(file, max = 220) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const giveUp = setTimeout(() => { URL.revokeObjectURL(url); resolve(''); }, 3000);
      img.onload = () => {
        clearTimeout(giveUp);
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => { clearTimeout(giveUp); URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    } catch {
      resolve('');
    }
  });
}

export function fmtDay(v, lang = 'en') {
  const d = new Date(v);
  return new Intl.DateTimeFormat(loc(lang), { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

export function toLocalInput(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
