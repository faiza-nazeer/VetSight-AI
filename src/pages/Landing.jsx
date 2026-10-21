import { Link } from 'react-router-dom';
import { Bell, CalendarCheck, Languages, Map, MessageCircle, ScanSearch, Store, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { Button } from '../components/ui';
import Brand from '../components/layout/Brand';
import { DISEASE_IDS } from '../data/diseases';
import s from './landing.module.css';

const FEATURES = [
  { k: 'detect', icon: ScanSearch },
  { k: 'chat', icon: MessageCircle },
  { k: 'map', icon: Map },
  { k: 'vet', icon: CalendarCheck },
  { k: 'shop', icon: Store },
  { k: 'alerts', icon: Bell },
];

export default function Landing() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className={s.page}>
      <header className={s.nav}>
        <Brand />
        <div className={s.grow} />
        <button type="button" className={s.langBtn} onClick={() => setLang(lang === 'en' ? 'ur' : 'en')} aria-label={t('lang.switch')}>
          <Languages size={18} aria-hidden="true" /><span lang={lang === 'en' ? 'ur' : 'en'}>{lang === 'en' ? 'اردو' : 'English'}</span>
        </button>
        <Link to="/login"><Button variant="ghost">{t('auth.login')}</Button></Link>
        <Link to="/register"><Button>{t('auth.register')}</Button></Link>
      </header>

      <section className={s.hero}>
        <div className={s.heroIn}>
          <div>
            <h1>{t('land.title')}</h1>
            <p className={s.lead}>{t('land.lead')}</p>
            <div className={s.ctas}>
              <Link to="/register"><Button variant="wheat" size="lg">{t('land.ctaPrimary')}</Button></Link>
              <Link to="/login"><Button variant="secondary" size="lg">{t('auth.login')}</Button></Link>
            </div>
            <p className={s.note}>{t('land.note')}</p>
            <div className={s.diseases} aria-label={t('land.diseasesLabel')}>
              {DISEASE_IDS.map((d) => <span key={d} className={s.disease}><i />{t(`disease.short.${d}`)}</span>)}
            </div>
          </div>

          <aside className={s.sample} aria-label={t('land.sample')}>
            <div className={s.sampleHead}><span>{t('land.sample')}</span><span>{t('land.sampleTag')}</span></div>
            <div className={s.sampleBody}>
              <div className={s.photo}><span>{t('land.samplePhoto')}</span></div>
              <div className={s.result}>
                <div><div style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{t('land.samplePossible')}</div><strong>{t('disease.short.LSD')}</strong></div>
                <span className={s.conf}>91%</span>
              </div>
              <div className={s.bar}><i /></div>
              <div className={s.sampleRows}>
                <div><span>{t('land.sampleRisk')}</span><strong style={{ color: 'var(--risk-high)' }}>{t('risk.High')}</strong></div>
                <div><span>{t('land.sampleVet')}</span><strong>Dr. Sana Malik</strong></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}><h2>{t('land.howTitle')}</h2></div>
        <ol className={s.steps}>
          {[1, 2, 3].map((n) => (
            <li key={n}><h3>{t(`land.step${n}Title`)}</h3><p>{t(`land.step${n}Text`)}</p></li>
          ))}
        </ol>
      </section>

      <div className={s.sectionAlt}>
        <section className={`${s.section} ${s.featureWrap}`}>
          <div>
            <h2>{t('land.featTitle')}</h2>
            <p style={{ color: 'var(--ink-2)' }}>{t('land.featText')}</p>
          </div>
          <ul className={s.features}>
            {FEATURES.map((f) => (
              <li key={f.k}>
                <span className={s.fIcon}><f.icon size={22} aria-hidden="true" /></span>
                <div><h3>{t(`land.f.${f.k}.t`)}</h3><p>{t(`land.f.${f.k}.d`)}</p></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={s.section}>
        <div className={s.sectionHead}><h2>{t('land.rolesTitle')}</h2></div>
        <div className={s.roles}>
          {['farmer', 'vet', 'store', 'admin'].map((r) => (
            <div key={r}><h3>{t(`role.${r}`)}</h3><p>{t(`land.r.${r}`)}</p></div>
          ))}
        </div>
      </section>

      <div className={s.cta}>
        <div className={s.ctaIn}>
          <div><h2>{t('land.ctaTitle')}</h2><p>{t('land.ctaText')}</p></div>
          <Link to="/register"><Button variant="wheat" size="lg">{t('land.ctaPrimary')} <ArrowRight size={18} className="flip-rtl" aria-hidden="true" /></Button></Link>
        </div>
      </div>
      <footer className={s.footer}>
        <p>{t('land.disclaimer')}</p>
        <p>{t('land.fyp')}</p>
      </footer>
    </div>
  );
}
