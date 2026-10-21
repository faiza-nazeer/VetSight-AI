import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EmptyState } from '../components/ui';
import { Button } from '../components/ui';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <EmptyState icon={Compass} title={t('nf.title')} text={t('nf.text')} action={<Link to="/"><Button>{t('nf.home')}</Button></Link>} />
    </div>
  );
}
