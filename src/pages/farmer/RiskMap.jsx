import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { RefreshCw } from 'lucide-react';
import { Alert, Button, Card, ErrorState, Field, Loading, PageHeader, RiskBadge, Select } from '../../components/ui';
import { DISTRICTS, PUNJAB_CENTER, districtById, districtLabel } from '../../data/punjab';
import { DISEASE_IDS } from '../../data/diseases';
import { fmtDateTime, fmtPercent } from '../../utils/format';
import { climateLabel, diseaseName } from '../../utils/labels';
import s from '../pages.module.css';
import m from './map.module.css';

const COLOR = { Low: '#3e8e5a', Medium: '#e39b25', High: '#c23b2e' };

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 8), { duration: 0.8 }); }, [target, map]);
  return null;
}

export default function RiskMap() {
  const { user } = useAuth();
  const { t, lang, pick } = useI18n();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [risk, farms, diseases] = await Promise.all([api.listRisk({}), api.listFarms(), api.listDiseases()]);
    return { risk, farms, diseases };
  }, []);
  const [disease, setDisease] = useState('FMD');
  const [region, setRegion] = useState('');

  const refresh = async () => {
    try { const risk = await api.listRisk({}); setData((d) => (d ? { ...d, risk } : d)); } catch { /* keep showing the last data */ }
  };
  useEffect(() => {
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data && !region) setRegion(data.farms[0]?.region || user.location?.region || 'Lahore');
  }, [data, region, user]);

  const byKey = useMemo(() => {
    const k = {};
    (data?.risk || []).forEach((r) => { k[`${r.region}|${r.disease}`] = r; });
    return k;
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { diseases } = data;
  const target = districtById(region);
  const regional = DISEASE_IDS.map((d) => byKey[`${region}|${d}`]).filter(Boolean);
  const current = byKey[`${region}|${disease}`];
  const worst = regional.some((r) => r.riskLevel === 'High') ? 'High' : regional.some((r) => r.riskLevel === 'Medium') ? 'Medium' : 'Low';

  return (
    <>
      <PageHeader title={t('nav.riskMap')} subtitle={t('map.sub')} actions={<Button variant="secondary" icon={RefreshCw} onClick={refresh}>{t('map.refresh')}</Button>} />
      <div className={s.filters}>
        <Field label={t('map.location')} htmlFor="loc"><Select id="loc" value={region} onChange={(e) => setRegion(e.target.value)}>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{lang === 'ur' ? d.ur : d.en}</option>)}</Select></Field>
        <Field label={t('map.disease')} htmlFor="dis"><Select id="dis" value={disease} onChange={(e) => setDisease(e.target.value)}>{DISEASE_IDS.map((d) => <option key={d} value={d}>{diseaseName(pick, diseases, d)}</option>)}</Select></Field>
      </div>

      <div className={m.layout}>
        <div>
          <div className={m.mapBox}>
            <MapContainer center={PUNJAB_CENTER} zoom={7} minZoom={6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FlyTo target={target} />
              {DISTRICTS.map((d) => {
                const r = byKey[`${d.id}|${disease}`];
                if (!r) return null;
                const sel = d.id === region;
                return (
                  <CircleMarker
                    key={d.id} center={[d.lat, d.lng]} radius={sel ? 15 : 11}
                    pathOptions={{ color: sel ? '#17261f' : '#ffffff', weight: sel ? 3 : 1.5, fillColor: COLOR[r.riskLevel], fillOpacity: 0.85 }}
                    eventHandlers={{ click: () => setRegion(d.id) }}
                  >
                    <Tooltip>{lang === 'ur' ? d.ur : d.en}: {t(`risk.${r.riskLevel}`)}</Tooltip>
                    <Popup>
                      <div className={m.popup}>
                        <strong>{lang === 'ur' ? d.ur : d.en}</strong><br />
                        {diseaseName(pick, diseases, disease)}: <strong style={{ color: COLOR[r.riskLevel] }}>{t(`risk.${r.riskLevel}`)}</strong><br />
                        {climateLabel(t, r.climate)}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <div className={m.legend} aria-label={t('map.legend')}>
            {['Low', 'Medium', 'High'].map((l) => <span key={l}><i className={m.swatch} style={{ background: COLOR[l] }} />{t(`risk.${l}`)}</span>)}
          </div>
        </div>

        <Card className={m.panel}>
          <h3>{districtLabel(region, lang)}</h3>
          {regional.some((r) => r.isStale) && <Alert tone="warn">{t('map.stale')}</Alert>}
          {current && <p className={`${s.muted} ${s.small}`}>{t('map.climate')}: {climateLabel(t, current.climate)} · {t('map.updated')} {fmtDateTime(current.predictedAt, lang)}</p>}
          <ul className={s.list}>
            {regional.map((r) => (
              <li key={r.disease} className={s.listItem}><span className={r.disease === disease ? s.strong : ''}>{diseaseName(pick, diseases, r.disease)}</span><span className={s.row} style={{ gap: '0.5rem' }}><span className={`${s.muted} ${s.small}`} title={t('map.probability')}>{fmtPercent(r.probability)}</span><RiskBadge level={r.riskLevel} /></span></li>
            ))}
          </ul>
          <div className={`${m.advice} ${m[`advice${worst}`]}`}>
            <strong>{t(`map.advice.${worst}.t`)}</strong>
            <div>{t(`map.advice.${worst}.d`)}</div>
          </div>
          <div className={s.row} style={{ marginTop: '1rem' }}>
            <Link to="/farmer/appointments"><Button size="sm">{t('appt.book')}</Button></Link>
            <Link to="/farmer/chatbot"><Button size="sm" variant="secondary">{t('nav.chatbot')}</Button></Link>
          </div>
          <div style={{ marginTop: '1rem' }}><Alert tone="info"><span style={{ fontSize: '0.88rem' }}>{t('map.disclaimer')}</span></Alert></div>
        </Card>
      </div>
    </>
  );
}
