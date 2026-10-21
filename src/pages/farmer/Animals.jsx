import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ImagePlus, Pencil, PawPrint, Plus, ScanSearch, Trash2 } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Loading, Modal, PageHeader, Select, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { BREEDS, GENDERS, breedSpecies } from '../../data/breeds';
import { districtLabel } from '../../data/punjab';
import s from '../pages.module.css';
import a from './animals.module.css';

const OK_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const EMPTY = { animalTag: '', breed: 'Sahiwal', gender: 'female', ageYears: '', weightKg: '' };

export default function Animals() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const loc = useLocation();
  const fileRef = useRef(null);
  const { data, loading, error, reload } = useAsync(async () => {
    const [farms, animals] = await Promise.all([api.listFarms(), api.listAnimals()]);
    return { farms, animals };
  }, []);
  const [farmId, setFarmId] = useState(loc.state?.farmId || '');
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});
  const [file, setFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data && !farmId && data.farms[0]) setFarmId(data.farms[0]._id); }, [data, farmId]);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { farms, animals } = data;
  const farmName = (f) => `${districtLabel(f.region, lang)} · ${t(`species.${f.species}`)}`;

  if (farms.length === 0) {
    return (
      <>
        <PageHeader title={t('nav.animals')} subtitle={t('animal.sub')} />
        <Card><EmptyState icon={PawPrint} title={t('animal.needFarm')} action={<Link to="/farmer/farm"><Button>{t('farm.add')}</Button></Link>} /></Card>
      </>
    );
  }

  const rows = animals.filter((x) => x.farmId === farmId);
  const open = (an) => {
    setErrs({}); setFile(null); setRemovePhoto(false);
    setForm(an ? { ...an, ageYears: String(an.ageYears), weightKg: an.weightKg ?? '' } : { ...EMPTY, farmId });
  };
  const up = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }));

  const pick = (f) => {
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) { setErrs((e) => ({ ...e, photo: t('det.badType') })); return; }
    if (f.size > 10 * 1024 * 1024) { setErrs((e) => ({ ...e, photo: t('det.tooBig') })); return; }
    setErrs((e) => ({ ...e, photo: '' })); setFile(f); setRemovePhoto(false);
  };

  const save = async () => {
    const e = {};
    if (!form.animalTag.trim()) e.animalTag = t('val.required');
    const age = Number(form.ageYears);
    if (form.ageYears === '' || !(age >= 0 && age <= 30)) e.ageYears = t('animal.errAge');
    if (form.weightKg !== '' && form.weightKg !== null && !(Number(form.weightKg) > 0)) e.weightKg = t('animal.errWeight');
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.saveAnimal({ ...form, ageYears: age, photoFile: file, removePhoto });
      toast(t('animal.saved')); setForm(null); reload();
    } catch (err) { onError(err); }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try { await api.deleteAnimal(del._id); toast(t('animal.deleted')); setDel(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.animals')} subtitle={t('animal.sub')} actions={<Button icon={Plus} onClick={() => open(null)}>{t('animal.add')}</Button>} />
      <div className={s.filters}>
        <Field label={t('animal.farm')} htmlFor="af"><Select id="af" value={farmId} onChange={(e) => setFarmId(e.target.value)}>{farms.map((f) => <option key={f._id} value={f._id}>{farmName(f)}</option>)}</Select></Field>
      </div>

      {rows.length === 0 ? (
        <Card><EmptyState icon={PawPrint} title={t('animal.emptyTitle')} text={t('animal.emptyText')} action={<Button onClick={() => open(null)}>{t('animal.add')}</Button>} /></Card>
      ) : (
        <div className={`${s.grid} ${s.auto}`}>
          {rows.map((an) => (
            <Card key={an._id} className={a.card}>
              <div className={a.top}>
                <span className={a.photo}>{an.photoUrl ? <img src={an.photoUrl} alt="" /> : <PawPrint size={30} aria-hidden="true" />}</span>
                <div>
                  <h3 className={a.tag} dir="ltr" style={{ textAlign: 'start' }}>{an.animalTag}</h3>
                  <div className={s.row} style={{ gap: '0.4rem', marginTop: '0.25rem' }}>
                    <Badge tone="green">{t(`breed.${an.breed}`)}</Badge>
                    <Badge tone="neutral">{t(`species.${breedSpecies(an.breed)}`)}</Badge>
                  </div>
                </div>
              </div>
              <div className={a.meta}>
                <div><b>{an.ageYears}</b><span>{t('animal.age')}</span></div>
                <div><b>{t(`gender.${an.gender}`)}</b><span>{t('animal.gender')}</span></div>
                <div><b>{an.weightKg ?? '–'}</b><span>{t('animal.weight')}</span></div>
              </div>
              <div className={s.row} style={{ marginTop: 'auto' }}>
                <Link to="/farmer/detect" state={{ farmId: an.farmId, animalId: an._id }}><Button size="sm" icon={ScanSearch}>{t('animal.check')}</Button></Link>
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(an)}>{t('common.edit')}</Button>
                <Button size="sm" variant="ghost" icon={Trash2} aria-label={t('common.delete')} onClick={() => setDel(an)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?._id ? t('animal.edit') : t('animal.add')}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Button><Button onClick={save} loading={busy}>{t('common.save')}</Button></>}>
        {form && (
          <>
            <Field label={t('animal.farm')} htmlFor="mf"><Select id="mf" value={form.farmId} onChange={up('farmId')}>{farms.map((f) => <option key={f._id} value={f._id}>{farmName(f)}</option>)}</Select></Field>
            <Field label={t('animal.tag')} htmlFor="mt" required error={errs.animalTag} hint={t('animal.tagHint')}><Input id="mt" dir="ltr" value={form.animalTag} onChange={up('animalTag')} invalid={!!errs.animalTag} /></Field>
            <Field label={t('animal.breed')} htmlFor="mb"><Select id="mb" value={form.breed} onChange={up('breed')}>{BREEDS.map((b) => <option key={b.id} value={b.id}>{t(`breed.${b.id}`)} ({t(`species.${b.species}`)})</option>)}</Select></Field>
            <Field label={t('animal.gender')}>
              <div className={s.chips} role="radiogroup" aria-label={t('animal.gender')}>
                {GENDERS.map((g) => <button key={g} type="button" role="radio" aria-checked={form.gender === g} aria-pressed={form.gender === g} className={s.chip} onClick={() => setForm((x) => ({ ...x, gender: g }))}>{t(`gender.${g}`)}</button>)}
              </div>
            </Field>
            <div className={s.row} style={{ alignItems: 'flex-start' }}>
              <Field label={t('animal.age')} htmlFor="ma" required error={errs.ageYears}><Input id="ma" type="number" min="0" max="30" step="0.5" inputMode="decimal" value={form.ageYears} onChange={up('ageYears')} invalid={!!errs.ageYears} /></Field>
              <Field label={t('animal.weight')} htmlFor="mw" error={errs.weightKg}><Input id="mw" type="number" min="1" inputMode="decimal" value={form.weightKg ?? ''} onChange={up('weightKg')} invalid={!!errs.weightKg} /></Field>
            </div>
            <Field label={t('animal.photo')} error={errs.photo}>
              <div className={a.uploadRow}>
                {(preview || (!removePhoto && form.photoUrl)) && <img src={preview || form.photoUrl} alt="" />}
                <Button variant="secondary" icon={ImagePlus} onClick={() => fileRef.current?.click()}>{t('animal.photo')}</Button>
                {(preview || (!removePhoto && form.photoUrl)) && <Button variant="ghost" onClick={() => { setFile(null); setRemovePhoto(true); }}>{t('animal.removePhoto')}</Button>}
                <input ref={fileRef} className={a.hidden} type="file" accept="image/png,image/jpeg" tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
              </div>
            </Field>
          </>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title={t('animal.deleteTitle')}
        footer={<><Button variant="ghost" onClick={() => setDel(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={remove} loading={busy}>{t('common.delete')}</Button></>}>
        <p>{t('animal.deleteText')}</p>
        {del && <Alert tone="info"><span dir="ltr">{del.animalTag}</span> · {t(`breed.${del.breed}`)}</Alert>}
      </Modal>
    </>
  );
}
