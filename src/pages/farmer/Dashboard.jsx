import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, MessageCircle, Package, ScanSearch, ShieldAlert, Sprout, Store } from 'lucide-react';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Button, Card, EmptyState, ErrorState, Loading, PageHeader, RiskBadge, Stat, StatusBadge } from '../../components/ui';
import { DISEASE_IDS } from '../../data/diseases';
import { districtLabel } from '../../data/punjab';
import { fmtDate, fmtDateTime, fmtPercent } from '../../utils/format';
import { diseaseName } from '../../utils/labels';
import s from '../pages.module.css';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t, lang, pick } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => {
    const farms = await api.listFarms();
    const region = farms[0]?.region || user.location?.region;
    const [animals, records, appts, orders, risk, diseases] = await Promise.all([
      api.listAnimals(), api.listRecords(), api.listAppointments(), api.listOrders(), region ? api.listRisk({ region }) : [], api.listDiseases(),
    ]);
    return { farms, animals, records, appts, orders, risk, diseases, region };
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { farms, animals, records, appts, orders, risk, diseases, region } = data;
  const upcoming = appts.filter((a) => ['requested', 'confirmed', 'rescheduled'].includes(a.status) && new Date(a.scheduledAt) > new Date()).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const activeOrders = orders.filter((o) => !['delivered', 'rejected'].includes(o.deliveryStatus));
  const high = risk.filter((r) => r.riskLevel === 'High' || r.riskLevel === 'Medium');

  return (
    <>
      <PageHeader title={t('dash.hello', { name: user.name.split(' ')[0] })} subtitle={t('dash.farmerSub')} />

      {farms.length === 0 && (
        <div className={s.callout} style={{ marginBottom: '1.25rem' }}>
          <div><h3>{t('dash.addFarmTitle')}</h3><p>{t('dash.addFarmText')}</p></div>
          <Link to="/farmer/farm"><Button variant="wheat">{t('farm.add')}</Button></Link>
        </div>
      )}

      <div className={`${s.grid} ${s.cols4}`} style={{ marginBottom: '1.25rem' }}>
        <Stat label={t('dash.animals')} value={animals.length} icon={Sprout} to="/farmer/animals" />
        <Stat label={t('dash.highRisk')} value={high.length} icon={ShieldAlert} tone={high.length ? 'high' : undefined} to="/farmer/risk-map" />
        <Stat label={t('dash.upcoming')} value={upcoming.length} icon={CalendarCheck} tone="water" to="/farmer/appointments" />
        <Stat label={t('dash.activeOrders')} value={activeOrders.length} icon={Package} tone="wheat" to="/farmer/orders" />
      </div>

      <div className={s.split}>
        <div className={s.stack}>
          <Card title={t('dash.quick')}>
            <div className={`${s.grid} ${s.cols4}`}>
              <Link to="/farmer/detect"><Button block variant="primary" icon={ScanSearch}>{t('nav.detect')}</Button></Link>
              <Link to="/farmer/chatbot"><Button block variant="secondary" icon={MessageCircle}>{t('nav.chatbot')}</Button></Link>
              <Link to="/farmer/appointments"><Button block variant="secondary" icon={CalendarCheck}>{t('appt.book')}</Button></Link>
              <Link to="/farmer/marketplace"><Button block variant="secondary" icon={Store}>{t('nav.marketplace')}</Button></Link>
            </div>
          </Card>

          <Card title={t('dash.recentRecords')} actions={<Link to="/farmer/records">{t('common.viewAll')}</Link>} pad={false}>
            {records.length === 0 ? (
              <EmptyState icon={ClipboardList} title={t('rec.emptyTitle')} text={t('rec.emptyText')} />
            ) : (
              <ul className={s.list} style={{ padding: '0 1.25rem' }}>
                {records.slice(0, 4).map((r) => (
                  <li key={r._id} className={s.listItem}>
                    <div><div className={s.strong}>{diseaseName(pick, diseases, r.diagnosis.disease)}</div><div className={`${s.muted} ${s.small}`}>{fmtDate(r.createdAt, lang)} · {fmtPercent(r.diagnosis.confidenceScore)}</div></div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className={s.stack}>
          <Card title={region ? t('dash.riskIn', { region: districtLabel(region, lang) }) : t('nav.riskMap')} actions={<Link to="/farmer/risk-map">{t('dash.openMap')}</Link>}>
            {risk.length === 0 ? <p className={s.muted}>{t('dash.noRegion')}</p> : (
              <ul className={s.list}>
                {DISEASE_IDS.map((d) => {
                  const r = risk.find((x) => x.disease === d);
                  return r ? <li key={d} className={s.listItem}><span>{diseaseName(pick, diseases, d)}</span><RiskBadge level={r.riskLevel} /></li> : null;
                })}
              </ul>
            )}
          </Card>

          <Card title={t('dash.nextAppt')} pad={upcoming.length === 0}>
            {upcoming.length === 0 ? <p className={s.muted}>{t('dash.noAppt')}</p> : (
              <ul className={s.list} style={{ padding: '0 1.25rem' }}>
                {upcoming.slice(0, 3).map((a) => (
                  <li key={a._id} className={s.listItem}>
                    <div><div className={s.strong}>{a.doctorName}</div><div className={`${s.muted} ${s.small}`}>{fmtDateTime(a.scheduledAt, lang)} · {t(`visit.${a.appointmentType}`)}</div></div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
