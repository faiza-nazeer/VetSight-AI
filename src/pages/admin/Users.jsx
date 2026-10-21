import { useMemo, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Loading, Modal, PageHeader, Select, StatusBadge, Table, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { districtLabel } from '../../data/punjab';
import { fmtDate } from '../../utils/format';
import s from '../pages.module.css';

export default function AdminUsers() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(() => api.adminUsers(), []);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (data || []).filter((u) => (!role || u.role === role) && (!status || u.status === status) && (!q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, role, status, q]);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const setSt = async (u, st, msg) => {
    setBusy(true);
    try { await api.adminSetUserStatus(u._id, st); toast(msg); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try { await api.adminDeleteUser(del._id); toast(t('admin.deleted')); setDel(null); reload(); } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.users')} subtitle={t('admin.usersSub')} />
      <div className={s.filters}>
        <Field label={t('common.search')} htmlFor="uq"><Input id="uq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchPh')} /></Field>
        <Field label={t('auth.role')} htmlFor="ur"><Select id="ur" value={role} onChange={(e) => setRole(e.target.value)}><option value="">{t('common.all')}</option>{['farmer', 'vet', 'store', 'admin'].map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</Select></Field>
        <Field label={t('common.status')} htmlFor="us"><Select id="us" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{t('common.all')}</option>{['active', 'pending', 'blocked', 'rejected'].map((x) => <option key={x} value={x}>{t(`status.${x}`)}</option>)}</Select></Field>
      </div>
      <Card pad={false}>
        {rows.length === 0 ? <EmptyState title={t('admin.noUsers')} /> : (
          <Table>
            <thead><tr><th>{t('profile.name')}</th><th>{t('auth.role')}</th><th>{t('auth.region')}</th><th>{t('admin.joined')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id}>
                  <td><div className={s.strong}>{u.name}</div><div className={`${s.muted} ${s.small}`} dir="ltr" style={{ textAlign: 'start' }}>{u.email}</div></td>
                  <td><Badge tone="green">{t(`role.${u.role}`)}</Badge></td>
                  <td>{districtLabel(u.location?.region, lang)}</td>
                  <td>{fmtDate(u.createdAt, lang)}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    <div className={s.row} style={{ gap: '0.4rem' }}>
                      {u.status === 'pending' && <><Button size="sm" icon={Check} disabled={busy} onClick={() => setSt(u, 'active', t('admin.approved'))}>{t('admin.approve')}</Button><Button size="sm" variant="secondary" icon={X} disabled={busy} onClick={() => setSt(u, 'rejected', t('admin.rejectedMsg'))}>{t('admin.reject')}</Button></>}
                      {u.status === 'active' && u.role !== 'admin' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => setSt(u, 'blocked', t('admin.blockedMsg'))}>{t('admin.block')}</Button>}
                      {['blocked', 'rejected'].includes(u.status) && <Button size="sm" variant="secondary" disabled={busy} onClick={() => setSt(u, 'active', t('admin.activatedMsg'))}>{t('admin.activate')}</Button>}
                      {u.role !== 'admin' && <Button size="sm" variant="ghost" icon={Trash2} aria-label={t('common.delete')} onClick={() => setDel(u)} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Modal open={!!del} onClose={() => setDel(null)} title={t('admin.deleteTitle')}
        footer={<><Button variant="ghost" onClick={() => setDel(null)}>{t('common.cancel')}</Button><Button variant="danger" loading={busy} onClick={remove}>{t('common.delete')}</Button></>}>
        <p>{t('admin.deleteText', { name: del?.name || '' })}</p>
      </Modal>
    </>
  );
}
