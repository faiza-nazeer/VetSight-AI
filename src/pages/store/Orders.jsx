import { useMemo, useState } from 'react';
import { PackageOpen } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Button, Card, EmptyState, ErrorState, Field, Loading, Modal, PageHeader, Segmented, StatusBadge, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { fmtDateTime, fmtMoney } from '../../utils/format';
import { Tracker } from '../farmer/Orders';
import s from '../pages.module.css';

const FILTERS = ['ordered', 'inprogress', 'delivered', 'all'];
const NEXT = { accepted: ['processing', 'processing'], processing: ['out-for-delivery', 'out-for-delivery'], 'out-for-delivery': ['delivered', 'delivered'] };

export default function StoreOrders() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(() => api.listOrders(), []);
  const [filter, setFilter] = useState('ordered');
  const [rej, setRej] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (data || []).filter((o) => filter === 'all' || (filter === 'ordered' && o.deliveryStatus === 'ordered') || (filter === 'inprogress' && ['accepted', 'processing', 'out-for-delivery'].includes(o.deliveryStatus)) || (filter === 'delivered' && ['delivered', 'rejected'].includes(o.deliveryStatus))), [data, filter]);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const act = async (id, action, extra = {}) => {
    setBusy(true);
    try { await api.updateOrder(id, { action, ...extra }); toast(t('store.updated')); setRej(null); setReason(''); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.orders')} subtitle={t('store.ordersSub')} />
      <div style={{ marginBottom: '1rem' }}>
        <Segmented value={filter} onChange={setFilter} label={t('nav.orders')} options={FILTERS.map((f) => ({ value: f, label: f === 'all' ? t('common.all') : t(`store.f.${f}`) }))} />
      </div>
      {rows.length === 0 ? <Card><EmptyState icon={PackageOpen} title={t('store.noOrders')} /></Card> : (
        <div className={s.stack}>
          {rows.map((o) => (
            <Card key={o._id}>
              <div className={`${s.row} ${s.between}`}>
                <div><h3 style={{ margin: 0 }}>{o.farmerName}</h3><div className={`${s.muted} ${s.small}`}>{fmtDateTime(o.orderedAt, lang)}</div></div>
                <StatusBadge status={o.deliveryStatus} />
              </div>
              <ul className={s.list} style={{ marginTop: '0.5rem' }}>
                {o.items.map((it) => <li key={it.productId || it.medicineName} className={s.listItem}><span>{it.medicineName} × {it.quantity}</span><span>{fmtMoney(it.price * it.quantity, lang)}</span></li>)}
              </ul>
              <dl className={s.kv}>
                <dt>{t('mkt.address')}</dt><dd>{o.deliveryAddress}</dd>
                <dt>{t('mkt.total')}</dt><dd>{fmtMoney(o.totalAmount, lang)}</dd>
                <dt>{t('ord.payment')}</dt><dd>{t('mkt.cod')}</dd>
                <dt>{t('store.prescription')}</dt><dd>{o.prescriptionId ? t('common.yes') : t('common.no')}</dd>
              </dl>
              {o.deliveryStatus === 'rejected' ? <Alert tone="danger" title={t('ord.rejected')}>{o.rejectReason}</Alert> : <Tracker status={o.deliveryStatus} />}
              <div className={s.row} style={{ marginTop: '1rem' }}>
                {o.deliveryStatus === 'ordered' && <><Button onClick={() => act(o._id, 'accept')} loading={busy}>{t('store.accept')}</Button><Button variant="danger" onClick={() => { setRej(o); setReason(''); }}>{t('store.reject')}</Button></>}
                {NEXT[o.deliveryStatus] && <Button onClick={() => act(o._id, NEXT[o.deliveryStatus][0])} loading={busy}>{t(`store.mark.${NEXT[o.deliveryStatus][1]}`)}</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!rej} onClose={() => setRej(null)} title={t('store.rejectTitle')}
        footer={<><Button variant="ghost" onClick={() => setRej(null)}>{t('common.cancel')}</Button><Button variant="danger" loading={busy} disabled={!reason.trim()} onClick={() => act(rej._id, 'reject', { reason: reason.trim() })}>{t('store.reject')}</Button></>}>
        <Field label={t('store.reason')} htmlFor="rr" required><Textarea id="rr" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </>
  );
}
