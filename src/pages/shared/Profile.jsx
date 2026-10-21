import { useState } from 'react';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { DISTRICTS } from '../../data/punjab';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { fmtDate } from '../../utils/format';

export default function Profile() {
  const { user, refresh } = useAuth();
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const [f, setF] = useState({
    name: user.name || '', phone: user.phone || '', region: user.location?.region || 'Lahore',
    specialty: user.specialty || '', clinicAddress: user.clinicAddress || '', address: user.address || '',
  });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = t('val.required');
    if (f.phone && !/^[0-9+\-\s]{10,15}$/.test(f.phone)) er.phone = t('val.phone');
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await api.updateProfile(f); await refresh(); toast(t('profile.saved')); } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.profile')} subtitle={t('profile.sub')} />
      <div style={{ maxWidth: 680 }}>
        <Card>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Badge tone="green">{t(`role.${user.role}`)}</Badge>
            <span style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>{t('profile.since', { date: fmtDate(user.createdAt, lang) })}</span>
          </div>
          <form onSubmit={save} noValidate>
            <Field label={t('profile.name')} htmlFor="nm" required error={errs.name}><Input id="nm" value={f.name} onChange={up('name')} invalid={!!errs.name} /></Field>
            <Field label={t('auth.email')} htmlFor="em" hint={t('profile.emailLocked')}><Input id="em" value={user.email} disabled dir="ltr" /></Field>
            <Field label={t('auth.phone')} htmlFor="ph" error={errs.phone}><Input id="ph" type="tel" dir="ltr" value={f.phone} onChange={up('phone')} invalid={!!errs.phone} /></Field>
            <Field label={t('auth.region')} htmlFor="rg"><Select id="rg" value={f.region} onChange={up('region')}>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{lang === 'ur' ? d.ur : d.en}</option>)}</Select></Field>
            {user.role === 'vet' && (
              <>
                <Field label={t('profile.specialty')} htmlFor="sp"><Input id="sp" value={f.specialty} onChange={up('specialty')} /></Field>
                <Field label={t('profile.clinic')} htmlFor="ca"><Textarea id="ca" rows={2} value={f.clinicAddress} onChange={up('clinicAddress')} /></Field>
              </>
            )}
            {user.role === 'store' && <Field label={t('profile.storeAddress')} htmlFor="sa"><Textarea id="sa" rows={2} value={f.address} onChange={up('address')} /></Field>}
            <Button type="submit" loading={busy}>{t('common.save')}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
