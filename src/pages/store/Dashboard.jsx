import { Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, PackageOpen, Truck } from 'lucide-react';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Button, Card, EmptyState, ErrorState, Loading, PageHeader, Stat, StatusBadge } from '../../components/ui';
import { fmtDateTime, fmtMoney } from '../../utils/format';
import s from '../pages.module.css';

export default function StoreDashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => {
    const [orders, products] = await Promise.all([api.listOrders(), api.listProducts()]);
    return { orders, products: products.filter((p) => p.storeId === user._id) };
  }, []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { orders, products } = data;
  const fresh = orders.filter((o) => o.deliveryStatus === 'ordered');
  const progress = orders.filter((o) => ['accepted', 'processing', 'out-for-delivery'].includes(o.deliveryStatus));
  const done = orders.filter((o) => o.deliveryStatus === 'delivered');
  const low = products.filter((p) => p.stock <= 10);

  return (
    <>
      <PageHeader title={t('dash.hello', { name: user.name })} subtitle={t('dash.storeSub')} />
      {low.length > 0 && <Alert tone="warn" title={t('store.lowStock')}>{low.map((p) => `${p.medicineName} (${p.stock})`).join(', ')}</Alert>}
      <div className={`${s.grid} ${s.cols4}`} style={{ marginBottom: '1.25rem' }}>
        <Stat label={t('store.new')} value={fresh.length} icon={PackageOpen} tone="wheat" to="/store/orders" />
        <Stat label={t('store.inProgress')} value={progress.length} icon={Truck} tone="water" to="/store/orders" />
        <Stat label={t('store.delivered')} value={done.length} icon={CheckCircle2} />
        <Stat label={t('store.products')} value={products.length} icon={PackageCheck} to="/store/products" />
      </div>
      <Card title={t('store.recent')} actions={<Link to="/store/orders">{t('common.viewAll')}</Link>} pad={orders.length === 0}>
        {orders.length === 0 ? <EmptyState icon={PackageOpen} title={t('store.noOrders')} /> : (
          <ul className={s.list} style={{ padding: '0 1.25rem' }}>
            {orders.slice(0, 5).map((o) => (
              <li key={o._id} className={s.listItem}>
                <div><div className={s.strong}>{o.farmerName}</div><div className={`${s.muted} ${s.small}`}>{o.items.map((i) => `${i.medicineName} × ${i.quantity}`).join(', ')} · {fmtMoney(o.totalAmount, lang)} · {fmtDateTime(o.orderedAt, lang)}</div></div>
                <StatusBadge status={o.deliveryStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      {fresh.length > 0 && <div style={{ marginTop: '1rem' }}><Link to="/store/orders"><Button>{t('store.reviewNew')}</Button></Link></div>}
    </>
  );
}
