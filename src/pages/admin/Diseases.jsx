import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Button, Card, ErrorState, Field, Input, Loading, Modal, PageHeader, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import s from '../pages.module.css';
import a from './admin.module.css';

const toLines = (arr) => (arr || []).join('\n');
const fromLines = (txt) => txt.split('\n').map((x) => x.trim()).filter(Boolean);

function toForm(d) {
  return {
    id: d.id,
    nameEn: d.name.en, nameUr: d.name.ur,
    descEn: d.description.en, descUr: d.description.ur,
    sympEn: toLines(d.symptoms.en), sympUr: toLines(d.symptoms.ur),
    prevEn: toLines(d.prevention.en), prevUr: toLines(d.prevention.ur),
    treatEn: d.treatment.en, treatUr: d.treatment.ur,
  };
}

export default function AdminDiseases() {
  const { t, pick } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(() => api.listDiseases(), []);
  const [form, setForm] = useState(null);
  const [orig, setOrig] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const up = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (!form.nameEn.trim() || !form.nameUr.trim() || !form.descEn.trim() || !form.descUr.trim()) { toast(t('val.required'), 'error'); return; }
    setBusy(true);
    try {
      await api.adminSaveDisease({
        ...orig, id: form.id,
        name: { en: form.nameEn.trim(), ur: form.nameUr.trim() },
        description: { en: form.descEn.trim(), ur: form.descUr.trim() },
        symptoms: { en: fromLines(form.sympEn), ur: fromLines(form.sympUr) },
        prevention: { en: fromLines(form.prevEn), ur: fromLines(form.prevUr) },
        treatment: { en: form.treatEn.trim(), ur: form.treatUr.trim() },
      });
      toast(t('admin.diseaseSaved')); setForm(null); reload();
    } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.diseases')} subtitle={t('admin.diseasesSub')} />
      <Alert tone="info">{t('admin.diseasesNote')}</Alert>
      <div className={`${s.grid} ${s.auto}`}>
        {data.map((d) => (
          <Card key={d.id}>
            <div className={`${s.row} ${s.between}`} style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>{pick(d.name)}</h3>
              <Badge tone={d.kind === 'healthy' ? 'low' : 'wheat'}>{d.id}</Badge>
            </div>
            <p className={s.muted} style={{ minHeight: '3.2em' }}>{pick(d.description)}</p>
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => { setOrig(d); setForm(toForm(d)); }}>{t('common.edit')}</Button>
          </Card>
        ))}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} wide title={t('admin.editDisease')}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Button><Button onClick={save} loading={busy}>{t('common.save')}</Button></>}>
        {form && (
          <>
            <Alert tone="info">{t('admin.linesHint')}</Alert>
            <div className={a.two}>
              <div>
                <div className={a.langHead}>English</div>
                <Field label={t('admin.diseaseName')} htmlFor="ne"><Input id="ne" value={form.nameEn} onChange={up('nameEn')} /></Field>
                <Field label={t('admin.description')} htmlFor="de"><Textarea id="de" rows={3} value={form.descEn} onChange={up('descEn')} /></Field>
                {orig.kind !== 'healthy' && <Field label={t('det.symptoms')} htmlFor="se"><Textarea id="se" rows={4} value={form.sympEn} onChange={up('sympEn')} /></Field>}
                <Field label={t('det.prevention')} htmlFor="pe"><Textarea id="pe" rows={4} value={form.prevEn} onChange={up('prevEn')} /></Field>
                <Field label={t('det.treatment')} htmlFor="te"><Textarea id="te" rows={3} value={form.treatEn} onChange={up('treatEn')} /></Field>
              </div>
              <div dir="rtl" lang="ur">
                <div className={a.langHead}>اردو</div>
                <Field label={t('admin.diseaseName')} htmlFor="nu"><Input id="nu" value={form.nameUr} onChange={up('nameUr')} /></Field>
                <Field label={t('admin.description')} htmlFor="du"><Textarea id="du" rows={3} value={form.descUr} onChange={up('descUr')} /></Field>
                {orig.kind !== 'healthy' && <Field label={t('det.symptoms')} htmlFor="su"><Textarea id="su" rows={4} value={form.sympUr} onChange={up('sympUr')} /></Field>}
                <Field label={t('det.prevention')} htmlFor="pu"><Textarea id="pu" rows={4} value={form.prevUr} onChange={up('prevUr')} /></Field>
                <Field label={t('det.treatment')} htmlFor="tu"><Textarea id="tu" rows={3} value={form.treatUr} onChange={up('treatUr')} /></Field>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
