import { Languages } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export default function LanguageToggle({ className }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === 'en' ? 'ur' : 'en';
  return (
    <button type="button" className={className} onClick={() => setLang(next)} aria-label={t('lang.switch')} title={t('lang.switch')}>
      <Languages size={18} aria-hidden="true" />
      <span lang={next}>{next === 'ur' ? 'اردو' : 'English'}</span>
    </button>
  );
}
