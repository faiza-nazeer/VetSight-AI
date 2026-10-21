import { Link } from 'react-router-dom';
import { ClipboardCheck, Package, ScanSearch, Users } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Button, Card, ErrorState, Loading, PageHeader, Stat } from '../../components/ui';
import { diseaseName } from '../../utils/labels';
import s from '../pages.module.css';
import a from './admin.module.css';

function Bars({ rows, max }) {
  return (
    <div className={a.bars}>
      {rows.map((r) => (
        <div key={r.key} className={a.bar}>
          <span>{r.label}</span>
          <span className={a.track}><i className={a.fill} style={{ width: `${max ? (r.value / max) * 100 : 0}%`, background: r.color }} /></span>
          <span className={a.num}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { t, pick } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, diseases] = await Promise.all([api.adminStats(), api.listDiseases()]);
    return { stats, diseases };
  }, []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { stats, diseases } = data;
  const totalUsers = Object.values(stats.users).reduce((n, v) => n + v, 0);
  const distRows = Object.entries(stats.diseaseDistribution).map(([k, v]) => ({ key: k, label: diseaseName(pick, diseases, k), value: v }));
  const riskRows = [['Low', '#3e8e5a'], ['Medium', '#e39b25'], ['High', '#c23b2e']].map(([k, c]) => ({ key: k, label: t(`risk.${k}`), value: stats.riskCounts[k], color: c }));

  return (
    <>
      <PageHeader title={t('nav.dashboard')} subtitle={t('admin.sub')} />
      {stats.pendingApprovals > 0 && (
        <Alert tone="warn" title={t('admin.pendingTitle', { n: stats.pendingApprovals })}>
          <Link to="/admin/users"><Button size="sm" variant="secondary">{t('admin.reviewNow')}</Button></Link>
        </Alert>
      )}
      <div className={`${s.grid} ${s.cols4}`} style={{ marginBottom: '1.25rem' }}>
        <Stat label={t('admin.users')} value={totalUsers} icon={Users} to="/admin/users" />
        <Stat label={t('admin.detections')} value={stats.detections} icon={ScanSearch} tone="wheat" />
        <Stat label={t('admin.orders')} value={stats.orders} icon={Package} tone="water" />
        <Stat label={t('admin.appointments')} value={stats.appointments} icon={ClipboardCheck} />
      </div>
      <div className={`${s.grid} ${s.cols2}`}>
        <Card title={t('admin.byRole')}>
          <Bars rows={['farmer', 'vet', 'store', 'admin'].map((r) => ({ key: r, label: t(`role.${r}`), value: stats.users[r] }))} max={Math.max(...Object.values(stats.users), 1)} />
        </Card>
        <Card title={t('admin.diseaseDist')}>
          <Bars rows={distRows} max={Math.max(...distRows.map((r) => r.value), 1)} />
        </Card>
        <Card title={t('admin.riskDist')}>
          <Bars rows={riskRows} max={Math.max(...riskRows.map((r) => r.value), 1)} />
        </Card>
        <Card title={t('admin.platform')}>
          <dl className={s.kv}>
            <dt>{t('nav.farm')}</dt><dd>{stats.farms}</dd>
            <dt>{t('admin.detections')}</dt><dd>{stats.detections}</dd>
            <dt>{t('admin.appointments')}</dt><dd>{stats.appointments}</dd>
            <dt>{t('admin.orders')}</dt><dd>{stats.orders}</dd>
          </dl>
        </Card>
      </div>
    </>
  );
}
