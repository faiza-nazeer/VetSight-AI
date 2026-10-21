import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Field, Input, Loading, Modal, PageHeader, Select, StatusBadge, Table, Textarea, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { fmtMoney } from '../../utils/format';
import s from '../pages.module.css';

const EMPTY = { storeId: '', medicineName: '', categoryId: '', description: '', price: '', stock: '', requiresPrescription: false, isActive: true };

export default function AdminMarketplace() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(async () => {
    const [products, categories, users] = await Promise.all([api.adminListProducts(), api.listCategories(), api.adminUsers()]);
    return { products, categories, stores: users.filter((u) => u.role === 'store') };
  }, []);
  const [form, setForm] = useState(null);
  const [cat, setCat] = useState(null);
  const [errs, setErrs] = useState({});
  const [del, setDel] = useState(null);
  const [delCat, setDelCat] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { products, categories, stores } = data;
  const activeStores = stores.filter((x) => x.status === 'active');
  const catName = (c) => (lang === 'ur' && c.nameUr ? c.nameUr : c.name);
  const up = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const open = (p) => { setErrs({}); setForm(p ? { ...p } : { ...EMPTY, storeId: activeStores[0]?._id || '', categoryId: categories[0]?._id || '' }); };

  const save = async () => {
    const e = {};
    if (!form.storeId) e.storeId = t('val.required');
    if (!form.medicineName.trim()) e.medicineName = t('val.required');
    if (!form.categoryId) e.categoryId = t('val.required');
    if (form.price === '' || Number(form.price) < 0) e.price = t('val.number');
    if (form.stock === '' || Number(form.stock) < 0) e.stock = t('val.number');
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try { await api.adminSaveProduct({ ...form, price: Number(form.price), stock: Number(form.stock) }); toast(t('admin.productSaved')); setForm(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try { await api.adminDeleteProduct(del.productId); toast(t('admin.productDeleted')); setDel(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const toggleActive = async (p) => {
    try { await api.adminSaveProduct({ ...p, isActive: !p.isActive }); toast(t('admin.listingToggled')); reload(); } catch (err) { onError(err); }
  };
  const toggleStore = async (st) => {
    try { await api.adminSetUserStatus(st._id, st.status === 'active' ? 'blocked' : 'active'); toast(t('admin.storeUpdated')); reload(); } catch (err) { onError(err); }
  };
  const saveCat = async () => {
    if (!cat.name.trim()) { setErrs({ catName: t('val.required') }); return; }
    setBusy(true);
    try { await api.adminSaveCategory(cat); toast(t('admin.categorySaved')); setCat(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const removeCat = async () => {
    setBusy(true);
    try { await api.adminDeleteCategory(delCat._id); toast(t('admin.categoryDeleted')); setDelCat(null); reload(); } catch (err) { onError(err); setDelCat(null); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.marketplaceAdmin')} subtitle={t('admin.marketSub')} actions={<Button icon={Plus} onClick={() => open(null)} disabled={!activeStores.length || !categories.length}>{t('admin.addProduct')}</Button>} />

      <div className={`${s.grid} ${s.cols2}`} style={{ marginBottom: '1.25rem' }}>
        <Card title={t('admin.stores')} pad={false}>
          {stores.length === 0 ? <EmptyState title={t('admin.noStores')} /> : (
            <ul className={s.list} style={{ padding: '0 1.25rem' }}>
              {stores.map((st) => (
                <li key={st._id} className={s.listItem}>
                  <div><div className={s.strong}>{st.name}</div><div className={`${s.muted} ${s.small}`}>{st.address || st.email}</div></div>
                  <div className={s.row}>
                    <StatusBadge status={st.status} />
                    {['active', 'blocked'].includes(st.status) && <Button size="sm" variant="secondary" onClick={() => toggleStore(st)}>{st.status === 'active' ? t('admin.suspend') : t('admin.activate')}</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t('admin.categories')} pad={false} actions={<Button size="sm" icon={Plus} onClick={() => { setErrs({}); setCat({ name: '', nameUr: '' }); }}>{t('admin.addCategory')}</Button>}>
          {categories.length === 0 ? <EmptyState title={t('admin.noCategories')} /> : (
            <ul className={s.list} style={{ padding: '0 1.25rem' }}>
              {categories.map((c) => (
                <li key={c._id} className={s.listItem}>
                  <span className={s.strong}>{catName(c)}</span>
                  <div className={s.row} style={{ gap: '0.4rem' }}>
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => { setErrs({}); setCat({ ...c }); }}>{t('common.edit')}</Button>
                    <Button size="sm" variant="ghost" icon={Trash2} aria-label={t('common.delete')} onClick={() => setDelCat(c)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={t('admin.listings')} pad={false}>
        {products.length === 0 ? <EmptyState title={t('mkt.emptyTitle')} /> : (
          <Table>
            <thead><tr><th>{t('mkt.product')}</th><th>{t('admin.store')}</th><th>{t('mkt.category')}</th><th>{t('mkt.price')}</th><th>{t('mkt.stock')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} style={{ opacity: p.isActive ? 1 : 0.6 }}>
                  <td><div className={s.strong}>{p.medicineName}</div>{p.requiresPrescription && <Badge tone="wheat">{t('mkt.rxNeeded')}</Badge>}</td>
                  <td>{p.storeName}</td>
                  <td>{lang === 'ur' && p.categoryUr ? p.categoryUr : p.category}</td>
                  <td>{fmtMoney(p.price, lang)}</td>
                  <td>{p.stock}</td>
                  <td><Badge tone={p.isActive ? 'green' : 'neutral'}>{p.isActive ? t('admin.listingActive') : t('admin.listingHidden')}</Badge></td>
                  <td>
                    <div className={s.row} style={{ gap: '0.4rem' }}>
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(p)}>{t('common.edit')}</Button>
                      <Button size="sm" variant="ghost" icon={p.isActive ? EyeOff : Eye} aria-label={p.isActive ? t('admin.deactivate') : t('admin.activate')} title={p.isActive ? t('admin.deactivate') : t('admin.activate')} onClick={() => toggleActive(p)} />
                      <Button size="sm" variant="ghost" icon={Trash2} aria-label={t('common.delete')} onClick={() => setDel(p)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.productId ? t('admin.editProduct') : t('admin.addProduct')}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Button><Button onClick={save} loading={busy}>{t('common.save')}</Button></>}>
        {form && (
          <>
            <Field label={t('admin.store')} htmlFor="ps" required error={errs.storeId}><Select id="ps" value={form.storeId} onChange={up('storeId')} invalid={!!errs.storeId}>{(form.productId ? stores : activeStores).map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</Select></Field>
            <Field label={t('mkt.product')} htmlFor="pn" required error={errs.medicineName}><Input id="pn" value={form.medicineName} onChange={up('medicineName')} invalid={!!errs.medicineName} /></Field>
            <Field label={t('mkt.category')} htmlFor="pc" required error={errs.categoryId}><Select id="pc" value={form.categoryId} onChange={up('categoryId')} invalid={!!errs.categoryId}>{categories.map((c) => <option key={c._id} value={c._id}>{catName(c)}</option>)}</Select></Field>
            <Field label={t('admin.description')} htmlFor="pd"><Textarea id="pd" rows={2} value={form.description} onChange={up('description')} /></Field>
            <div className={s.row} style={{ alignItems: 'flex-start' }}>
              <Field label={t('mkt.price')} htmlFor="pp" required error={errs.price}><Input id="pp" type="number" min="0" value={form.price} onChange={up('price')} invalid={!!errs.price} /></Field>
              <Field label={t('mkt.stock')} htmlFor="pk" required error={errs.stock}><Input id="pk" type="number" min="0" value={form.stock} onChange={up('stock')} invalid={!!errs.stock} /></Field>
            </div>
            <Checkbox id="prx" checked={form.requiresPrescription} onChange={up('requiresPrescription')}>{t('admin.requiresRx')}</Checkbox>
            <div style={{ height: '0.5rem' }} />
            <Checkbox id="pact" checked={form.isActive !== false} onChange={up('isActive')}>{t('admin.listingActive')}</Checkbox>
          </>
        )}
      </Modal>

      <Modal open={!!cat} onClose={() => setCat(null)} title={cat?._id ? t('admin.editCategory') : t('admin.addCategory')}
        footer={<><Button variant="ghost" onClick={() => setCat(null)}>{t('common.cancel')}</Button><Button onClick={saveCat} loading={busy}>{t('common.save')}</Button></>}>
        {cat && (
          <>
            <Field label={t('admin.categoryName')} htmlFor="cn" required error={errs.catName}><Input id="cn" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} invalid={!!errs.catName} /></Field>
            <Field label={t('admin.categoryNameUr')} htmlFor="cu"><Input id="cu" dir="rtl" lang="ur" value={cat.nameUr || ''} onChange={(e) => setCat({ ...cat, nameUr: e.target.value })} /></Field>
          </>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title={t('admin.deleteProduct')}
        footer={<><Button variant="ghost" onClick={() => setDel(null)}>{t('common.cancel')}</Button><Button variant="danger" loading={busy} onClick={remove}>{t('common.delete')}</Button></>}>
        <p>{t('admin.deleteProductText', { name: del?.medicineName || '' })}</p>
      </Modal>
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title={t('admin.deleteCategory')}
        footer={<><Button variant="ghost" onClick={() => setDelCat(null)}>{t('common.cancel')}</Button><Button variant="danger" loading={busy} onClick={removeCat}>{t('common.delete')}</Button></>}>
        <p>{t('admin.deleteCategoryText', { name: delCat?.name || '' })}</p>
      </Modal>
    </>
  );
}
