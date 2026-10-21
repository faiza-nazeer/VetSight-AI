import { Pill } from 'lucide-react';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Card, EmptyState, ErrorState, Loading, PageHeader, Table } from '../../components/ui';
import { fmtMoney } from '../../utils/format';

export default function StoreProducts() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => (await api.listProducts()).filter((p) => p.storeId === user._id), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title={t('nav.products')} subtitle={t('store.productsSub')} />
      <Alert tone="info">{t('store.adminManaged')}</Alert>
      <Card pad={false}>
        {data.length === 0 ? <EmptyState icon={Pill} title={t('store.noProducts')} /> : (
          <Table>
            <thead><tr><th>{t('mkt.product')}</th><th>{t('mkt.category')}</th><th>{t('mkt.price')}</th><th>{t('mkt.stock')}</th><th /></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.productId}>
                  <td><strong>{p.medicineName}</strong></td>
                  <td>{lang === 'ur' && p.categoryUr ? p.categoryUr : p.category}</td>
                  <td>{fmtMoney(p.price, lang)}</td>
                  <td>{p.stock <= 10 ? <Badge tone="high">{p.stock}</Badge> : p.stock}</td>
                  <td>{p.requiresPrescription && <Badge tone="wheat">{t('mkt.rxNeeded')}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
