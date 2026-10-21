import { MessageSquareHeart } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Button, Card, EmptyState, ErrorState, Loading, PageHeader, StatusBadge, Table, useToast } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { fmtDate } from '../../utils/format';
import s from '../pages.module.css';
import a from './admin.module.css';

export default function AdminFeedback() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const onError = useApiError();
  const { data, loading, error, reload } = useAsync(() => api.adminListFeedback(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const resolve = async (f) => {
    try { await api.adminUpdateFeedback(f._id, f.status === 'resolved' ? 'new' : 'resolved'); toast(t('admin.feedbackUpdated')); reload(); } catch (err) { onError(err); }
  };
  return (
    <>
      <PageHeader title={t('nav.feedbackAdmin')} subtitle={t('admin.feedbackSub')} />
      <Card pad={false}>
        {data.length === 0 ? <EmptyState icon={MessageSquareHeart} title={t('admin.noFeedback')} /> : (
          <Table>
            <thead><tr><th>{t('admin.from')}</th><th>{t('fb.rating')}</th><th>{t('fb.message')}</th><th>{t('rec.date')}</th><th>{t('common.status')}</th><th /></tr></thead>
            <tbody>
              {data.map((f) => (
                <tr key={f._id}>
                  <td className={s.strong}>{f.userName}</td>
                  <td><span className={a.stars} aria-label={`${f.rating}/5`}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span></td>
                  <td style={{ minWidth: 240 }}>{f.message}</td>
                  <td>{fmtDate(f.createdAt, lang)}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td><Button size="sm" variant="secondary" onClick={() => resolve(f)}>{f.status === 'resolved' ? t('admin.reopen') : t('admin.markResolved')}</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
