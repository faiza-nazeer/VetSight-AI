import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import ur from './ur';

const dicts = { en, ur };
const Ctx = createContext(null);

function readLang() {
  try {
    const v = localStorage.getItem('vs_lang');
    return v === 'ur' ? 'ur' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    try { localStorage.setItem('vs_lang', lang); } catch { /* storage unavailable */ }
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      let s = dicts[lang][key] ?? dicts.en[key] ?? key;
      if (vars) Object.keys(vars).forEach((k) => { s = s.split(`{${k}}`).join(String(vars[k])); });
      return s;
    },
    [lang],
  );

  // Picks the right language from a bilingual value such as { en: '...', ur: '...' }
  const pick = useCallback(
    (v) => (v == null ? '' : typeof v === 'string' ? v : v[lang] ?? v.en ?? ''),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, pick, dir: lang === 'ur' ? 'rtl' : 'ltr' }),
    [lang, t, pick],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}
