import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, Store } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Loading, Modal, PageHeader, Select, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { districtLabel } from '../../data/punjab';
import { fmtDate, fmtMoney } from '../../utils/format';
import s from '../pages.module.css';

export default function Marketplace() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useAsync(async () => {
    const [products, categories, rx, farms] = await Promise.all([api.listProducts(), api.listCategories(), api.listPrescriptions(), api.listFarms()]);
    return { products, categories, rx, farms };
  }, []);
  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState('');
  const [order, setOrder] = useState(null);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('');
  const [rxId, setRxId] = useState('');
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => (data?.products || []).filter((p) => (!cat || p.categoryId === cat) && (!q.trim() || `${p.medicineName} ${p.storeName} ${p.description}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, q, cat]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { categories, rx, farms } = data;
  const catName = (c) => (lang === 'ur' && c?.nameUr ? c.nameUr : c?.name || '');
  const prodCat = (p) => (lang === 'ur' && p.categoryUr ? p.categoryUr : p.category);

  const open = (p) => {
    setOrder(p); setQty(1); setRxId(''); setErrs({});
    setAddress(farms[0]?.address || '');
  };
  const place = async () => {
    const e = {};
    if (!address.trim()) e.address = t('val.required');
    if (!(qty >= 1 && qty <= order.stock)) e.qty = t('mkt.qtyError', { max: order.stock });
    if (order.requiresPrescription && !rxId) e.rx = t('err.prescription_required');
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.placeOrder({ storeId: order.storeId, items: [{ productId: order.productId, medicineName: order.medicineName, quantity: Number(qty) }], deliveryAddress: address.trim(), paymentMethod: 'cod', prescriptionId: rxId || null });
      toast(t('mkt.placed')); setOrder(null); navigate('/farmer/orders');
    } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.marketplace')} subtitle={t('mkt.sub')} />
      <div className={s.filters}>
        <Field label={t('common.search')} htmlFor="q"><Input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mkt.searchPh')} /></Field>
        <Field label={t('mkt.category')} htmlFor="cat"><Select id="cat" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">{t('common.all')}</option>{categories.map((c) => <option key={c._id} value={c._id}>{catName(c)}</option>)}</Select></Field>
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState icon={Search} title={t('mkt.emptyTitle')} text={t('mkt.emptyText')} /></Card>
      ) : (
        <div className={`${s.grid} ${s.auto}`}>
          {shown.map((p) => (
            <Card key={p.productId} className={s.productCard}>
              <div className={s.row} style={{ gap: '0.4rem' }}>
                <Badge tone="green">{prodCat(p)}</Badge>
                {p.requiresPrescription && <Badge tone="wheat">{t('mkt.rxNeeded')}</Badge>}
              </div>
              <h3 style={{ margin: 0 }}>{p.medicineName}</h3>
              <p className={s.muted} style={{ margin: 0, flex: 1 }}>{p.description}</p>
              <div className={`${s.row} ${s.small} ${s.muted}`}><Store size={15} aria-hidden="true" />{p.storeName} · {districtLabel(p.storeRegion, lang)}</div>
              <div className={`${s.row} ${s.between}`}>
                <span className={s.price}>{fmtMoney(p.price, lang)}</span>
                {p.stock > 0 ? <Badge tone="low">{t('mkt.inStock', { n: p.stock })}</Badge> : <Badge tone="high">{t('mkt.outOfStock')}</Badge>}
              </div>
              <Button block icon={ShoppingCart} disabled={p.stock === 0} onClick={() => open(p)}>{t('mkt.order')}</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!order} onClose={() => setOrder(null)} title={t('mkt.orderTitle')}
        footer={<><Button variant="ghost" onClick={() => setOrder(null)}>{t('common.cancel')}</Button><Button onClick={place} loading={busy}>{t('mkt.confirm')}</Button></>}>
        {order && (
          <>
            <h3 style={{ marginBottom: '0.2rem' }}>{order.medicineName}</h3>
            <p className={s.muted}>{order.storeName} · {fmtMoney(order.price, lang)}</p>
            <Field label={t('mkt.qty')} htmlFor="qty" error={errs.qty}><Input id="qty" type="number" min="1" max={order.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} invalid={!!errs.qty} /></Field>
            <Field label={t('mkt.address')} htmlFor="addr" required error={errs.address}><Textarea id="addr" value={address} onChange={(e) => setAddress(e.target.value)} invalid={!!errs.address} rows={3} /></Field>
            <Alert tone="info" title={t('mkt.cod')}>{t('mkt.codNote')}</Alert>
            {order.requiresPrescription && (
              rx.length === 0 ? (
                <Alert tone="warn" title={t('mkt.rxNeeded')}>{t('mkt.rxNone')} <Link to="/farmer/appointments">{t('appt.book')}</Link></Alert>
              ) : (
                <Field label={t('mkt.rxPick')} htmlFor="rx" required error={errs.rx} hint={t('mkt.rxHint')}>
                  <Select id="rx" value={rxId} onChange={(e) => setRxId(e.target.value)} invalid={!!errs.rx}>
                    <option value="">{t('common.choose')}</option>
                    {rx.map((p) => <option key={p._id} value={p._id}>{fmtDate(p.createdAt, lang)} · {p.doctorName} · {p.medicine.map((m) => m.name).join(', ')}</option>)}
                  </Select>
                </Field>
              )
            )}
            <div className={`${s.row} ${s.between}`} style={{ borderTop: '1px solid var(--line-soft)', paddingTop: '0.75rem' }}>
              <strong>{t('mkt.total')}</strong><span className={s.price}>{fmtMoney(order.price * (Number(qty) || 0), lang)}</span>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
