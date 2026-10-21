import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import Brand from './Brand';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';
import { NAV, SHARED_NAV } from './nav';
import s from './layout.module.css';

export default function AppShell() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const items = NAV[user.role] || [];
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const link = (it) => (
    <NavLink key={it.to} to={it.to} className={({ isActive }) => `${s.navLink} ${isActive ? s.active : ''}`}>
      <it.icon size={20} aria-hidden="true" />
      <span>{t(`nav.${it.key}`)}</span>
    </NavLink>
  );

  return (
    <div className={s.shell}>
      <a href="#main" className={s.skip}>{t('common.skip')}</a>
      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ''}`} aria-label={t('common.menu')}>
        <div className={s.sideTop}>
          <Brand to="/" light />
          <button type="button" className={s.closeSide} onClick={() => setOpen(false)} aria-label={t('common.close')}><X size={22} /></button>
        </div>
        <nav className={s.nav}>
          {items.map(link)}
          <div className={s.navDivider} />
          {SHARED_NAV.map(link)}
        </nav>
        <div className={s.rows} aria-hidden="true" />
        <div className={s.userCard}>
          <span className={s.avatar} aria-hidden="true">{initials}</span>
          <div className={s.userMeta}>
            <strong>{user.name}</strong>
            <span>{t(`role.${user.role}`)}</span>
          </div>
        </div>
      </aside>
      {open && <div className={s.scrim} onClick={() => setOpen(false)} />}
      <div className={s.main}>
        <header className={s.topbar}>
          <button type="button" className={`${s.topBtn} ${s.burger}`} onClick={() => setOpen(true)} aria-label={t('common.menu')}><Menu size={22} /></button>
          <div className={s.spacer} />
          <LanguageToggle className={s.topBtn} />
          <NotificationBell />
          <button type="button" className={s.topBtn} onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={18} aria-hidden="true" /><span className={s.hideSm}>{t('auth.logout')}</span>
          </button>
        </header>
        <main id="main" className={s.content} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
