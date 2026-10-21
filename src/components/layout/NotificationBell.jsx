import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { fmtDateTime } from '../../utils/format';
import s from './layout.module.css';

export default function NotificationBell() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const loc = useLocation();

  const load = useCallback(() => api.listNotifications().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load, loc.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const unread = items.filter((n) => !n.isRead).length;
  const read = async (n) => { if (!n.isRead) { await api.markNotificationRead(n._id).catch(() => {}); load(); } };

  return (
    <div className={s.bellWrap} ref={box}>
      <button type="button" className={s.topBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`${t('nav.notifications')}${unread ? ` (${unread})` : ''}`}>
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className={s.badgeDot}>{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className={s.bellPanel} role="region" aria-label={t('nav.notifications')}>
          <div className={s.bellHead}>{t('nav.notifications')}</div>
          {items.length === 0 && <div className={s.bellEmpty}>{t('notif.empty')}</div>}
          <ul className={s.bellList}>
            {items.slice(0, 5).map((n) => (
              <li key={n._id}>
                <button type="button" className={`${s.bellItem} ${n.isRead ? '' : s.unread}`} onClick={() => read(n)}>
                  <span>{n.message}</span>
                  <time>{fmtDateTime(n.createdAt, lang)}</time>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/notifications" className={s.bellAll} onClick={() => setOpen(false)}>{t('notif.viewAll')}</Link>
        </div>
      )}
    </div>
  );
}
