import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Inbox, Stethoscope } from 'lucide-react';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Button, Card, EmptyState, ErrorState, Loading, PageHeader, Stat, StatusBadge } from '../../components/ui';
import { districtLabel } from '../../data/punjab';
import { fmtDateTime } from '../../utils/format';
import s from '../pages.module.css';

export default function VetDashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => {
    const [appts, me] = await Promise.all([api.listAppointments(), api.me()]);
    return { appts, me };
  }, []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { appts, me } = data;
  const pending = appts.filter((a) => a.status === 'requested');
  const upcoming = appts.filter((a) => ['confirmed', 'rescheduled'].includes(a.status) && new Date(a.scheduledAt) > new Date()).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const done = appts.filter((a) => a.status === 'completed');
  const slots = (me.availableSlots || []).filter((x) => new Date(x) > new Date());

  return (
    <>
      <PageHeader title={t('dash.hello', { name: user.name })} subtitle={t('dash.vetSub')} />
      {slots.length === 0 && <Alert tone="warn" title={t('vet.noSlotsTitle')}>{t('vet.noSlotsText')} <Link to="/vet/availability">{t('nav.availability')}</Link></Alert>}
      <div className={`${s.grid} ${s.cols4}`} style={{ marginBottom: '1.25rem' }}>
        <Stat label={t('vet.pending')} value={pending.length} icon={Inbox} tone="wheat" to="/vet/requests" />
        <Stat label={t('dash.upcoming')} value={upcoming.length} icon={Stethoscope} to="/vet/requests" />
        <Stat label={t('vet.completed')} value={done.length} icon={CheckCircle2} tone="water" />
        <Stat label={t('vet.openSlots')} value={slots.length} icon={CalendarClock} to="/vet/availability" />
      </div>
      <div className={s.split}>
        <Card title={t('vet.pending')} actions={<Link to="/vet/requests">{t('common.viewAll')}</Link>} pad={pending.length === 0}>
          {pending.length === 0 ? <EmptyState icon={Inbox} title={t('vet.noPending')} /> : (
            <ul className={s.list} style={{ padding: '0 1.25rem' }}>
              {pending.slice(0, 5).map((a) => (
                <li key={a._id} className={s.listItem}>
                  <div><div className={s.strong}>{a.farmerName}</div><div className={`${s.muted} ${s.small}`}>{fmtDateTime(a.scheduledAt, lang)} · {t(`visit.${a.appointmentType}`)} · {districtLabel(a.farmRegion, lang)}</div></div>
                  <Link to="/vet/requests"><Button size="sm">{t('vet.review')}</Button></Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t('vet.schedule')} pad={upcoming.length === 0}>
          {upcoming.length === 0 ? <p className={s.muted}>{t('vet.noUpcoming')}</p> : (
            <ul className={s.list} style={{ padding: '0 1.25rem' }}>
              {upcoming.slice(0, 5).map((a) => (
                <li key={a._id} className={s.listItem}>
                  <div><div className={s.strong}>{a.farmerName}</div><div className={`${s.muted} ${s.small}`}>{fmtDateTime(a.scheduledAt, lang)}</div></div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
