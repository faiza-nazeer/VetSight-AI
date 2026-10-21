import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Pencil, PawPrint, Plus, Sprout, Trash2 } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { DISTRICTS, districtLabel } from '../../data/punjab';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Loading, Modal, PageHeader, Select, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { fmtDate } from '../../utils/format';
import s from '../pages.module.css';

const EMPTY = { species: 'cattle', cattleCount: '', region: 'Lahore', address: '' };

export default function Farm() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(async () => {
    const [farms, animals] = await Promise.all([api.listFarms(), api.listAnimals()]);
    return { farms, animals };
  }, []);
  const [form, setForm] = useState(null); // null = closed
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (farm) => { setErrors({}); setForm(farm ? { ...farm } : { ...EMPTY }); };

  const save = async () => {
    const e = {};
    if (!(Number(form.cattleCount) >= 1)) e.cattleCount = t('farm.countError');
    if (String(form.address || '').trim().length < 5) e.address = t('farm.addressError');
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try { await api.saveFarm({ ...form, cattleCount: Number(form.cattleCount) }); toast(t('farm.saved')); setForm(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try { await api.deleteFarm(del._id); toast(t('farm.deleted')); setDel(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { farms, animals } = data;

  return (
    <>
      <PageHeader title={t('nav.farm')} subtitle={t('farm.sub')} actions={<Button icon={Plus} onClick={() => open(null)}>{t('farm.add')}</Button>} />
      {farms.length === 0 ? (
        <Card><EmptyState icon={Sprout} title={t('farm.emptyTitle')} text={t('farm.emptyText')} action={<Button onClick={() => open(null)}>{t('farm.add')}</Button>} /></Card>
      ) : (
        <div className={`${s.grid} ${s.auto}`}>
          {farms.map((f) => {
            const n = animals.filter((x) => x.farmId === f._id).length;
            return (
              <Card key={f._id}>
                <div className={`${s.row} ${s.between}`} style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>{districtLabel(f.region, lang)}</h3>
                  <Badge tone="green">{t(`species.${f.species}`)}</Badge>
                </div>
                <dl className={s.kv}>
                  <dt>{t('farm.address')}</dt><dd style={{ fontWeight: 400 }}><MapPin size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {f.address || '–'}</dd>
                  <dt>{t('farm.count')}</dt><dd>{f.cattleCount}</dd>
                  <dt>{t('nav.animals')}</dt><dd>{n}</dd>
                  <dt>{t('farm.created')}</dt><dd>{fmtDate(f.createdAt, lang)}</dd>
                </dl>
                <div className={s.row} style={{ marginTop: '1rem' }}>
                  <Link to="/farmer/animals" state={{ farmId: f._id }}><Button size="sm" icon={PawPrint}>{t('farm.manageAnimals')} ({n})</Button></Link>
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(f)}>{t('common.edit')}</Button>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDel(f)} aria-label={t('common.delete')} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?._id ? t('farm.edit') : t('farm.add')}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Button><Button onClick={save} loading={busy}>{t('common.save')}</Button></>}>
        {form && (
          <>
            <Field label={t('farm.species')} htmlFor="sp"><Select id="sp" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}><option value="cattle">{t('species.cattle')}</option><option value="buffalo">{t('species.buffalo')}</option><option value="mixed">{t('species.mixed')}</option></Select></Field>
            <Field label={t('farm.count')} htmlFor="cc" required error={errors.cattleCount}><Input id="cc" type="number" min="1" inputMode="numeric" value={form.cattleCount} onChange={(e) => setForm({ ...form, cattleCount: e.target.value })} invalid={!!errors.cattleCount} /></Field>
            <Field label={t('farm.region')} htmlFor="rg" hint={t('farm.regionHint')}><Select id="rg" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{lang === 'ur' ? d.ur : d.en}</option>)}</Select></Field>
            <Field label={t('farm.address')} htmlFor="ad" required error={errors.address} hint={t('farm.addressHint')}><Textarea id="ad" rows={3} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} invalid={!!errors.address} /></Field>
          </>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title={t('farm.deleteTitle')}
        footer={<><Button variant="ghost" onClick={() => setDel(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={remove} loading={busy}>{t('common.delete')}</Button></>}>
        <p>{t('farm.deleteText')}</p>
      </Modal>
    </>
  );
}
