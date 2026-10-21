import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Stethoscope, Store, MailCheck } from 'lucide-react';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { DISTRICTS } from '../data/punjab';
import { Alert, Button, Checkbox, Field, Input, Select } from '../components/ui';
import Brand from '../components/layout/Brand';
import { useErrorText } from '../utils/useApiError';
import { AuthLangButton } from './Login';
import s from './auth.module.css';

const ROLES = [
  { id: 'farmer', icon: Sprout },
  { id: 'vet', icon: Stethoscope },
  { id: 'store', icon: Store },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, ' ').split('');
  const set = (i, ch) => {
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = ch || ' ';
    onChange(arr.join('').replace(/\s+$/, ''));
  };
  return (
    <div className={s.otpRow} onPaste={(e) => {
      const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (txt) { e.preventDefault(); onChange(txt); refs.current[Math.min(txt.length, 5)]?.focus(); }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={s.otpBox}
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          aria-label={`${i + 1}`}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1);
            set(i, ch);
            if (ch && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus(); }}
        />
      ))}
    </div>
  );
}

export default function Register() {
  const { t, lang } = useI18n();
  const { startSession } = useAuth();
  const errText = useErrorText();
  const [step, setStep] = useState('form'); // form | otp | pending
  const [f, setF] = useState({ role: 'farmer', firstName: '', lastName: '', email: '', phone: '', region: 'Lahore', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [left, setLeft] = useState(300);

  useEffect(() => {
    if (step !== 'otp') return undefined;
    const id = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!f.firstName.trim()) e.firstName = t('val.required');
    if (!f.lastName.trim()) e.lastName = t('val.required');
    if (!EMAIL_RE.test(f.email.trim())) e.email = t('val.email');
    if (f.phone && !/^[0-9+\-\s]{10,15}$/.test(f.phone)) e.phone = t('val.phone');
    if (f.password.length < 8) e.password = t('val.passwordShort');
    if (f.confirm !== f.password) e.confirm = t('val.passwordMatch');
    if (!f.terms) e.terms = t('val.terms');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendCode = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await api.register({ role: f.role, firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim(), region: f.region, password: f.password });
      setDemoOtp(res.demoOtp || ''); setLeft(res.expiresInSeconds || 300); setOtp(''); setStep('otp');
    } catch (err) { setFormError(errText(err)); }
    setBusy(false);
  };

  const verify = async () => {
    setFormError('');
    if (otp.length < 6) { setFormError(t('err.otp_invalid')); return; }
    setBusy(true);
    try {
      const res = await api.verifyOtp(f.email.trim(), otp);
      if (res.pendingApproval) setStep('pending');
      else startSession(res.token, res.user);
    } catch (err) { setFormError(errText(err)); }
    setBusy(false);
  };

  const resend = async () => {
    setFormError('');
    try { const r = await api.resendOtp(f.email.trim()); setDemoOtp(r.demoOtp || ''); setLeft(r.expiresInSeconds || 300); setOtp(''); } catch (err) { setFormError(errText(err)); }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className={s.wrap}>
      <div className={s.aside}>
        <div className={s.asideTop}><Brand light /><AuthLangButton light /></div>
        <div className={s.asideMid}><h2>{t('reg.asideTitle')}</h2><p>{t('reg.asideText')}</p></div>
      </div>
      <div className={s.main}>
        <div className={s.mainTop} />
        <div className={s.formBox}>
          {step === 'form' && (
            <>
              <h1>{t('auth.createAccount')}</h1>
              {formError && <Alert tone="danger">{formError}</Alert>}
              <form onSubmit={sendCode} noValidate>
                <div className={s.roleGrid} role="radiogroup" aria-label={t('auth.role')}>
                  {ROLES.map((r) => (
                    <button key={r.id} type="button" role="radio" aria-checked={f.role === r.id} className={s.roleCard} onClick={() => setF((x) => ({ ...x, role: r.id }))}>
                      <r.icon size={22} aria-hidden="true" />
                      <span>{t(`role.${r.id}`)}</span>
                      <small>{t(`reg.roleDesc.${r.id}`)}</small>
                    </button>
                  ))}
                </div>
                {f.role !== 'farmer' && <Alert tone="info">{t('reg.approvalNote')}</Alert>}
                <div className={s.two}>
                  <Field label={t('auth.firstName')} htmlFor="fn" required error={errors.firstName}><Input id="fn" value={f.firstName} onChange={up('firstName')} invalid={!!errors.firstName} autoComplete="given-name" /></Field>
                  <Field label={t('auth.lastName')} htmlFor="ln" required error={errors.lastName}><Input id="ln" value={f.lastName} onChange={up('lastName')} invalid={!!errors.lastName} autoComplete="family-name" /></Field>
                </div>
                <Field label={t('auth.email')} htmlFor="em" required error={errors.email}><Input id="em" type="email" dir="ltr" value={f.email} onChange={up('email')} invalid={!!errors.email} autoComplete="email" /></Field>
                <div className={s.two}>
                  <Field label={`${t('auth.phone')} (${t('auth.optional')})`} htmlFor="ph" error={errors.phone}><Input id="ph" type="tel" dir="ltr" value={f.phone} onChange={up('phone')} invalid={!!errors.phone} autoComplete="tel" /></Field>
                  <Field label={t('auth.region')} htmlFor="rg"><Select id="rg" value={f.region} onChange={up('region')}>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{lang === 'ur' ? d.ur : d.en}</option>)}</Select></Field>
                </div>
                <Field label={t('auth.password')} htmlFor="pw" required error={errors.password} hint={t('val.passwordHint')}><Input id="pw" type="password" dir="ltr" value={f.password} onChange={up('password')} invalid={!!errors.password} autoComplete="new-password" /></Field>
                <Field label={t('auth.confirmPassword')} htmlFor="cp" required error={errors.confirm}><Input id="cp" type="password" dir="ltr" value={f.confirm} onChange={up('confirm')} invalid={!!errors.confirm} autoComplete="new-password" /></Field>
                <Field error={errors.terms}><Checkbox id="terms" checked={f.terms} onChange={up('terms')}>{t('auth.terms')}</Checkbox></Field>
                <Button type="submit" block size="lg" loading={busy}>{t('auth.sendCode')}</Button>
              </form>
              <p className={s.switch}>{t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link></p>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1>{t('auth.otpTitle')}</h1>
              <p>{t('auth.otpIntro', { email: f.email })}</p>
              {formError && <Alert tone="danger">{formError}</Alert>}
              <OtpInput value={otp} onChange={setOtp} />
              <p style={{ textAlign: 'center', color: 'var(--ink-3)' }}>{left > 0 ? t('auth.otpExpires', { time: `${mm}:${ss}` }) : t('err.otp_expired')}</p>
              {demoOtp && <Alert tone="info">{t('auth.demoOtp', { code: demoOtp })}</Alert>}
              <Button block size="lg" onClick={verify} loading={busy} disabled={left === 0}>{t('auth.verify')}</Button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                <Button variant="ghost" onClick={resend}>{t('auth.resend')}</Button>
                <Button variant="ghost" onClick={() => setStep('form')}>{t('common.back')}</Button>
              </div>
            </>
          )}

          {step === 'pending' && (
            <div style={{ textAlign: 'center' }}>
              <MailCheck size={48} color="var(--green-700)" aria-hidden="true" />
              <h1>{t('auth.pendingTitle')}</h1>
              <p style={{ marginInline: 'auto' }}>{t('auth.pendingText')}</p>
              <Link to="/login"><Button size="lg">{t('auth.login')}</Button></Link>
            </div>
          )}
        </div>
        <div />
      </div>
    </div>
  );
}
