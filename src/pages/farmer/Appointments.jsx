import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarPlus, MapPin, Pill, Tractor } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Loading, Modal, PageHeader, Segmented, Select, StatusBadge, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { districtLabel } from '../../data/punjab';
import { fmtDateTime, fmtDay, fmtDayKey, fmtTime } from '../../utils/format';
import s from '../pages.module.css';
import a from './appointments.module.css';

const ACTIVE = ['requested', 'confirmed', 'rescheduled'];

function Booking({ open, onClose, farms, animals, preset, onBooked }) {
  const { t, lang } = useI18n();
  const onError = useApiError();
  const [farmId, setFarmId] = useState('');
  const [animalId, setAnimalId] = useState('');
  const [type, setType] = useState('farm-visit');
  const [vets, setVets] = useState(null);
  const [vetId, setVetId] = useState('');
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFarmId(preset?.farmId || farms[0]?._id || ''); setAnimalId(preset?.animalId || ''); setVetId(preset?.vetId || ''); setSlot(''); setType('farm-visit');
  }, [open, preset, farms]);

  const farm = farms.find((f) => f._id === farmId);
  const farmAnimals = animals.filter((a) => a.farmId === farmId);
  const needsAddress = type === 'farm-visit' && farm && !String(farm.address || '').trim();
  useEffect(() => {
    if (!open || !farm) return;
    let live = true;
    setVets(null);
    api.listVets(farm.region).then((v) => live && setVets(v)).catch(onError);
    return () => { live = false; };
  }, [open, farm?.region]); // eslint-disable-line react-hooks/exhaustive-deps

  const vet = vets?.find((v) => v._id === vetId);
  const days = useMemo(() => {
    const g = {};
    (vet?.availableSlots || []).forEach((sl) => { (g[fmtDayKey(sl)] ||= []).push(sl); });
    return Object.entries(g).slice(0, 6);
  }, [vet]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.bookAppointment({ doctorId: vetId, farmId, animalId: animalId || null, healthRecordId: preset?.healthRecordId || null, appointmentType: type, scheduledAt: slot });
      onBooked();
    } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} wide title={t('appt.bookTitle')}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={submit} loading={busy} disabled={!vetId || !slot || needsAddress}>{t('appt.send')}</Button></>}>
      <div className={a.sectionTitle}><span>1</span>{t('appt.stepType')}</div>
      <div className={s.chips} role="group" aria-label={t('appt.stepType')}>
        {['farm-visit', 'in-person'].map((x) => <button key={x} type="button" className={s.chip} aria-pressed={type === x} onClick={() => setType(x)}>{t(`visit.${x}`)}</button>)}
      </div>
      <p className={`${s.muted} ${s.small}`} style={{ marginTop: '0.5rem' }}>{t(`visit.${type}.hint`)}</p>
      {farms.length > 1 && (
        <Field label={t('det.chooseFarm')} htmlFor="bf"><Select id="bf" value={farmId} onChange={(e) => { setFarmId(e.target.value); setAnimalId(''); setVetId(''); setSlot(''); }}>{farms.map((f) => <option key={f._id} value={f._id}>{districtLabel(f.region, lang)} · {t(`species.${f.species}`)}</option>)}</Select></Field>
      )}
      <Field label={t('animal.optional')} htmlFor="ba">
        <Select id="ba" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
          <option value="">{t('animal.none')}</option>
          {farmAnimals.map((x) => <option key={x._id} value={x._id}>{x.animalTag} · {t(`breed.${x.breed}`)}</option>)}
        </Select>
      </Field>
      {needsAddress && <Alert tone="warn">{t('appt.noAddress')} <Link to="/farmer/farm">{t('appt.addAddress')}</Link></Alert>}

      <div className={a.sectionTitle}><span>2</span>{t('appt.stepVet')}</div>
      {!vets ? <Loading /> : vets.length === 0 ? <p className={s.muted}>{t('appt.noVets')}</p> : (
        <div className={a.vets} role="radiogroup" aria-label={t('appt.stepVet')}>
          {vets.map((v) => (
            <button key={v._id} type="button" role="radio" aria-checked={vetId === v._id} className={a.vetCard} onClick={() => { setVetId(v._id); setSlot(''); }}>
              <div><div className={s.strong}>{v.name}</div><div className={`${s.muted} ${s.small}`}>{v.specialty}{v.clinicAddress ? ` · ${v.clinicAddress}` : ''}</div></div>
              {v.distanceKm != null && <Badge tone="water"><MapPin size={13} /> {v.distanceKm} km</Badge>}
            </button>
          ))}
        </div>
      )}

      {vet && (
        <>
          <div className={a.sectionTitle}><span>3</span>{t('appt.stepTime')}</div>
          {days.length === 0 ? <p className={s.muted}>{t('appt.noSlots')}</p> : days.map(([k, list]) => (
            <div key={k} className={a.day}>
              <div>{fmtDay(list[0], lang)}</div>
              <div className={s.chips}>{list.map((sl) => <button key={sl} type="button" className={s.chip} aria-pressed={slot === sl} onClick={() => setSlot(sl)}>{fmtTime(sl, lang)}</button>)}</div>
            </div>
          ))}
        </>
      )}
      {type === 'in-person' && vet?.clinicAddress && <Alert tone="info">{t('appt.clinicAt', { address: vet.clinicAddress })}</Alert>}
      {type === 'farm-visit' && farm?.address && <Alert tone="info">{t('appt.farmAtAddress', { address: farm.address })}</Alert>}
    </Modal>
  );
}

