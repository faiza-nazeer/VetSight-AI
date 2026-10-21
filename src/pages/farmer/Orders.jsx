import { Link } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Button, Card, EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from '../../components/ui';
import { fmtDateTime, fmtMoney } from '../../utils/format';
import s from '../pages.module.css';

export const STEPS = ['ordered', 'accepted', 'processing', 'out-for-delivery', 'delivered'];

export function Tracker({ status }) {
  const { t } = useI18n();
  const idx = STEPS.indexOf(status);
  return (
    <ol className={s.tracker} aria-label={t('ord.tracker')}>
      {STEPS.map((st, i) => <li key={st} className={i <= idx ? s.done : ''}>{t(`status.${st}`)}</li>)}
    </ol>
  );
}

export default function Orders() {
  const { t, lang } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.listOrders(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title={t('nav.orders')} subtitle={t('ord.sub')} actions={<Link to="/farmer/marketplace"><Button>{t('nav.marketplace')}</Button></Link>} />
      {data.length === 0 ? (
        <Card><EmptyState icon={PackageCheck} title={t('ord.emptyTitle')} text={t('ord.emptyText')} action={<Link to="/farmer/marketplace"><Button>{t('nav.marketplace')}</Button></Link>} /></Card>
      ) : (
        <div className={s.stack}>
          {data.map((o) => (
            <Card key={o._id}>
              <div className={`${s.row} ${s.between}`}>
                <div><h3 style={{ margin: 0 }}>{o.storeName}</h3><div className={`${s.muted} ${s.small}`}>{fmtDateTime(o.orderedAt, lang)}</div></div>
                <StatusBadge status={o.deliveryStatus} />
              </div>
              <ul className={s.list} style={{ marginTop: '0.5rem' }}>
                {o.items.map((it) => <li key={it.productId || it.medicineName} className={s.listItem}><span>{it.medicineName} × {it.quantity}</span><span>{fmtMoney(it.price * it.quantity, lang)}</span></li>)}
              </ul>
              <div className={`${s.row} ${s.between}`}><span className={s.muted}>{o.deliveryAddress}</span><strong>{t('mkt.total')}: {fmtMoney(o.totalAmount, lang)}</strong></div>
              <div className={`${s.muted} ${s.small}`}>{t('ord.payment')}: {t('mkt.cod')}</div>
              {o.deliveryStatus === 'rejected'
                ? <Alert tone="danger" title={t('ord.rejected')}>{o.rejectReason || ''}</Alert>
                : <Tracker status={o.deliveryStatus} />}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
