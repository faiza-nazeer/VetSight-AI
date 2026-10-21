import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { Button, Card, EmptyState, Field, PageHeader, Textarea } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import s from '../pages.module.css';

export default function Feedback() {
  const { t } = useI18n();
  const onError = useApiError();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const er = {};
    if (!rating) er.rating = t('fb.pickRating');
    if (message.trim().length < 5) er.message = t('fb.messageShort');
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await api.sendFeedback({ rating, message: message.trim() }); setDone(true); } catch (err) { onError(err); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title={t('nav.feedback')} subtitle={t('fb.sub')} />
      <div style={{ maxWidth: 640 }}>
        <Card>
          {done ? (
            <EmptyState icon={ThumbsUp} title={t('fb.thanksTitle')} text={t('fb.thanksText')} action={<Button variant="secondary" onClick={() => { setDone(false); setRating(0); setMessage(''); }}>{t('fb.another')}</Button>} />
          ) : (
            <form onSubmit={send} noValidate>
              <Field label={t('fb.rating')} error={errs.rating}>
                <div className={s.row} role="radiogroup" aria-label={t('fb.rating')} style={{ gap: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                      <Star size={32} color="var(--wheat-600)" fill={n <= rating ? 'var(--wheat-500)' : 'none'} />
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t('fb.message')} htmlFor="msg" error={errs.message}><Textarea id="msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} invalid={!!errs.message} /></Field>
              <Button type="submit" loading={busy}>{t('fb.send')}</Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
