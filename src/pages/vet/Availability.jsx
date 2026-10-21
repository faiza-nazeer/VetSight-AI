import { useMemo, useState } from 'react';
import { CalendarClock, Plus, X } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Button, Card, EmptyState, ErrorState, Field, Input, Loading, PageHeader, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { fmtDay, fmtDayKey, fmtTime, toLocalInput } from '../../utils/format';
import s from '../pages.module.css';

export default function Availability() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(() => api.me(), []);
  const [when, setWhen] = useState(toLocalInput(new Date(Date.now() + 86400000)));
  const [busy, setBusy] = useState(false);

  const slots = useMemo(() => (data?.availableSlots || []).filter((x) => new Date(x) > new Date()).sort(), [data]);
  const groups = useMemo(() => {
    const g = {};
    slots.forEach((x) => { (g[fmtDayKey(x)] ||= []).push(x); });
    return Object.entries(g);
  }, [slots]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const save = async (next, msg) => {
    setBusy(true);
    try { await api.saveAvailability(next); toast(msg); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const add = () => {
    const d = new Date(when);
    if (Number.isNaN(d.getTime()) || d <= new Date()) { toast(t('vet.pastSlot'), 'error'); return; }
    save([...slots, d.toISOString()], t('vet.slotAdded'));
  };

  return (
    <>
      <PageHeader title={t('nav.availability')} subtitle={t('vet.availSub')} />
      <div className={s.split}>
        <Card title={t('vet.yourSlots')} pad={slots.length === 0}>
          {slots.length === 0 ? <EmptyState icon={CalendarClock} title={t('vet.noSlotsTitle')} text={t('vet.noSlotsText')} /> : groups.map(([k, list]) => (
            <div key={k} style={{ marginBottom: '0.9rem' }}>
              <div className={s.strong} style={{ marginBottom: '0.3rem' }}>{fmtDay(list[0], lang)}</div>
              <div className={s.chips}>
                {list.map((x) => (
                  <span key={x} className={s.chip} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'default' }}>
                    {fmtTime(x, lang)}
                    <button type="button" aria-label={t('common.remove')} disabled={busy} onClick={() => save(slots.filter((y) => y !== x), t('vet.slotRemoved'))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', padding: 0 }}><X size={15} /></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
        <Card title={t('vet.addSlot')}>
          <Field label={t('vet.dateTime')} htmlFor="slot"><Input id="slot" type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} /></Field>
          <Button icon={Plus} onClick={add} loading={busy}>{t('vet.addSlot')}</Button>
          <p className={`${s.muted} ${s.small}`} style={{ marginTop: '1rem' }}>{t('vet.slotHint')}</p>
        </Card>
      </div>
    </>
  );
}