export default function Appointments() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const loc = useLocation();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(async () => {
    const [appts, farms, animals, rx] = await Promise.all([api.listAppointments(), api.listFarms(), api.listAnimals(), api.listPrescriptions()]);
    return { appts, farms, animals, rx };
  }, []);
  const [filter, setFilter] = useState('upcoming');
  const [booking, setBooking] = useState(null); // preset object or null
  const [cancel, setCancel] = useState(null);
  const [rxOpen, setRxOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && loc.state && (loc.state.vetId || loc.state.farmId || loc.state.animalId || loc.state.healthRecordId) && data.farms.length) {
      setBooking({ ...loc.state });
      navigate(loc.pathname, { replace: true, state: null });
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { appts, farms, animals, rx } = data;
  const list = appts.filter((x) => (filter === 'upcoming' ? ACTIVE.includes(x.status) : !ACTIVE.includes(x.status)));

  const act = async (id, action, ok) => {
    setBusy(true);
    try { await api.updateAppointment(id, { action }); toast(ok); setCancel(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const rxFor = (id) => rx.find((p) => p.appointmentId === id);

  return (
    <>
      <PageHeader title={t('nav.appointments')} subtitle={t('appt.sub')}
        actions={<Button icon={CalendarPlus} onClick={() => (farms.length ? setBooking({}) : navigate('/farmer/farm'))}>{t('appt.book')}</Button>} />
      {farms.length === 0 && <Alert tone="warn">{t('appt.needFarm')} <Link to="/farmer/farm">{t('farm.add')}</Link></Alert>}
      <div style={{ marginBottom: '1rem' }}>
        <Segmented value={filter} onChange={setFilter} label={t('nav.appointments')} options={[{ value: 'upcoming', label: t('appt.upcoming') }, { value: 'past', label: t('appt.past') }]} />
      </div>

      {list.length === 0 ? (
        <Card><EmptyState icon={CalendarCheck} title={t('appt.emptyTitle')} text={t('appt.emptyText')} action={farms.length ? <Button onClick={() => setBooking({})}>{t('appt.book')}</Button> : null} /></Card>
      ) : (
        <div className={a.apptList}>
          {list.map((x) => {
            const d = new Date(x.scheduledAt);
            const p = rxFor(x._id);
            return (
              <Card key={x._id}>
                <div className={a.appt}>
                  <div className={a.date}><b>{d.getDate()}</b><span>{new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-GB', { month: 'short' }).format(d)}</span></div>
                  <div className={a.apptMain}>
                    <h3>{x.doctorName}</h3>
                    <div className={`${s.muted} ${s.small}`}>{fmtDateTime(x.scheduledAt, lang)}</div>
                    <div className={s.row} style={{ marginTop: '0.4rem' }}>
                      <StatusBadge status={x.status} />
                      <Badge tone="neutral">{x.appointmentType === 'farm-visit' ? <Tractor size={13} /> : <MapPin size={13} />} {t(`visit.${x.appointmentType}`)}</Badge>
                    </div>
                    <div className={`${s.muted} ${s.small}`} style={{ marginTop: '0.4rem' }}>
                      {x.appointmentType === 'in-person' ? x.clinicAddress : (x.farmAddress || t('appt.farmAt', { region: districtLabel(x.farmRegion, lang) }))}
                    </div>
                    {x.animal && <div className={`${s.muted} ${s.small}`}><span dir="ltr">{x.animal.animalTag}</span> · {t(`breed.${x.animal.breed}`)}</div>}
                    {x.status === 'cancelled' && x.cancelledBy === 'vet' && <Alert tone="warn" title={t('appt.cancelledByVet')}>{x.cancelReason ? `${t('appt.cancelReason')}: ${x.cancelReason}` : ''}</Alert>}
                    {x.status === 'rescheduled' && <Alert tone="warn">{t('appt.rescheduledNote')}</Alert>}
                  </div>
                  <div className={a.apptActions}>
                    {x.status === 'rescheduled' && <Button size="sm" onClick={() => act(x._id, 'accept-reschedule', t('appt.accepted'))}>{t('appt.acceptTime')}</Button>}
                    {p && <Button size="sm" variant="secondary" icon={Pill} onClick={() => setRxOpen(p)}>{t('appt.viewRx')}</Button>}
                    {ACTIVE.includes(x.status) && <Button size="sm" variant="ghost" onClick={() => setCancel(x)}>{t('common.cancel')}</Button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Booking open={!!booking} preset={booking} farms={farms} animals={animals} onClose={() => setBooking(null)} onBooked={() => { setBooking(null); toast(t('appt.sent')); reload(); }} />

      <Modal open={!!cancel} onClose={() => setCancel(null)} title={t('appt.cancelTitle')}
        footer={<><Button variant="ghost" onClick={() => setCancel(null)}>{t('common.back')}</Button><Button variant="danger" loading={busy} onClick={() => act(cancel._id, 'cancel', t('appt.cancelled'))}>{t('appt.cancelConfirm')}</Button></>}>
        <p>{t('appt.cancelText', { vet: cancel?.doctorName || '' })}</p>
      </Modal>

      <Modal open={!!rxOpen} onClose={() => setRxOpen(null)} title={t('appt.rxTitle')}
        footer={<><Button variant="ghost" onClick={() => setRxOpen(null)}>{t('common.close')}</Button><Link to="/farmer/marketplace"><Button>{t('appt.orderMeds')}</Button></Link></>}>
        {rxOpen && (
          <>
            <p className={s.muted}>{rxOpen.doctorName} · {fmtDateTime(rxOpen.createdAt, lang)}</p>
            <ul className={s.list}>{rxOpen.medicine.map((m) => <li key={m.name} className={s.listItem}><span className={s.strong}>{m.name}</span><span>{m.dosage} · {m.duration}</span></li>)}</ul>
            {rxOpen.notes && <Alert tone="info">{rxOpen.notes}</Alert>}
          </>
        )}
      </Modal>
    </>
  );
}
