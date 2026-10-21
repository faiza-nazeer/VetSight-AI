import { useState } from 'react';
import { Bell, CalendarCheck, CheckCheck, Inbox, PackageCheck, Pill, ScanSearch, ShieldAlert } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Button, Card, EmptyState, ErrorState, Loading, PageHeader, Segmented } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';
import s from '../pages.module.css';

const ICON = { riskAlert: ShieldAlert, appointmentUpdate: CalendarCheck, prescription: Pill, orderUpdate: PackageCheck, newRequest: Inbox, newOrder: PackageCheck, diagnosisResult: ScanSearch };

export default function Notifications() {
  const { t, lang } = useI18n();
  const { data, loading, error, reload, setData } = useAsync(() => api.listNotifications(), []);
  const [filter, setFilter] = useState('all');
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const rows = data.filter((n) => filter === 'all' || !n.isRead);
  const unread = data.filter((n) => !n.isRead).length;
  const read = async (n) => {
    if (n.isRead) return;
    setData((x) => x.map((i) => (i._id === n._id ? { ...i, isRead: true } : i)));
    await api.markNotificationRead(n._id).catch(() => {});
  };
  const readAll = async () => { setData((x) => x.map((i) => ({ ...i, isRead: true }))); await api.markAllRead().catch(() => {}); };

  return (
    <>
      <PageHeader title={t('nav.notifications')} subtitle={t('notif.sub', { n: unread })} actions={<Button variant="secondary" icon={CheckCheck} onClick={readAll} disabled={!unread}>{t('notif.markAll')}</Button>} />
      <div style={{ marginBottom: '1rem' }}>
        <Segmented value={filter} onChange={setFilter} label={t('nav.notifications')} options={[{ value: 'all', label: t('common.all') }, { value: 'unread', label: t('notif.unread') }]} />
      </div>
      <Card pad={false}>
        {rows.length === 0 ? <EmptyState icon={Bell} title={t('notif.empty')} /> : (
          <ul className={s.list} style={{ padding: '0 1.25rem' }}>
            {rows.map((n) => {
              const Icon = ICON[n.type] || Bell;
              return (
                <li key={n._id} className={s.listItem} style={{ opacity: n.isRead ? 0.75 : 1 }}>
                  <div className={s.row} style={{ flex: 1, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 10, background: n.type === 'riskAlert' ? 'var(--risk-high-bg)' : 'var(--green-100)', color: n.type === 'riskAlert' ? 'var(--risk-high)' : 'var(--green-800)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} aria-hidden="true" /></span>
                    <div>
                      <div className={n.isRead ? '' : s.strong}>{n.message}</div>
                      <div className={`${s.muted} ${s.small}`}>{t(`notif.type.${n.type}`)} · {fmtDateTime(n.createdAt, lang)}</div>
                    </div>
                  </div>
                  {!n.isRead && <Button size="sm" variant="ghost" onClick={() => read(n)}>{t('notif.markRead')}</Button>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
