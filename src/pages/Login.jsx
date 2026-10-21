import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { USE_MOCK } from '../api/services';
import { Alert, Button, Field, Input } from '../components/ui';
import Brand from '../components/layout/Brand';
import { useErrorText } from '../utils/useApiError';
import s from './auth.module.css';

const DEMO = [
  { role: 'farmer', email: 'ali@example.com' },
  { role: 'vet', email: 'sana@example.com' },
  { role: 'store', email: 'vetmeds@example.com' },
  { role: 'admin', email: 'admin@vetsight.com' },
];

export function AuthLangButton({ light }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button type="button" className={`${s.langBtn} ${light ? s.langBtnLight : ''}`} onClick={() => setLang(lang === 'en' ? 'ur' : 'en')} aria-label={t('lang.switch')}>
      <Languages size={18} aria-hidden="true" /><span lang={lang === 'en' ? 'ur' : 'en'}>{lang === 'en' ? 'اردو' : 'English'}</span>
    </button>
  );
}

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const errText = useErrorText();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError(t('val.required')); return; }
    setBusy(true);
    try { await login(email.trim(), password); } catch (err) { setError(errText(err)); setBusy(false); }
  };

  return (
    <div className={s.wrap}>
      <div className={s.aside}>
        <div className={s.asideTop}><Brand light /><AuthLangButton light /></div>
        <div className={s.asideMid}>
          <h2>{t('auth.asideTitle')}</h2>
          <p>{t('auth.asideText')}</p>
        </div>
      </div>
      <div className={s.main}>
        <div className={s.mainTop}><div style={{ display: 'contents' }}><span className="sr-only">{t('auth.login')}</span></div></div>
        <div className={s.formBox}>
          <h1>{t('auth.welcomeBack')}</h1>
          <p style={{ color: 'var(--ink-3)' }}>{t('auth.loginIntro')}</p>
          {error && <Alert tone="danger">{error}</Alert>}
          <form onSubmit={submit} noValidate>
            <Field label={t('auth.email')} htmlFor="email" required>
              <Input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </Field>
            <Field label={t('auth.password')} htmlFor="password" required>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
            </Field>
            <Button type="submit" block size="lg" loading={busy}>{t('auth.login')}</Button>
          </form>
          <p className={s.switch}>{t('auth.noAccount')} <Link to="/register">{t('auth.createAccount')}</Link></p>

          {USE_MOCK && (
            <div className={s.demo}>
              <h4>{t('auth.demoAccounts')}</h4>
              <div className={s.demoRow}>
                {DEMO.map((d) => (
                  <Button key={d.role} variant="secondary" size="sm" onClick={() => { setEmail(d.email); setPassword('demo1234'); setError(''); }}>{t(`role.${d.role}`)}</Button>
                ))}
              </div>
              <p className="" style={{ margin: '0.6rem 0 0', fontSize: '0.85rem', color: 'var(--ink-3)' }}>{t('auth.demoHint')}</p>
            </div>
          )}
        </div>
        <div />
      </div>
    </div>
  );
}
