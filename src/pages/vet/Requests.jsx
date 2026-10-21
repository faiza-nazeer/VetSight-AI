import { useEffect, useMemo, useState } from 'react';
import { Inbox, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Loading, Modal, PageHeader, Segmented, StatusBadge, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { districtLabel } from '../../data/punjab';
import { fmtDate, fmtDateTime, fmtPercent, toLocalInput } from '../../utils/format';
import { diseaseName } from '../../utils/labels';
import s from '../pages.module.css';

const FILTERS = ['requested', 'confirmed', 'completed', 'all'];
const EMPTY_MED = { name: '', dosage: '', duration: '' };
const OPEN = ['requested', 'confirmed', 'rescheduled'];

export default function Requests() {
  const { t, lang, pick } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(async () => {
    const [appts, diseases] = await Promise.all([api.listAppointments(), api.listDiseases()]);
    return { appts, diseases };
  }, []);
  const [filter, setFilter] = useState('requested');
  const [sel, setSel] = useState(null);
  const [notes, setNotes] = useState('');
  const [resched, setResched] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState(null);
  const [rx, setRx] = useState(false);
  const [meds, setMeds] = useState([{ ...EMPTY_MED }]);
  const [rxNotes, setRxNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (data ? data.appts.filter((a) => filter === 'all' || a.status === filter || (filter === 'confirmed' && a.status === 'rescheduled')) : []), [data, filter]);

  // Health history of the animal concerned (vet can view records of animals linked to their requests)
  useEffect(() => {
    setHistory(null);
    if (!sel?.animalId) return undefined;
    let live = true;
    api.listRecords({ animalId: sel.animalId }).then((r) => live && setHistory(r)).catch(() => live && setHistory([]));
    return () => { live = false; };
  }, [sel?._id, sel?.animalId]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const openReq = (a) => { setSel(a); setNotes(a.consultationNotes || ''); setResched(false); setCancelling(false); setReason(''); setNewTime(toLocalInput(new Date(Date.now() + 86400000))); };
  const run = async (action, extra, msg) => {
    setBusy(true);
    try {
      await api.updateAppointment(sel._id, { action, ...extra });
      toast(msg); setSel(null); reload();
    } catch (err) { onError(err); } finally { setBusy(false); }
  };
  const openRx = () => { setMeds([{ ...EMPTY_MED }]); setRxNotes(''); setRx(true); };
  const savePrescription = async () => {
    const clean = meds.filter((m) => m.name.trim() && m.dosage.trim() && m.duration.trim());
    if (!clean.length) { toast(t('rx.needOne'), 'error'); return; }
    setBusy(true);
    try { await api.savePrescription(sel._id, { medicine: clean, notes: rxNotes.trim() }); toast(t('rx.saved')); setRx(false); setSel(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const setMed = (i, k, v) => setMeds((m) => m.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const footer = !sel ? null : cancelling ? (
    <>
      <Button variant="ghost" onClick={() => setCancelling(false)}>{t('vet.keep')}</Button>
      <Button variant="danger" onClick={() => run('cancel', { reason: reason.trim() }, t('vet.cancelled'))} loading={busy}>{t('vet.cancel')}</Button>
    </>
  ) : (
    <>
      {OPEN.includes(sel.status) && <Button variant="danger" onClick={() => setCancelling(true)}>{t('vet.cancel')}</Button>}
      {OPEN.includes(sel.status) && <Button variant="secondary" onClick={() => setResched((x) => !x)}>{t('vet.reschedule')}</Button>}
      {sel.status === 'requested' && <Button onClick={() => run('confirm', {}, t('vet.confirmed'))} loading={busy}>{t('vet.confirm')}</Button>}
      {['confirmed', 'rescheduled'].includes(sel.status) && <><Button variant="secondary" onClick={openRx}>{t('rx.suggest')}</Button><Button onClick={() => run('complete', { notes }, t('vet.completedMsg'))} loading={busy}>{t('vet.complete')}</Button></>}
      {sel.status === 'completed' && !sel.hasPrescription && <Button onClick={openRx}>{t('rx.suggest')}</Button>}
    </>
  );

  return (
    <>
      <PageHeader title={t('nav.requests')} subtitle={t('vet.requestsSub')} />
      <div style={{ marginBottom: '1rem' }}>
        <Segmented value={filter} onChange={setFilter} label={t('nav.requests')} options={FILTERS.map((f) => ({ value: f, label: f === 'all' ? t('common.all') : t(`status.${f}`) }))} />
      </div>
      {rows.length === 0 ? <Card><EmptyState icon={Inbox} title={t('vet.noRequests')} /></Card> : (
        <div className={s.stack}>
          {rows.map((a) => (
            <Card key={a._id}>
              <div className={`${s.row} ${s.between}`}>
                <div>
                  <h3 style={{ margin: 0 }}>{a.farmerName}</h3>
                  <div className={`${s.muted} ${s.small}`}>{fmtDateTime(a.scheduledAt, lang)} · {districtLabel(a.farmRegion, lang)}{a.animal ? ` · ${a.animal.animalTag}` : ''}</div>
                  <div className={s.row} style={{ marginTop: '0.4rem' }}><StatusBadge status={a.status} /><Badge>{t(`visit.${a.appointmentType}`)}</Badge>{a.diagnosis && <Badge tone="wheat">{diseaseName(pick, data.diseases, a.diagnosis.disease)}</Badge>}</div>
                </div>
                <Button variant="secondary" onClick={() => openReq(a)}>{t('vet.review')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!sel && !rx} onClose={() => setSel(null)} wide title={t('vet.requestTitle')} footer={footer}>
        {sel && (
          <>
            <dl className={s.kv}>
              <dt>{t('vet.farmer')}</dt><dd>{sel.farmerName}</dd>
              <dt>{t('appt.when')}</dt><dd>{fmtDateTime(sel.scheduledAt, lang)}</dd>
              <dt>{t('appt.type')}</dt><dd>{t(`visit.${sel.appointmentType}`)}</dd>
              <dt>{t('nav.farm')}</dt><dd>{districtLabel(sel.farmRegion, lang)} · {t(`species.${sel.farmSpecies}`)} ({sel.cattleCount})</dd>
              {sel.appointmentType === 'farm-visit' && <><dt>{t('vet.farmAddress')}</dt><dd style={{ fontWeight: 400 }}>{sel.farmAddress || '–'}</dd></>}
            </dl>

            <h4 style={{ marginTop: '1rem' }}>{t('vet.animal')}</h4>
            {sel.animal ? (
              <dl className={s.kv}>
                <dt>{t('animal.tag')}</dt><dd dir="ltr" style={{ textAlign: 'start' }}>{sel.animal.animalTag}</dd>
                <dt>{t('animal.breed')}</dt><dd>{t(`breed.${sel.animal.breed}`)}</dd>
                <dt>{t('animal.age')}</dt><dd>{sel.animal.ageYears}</dd>
                <dt>{t('animal.gender')}</dt><dd>{t(`gender.${sel.animal.gender}`)}</dd>
                <dt>{t('animal.weight')}</dt><dd>{sel.animal.weightKg ?? '–'}</dd>
              </dl>
            ) : <p className={s.muted}>{t('animal.none')}</p>}

            <h4 style={{ marginTop: '1rem' }}>{t('vet.aiResult')}</h4>
            {sel.diagnosis ? <Alert tone="info">{diseaseName(pick, data.diseases, sel.diagnosis.disease)} · {fmtPercent(sel.diagnosis.confidenceScore)}</Alert> : <p className={s.muted}>{t('vet.noAi')}</p>}

            {sel.animalId && (
              <>
                <h4>{t('vet.history')}</h4>
                {history === null ? <Loading /> : history.length === 0 ? <p className={s.muted}>{t('vet.noHistory')}</p> : (
                  <ul className={s.list}>
                    {history.map((r) => <li key={r._id} className={s.listItem}><span>{fmtDate(r.createdAt, lang)} · {diseaseName(pick, data.diseases, r.diagnosis.disease)}</span><span className={s.row} style={{ gap: '0.5rem' }}><span className={`${s.muted} ${s.small}`}>{fmtPercent(r.diagnosis.confidenceScore)}</span><StatusBadge status={r.status} /></span></li>)}
                  </ul>
                )}
              </>
            )}

            {resched && !cancelling && (
              <Field label={t('vet.newTime')} htmlFor="nt"><div className={s.row}><Input id="nt" type="datetime-local" value={newTime} min={toLocalInput(new Date())} onChange={(e) => setNewTime(e.target.value)} style={{ maxWidth: 260 }} /><Button onClick={() => run('reschedule', { scheduledAt: new Date(newTime).toISOString() }, t('vet.rescheduledMsg'))} loading={busy}>{t('common.save')}</Button></div></Field>
            )}
            {cancelling && <Field label={t('vet.cancelReason')} htmlFor="cr"><Textarea id="cr" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
            {['confirmed', 'rescheduled'].includes(sel.status) && !cancelling && (
              <Field label={t('vet.notes')} htmlFor="cn" hint={t('vet.notesHint')}><Textarea id="cn" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            )}
            {sel.status === 'completed' && sel.consultationNotes && <><h4>{t('vet.notes')}</h4><p>{sel.consultationNotes}</p></>}
          </>
        )}
      </Modal>

      <Modal open={rx} onClose={() => setRx(false)} wide title={t('rx.title')}
        footer={<><Button variant="ghost" onClick={() => setRx(false)}>{t('common.cancel')}</Button><Button onClick={savePrescription} loading={busy}>{t('rx.save')}</Button></>}>
        <Alert tone="info">{t('rx.note')}</Alert>
        {meds.map((m, i) => (
          <div key={i} className={s.row} style={{ alignItems: 'flex-end', marginBottom: '0.5rem' }}>
            <Field label={t('rx.medicine')} htmlFor={`mn${i}`}><Input id={`mn${i}`} value={m.name} onChange={(e) => setMed(i, 'name', e.target.value)} /></Field>
            <Field label={t('rx.dosage')} htmlFor={`md${i}`}><Input id={`md${i}`} value={m.dosage} onChange={(e) => setMed(i, 'dosage', e.target.value)} /></Field>
            <Field label={t('rx.duration')} htmlFor={`mu${i}`}><Input id={`mu${i}`} value={m.duration} onChange={(e) => setMed(i, 'duration', e.target.value)} /></Field>
            {meds.length > 1 && <Button variant="ghost" aria-label={t('common.remove')} icon={Trash2} onClick={() => setMeds((x) => x.filter((_, j) => j !== i))} style={{ marginBottom: '1rem' }} />}
          </div>
        ))}
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => setMeds((x) => [...x, { ...EMPTY_MED }])}>{t('rx.add')}</Button>
        <Field label={t('rx.instructions')} htmlFor="rxn"><Textarea id="rxn" rows={3} value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} /></Field>
      </Modal>
    </>
  );
}
