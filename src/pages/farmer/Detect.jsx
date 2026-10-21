import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ImageUp, MessageCircle, ScanSearch, TriangleAlert } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Loading, PageHeader, Select } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { districtLabel } from '../../data/punjab';
import { fmtPercent } from '../../utils/format';
import s from '../pages.module.css';
import d from './detect.module.css';

const OK_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX = 10 * 1024 * 1024;

export default function Detect() {
  const { t, lang, pick } = useI18n();
  const onError = useApiError();
  const loc = useLocation();
  const input = useRef(null);
  const { data, loading, error, reload } = useAsync(async () => {
    const [farms, animals, diseases] = await Promise.all([api.listFarms(), api.listAnimals(), api.listDiseases()]);
    return { farms, animals, diseases };
  }, []);
  const [farmId, setFarmId] = useState(loc.state?.farmId || '');
  const [animalId, setAnimalId] = useState(loc.state?.animalId || '');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [vets, setVets] = useState([]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { if (data && !farmId && data.farms[0]) setFarmId(data.farms[0]._id); }, [data, farmId]);
  useEffect(() => {
    if (!data || !farmId) return;
    const list = data.animals.filter((a) => a.farmId === farmId);
    if (!list.some((a) => a._id === animalId)) setAnimalId(list[0]?._id || '');
  }, [data, farmId, animalId]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { farms, animals, diseases } = data;
  const farmAnimals = animals.filter((a) => a.farmId === farmId);

  if (farms.length === 0) {
    return (
      <>
        <PageHeader title={t('nav.detect')} />
        <Card><EmptyState icon={ScanSearch} title={t('det.needFarmTitle')} text={t('det.needFarmText')} action={<Link to="/farmer/farm"><Button>{t('farm.add')}</Button></Link>} /></Card>
      </>
    );
  }

  const farm = farms.find((f) => f._id === farmId);

  const choose = (f) => {
    setResult(null);
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) { setFileError(t('det.badType')); setFile(null); return; }
    if (f.size > MAX) { setFileError(t('det.tooBig')); setFile(null); return; }
    setFileError(''); setFile(f);
  };

  const analyze = async () => {
    if (!animalId) { setFileError(t('det.needAnimalTitle')); return; }
    if (!file) { setFileError(t('det.noFile')); return; }
    setBusy(true); setResult(null);
    try {
      const res = await api.detectDisease(farmId, animalId, file);
      setResult(res);
      if (res.outOfScope) setVets((await api.listVets(farm?.region)).slice(0, 3));
    } catch (err) { onError(err); }
    setBusy(false);
  };

  const info = result && !result.outOfScope ? diseases.find((x) => x.id === result.diagnosis.disease) : null;
  const conf = result?.diagnosis?.confidenceScore;

  return (
    <>
      <PageHeader title={t('nav.detect')} subtitle={t('det.sub')} />
      <Alert tone="info">{t('det.disclaimer')}</Alert>

      <Card>
        <div className={s.row} style={{ alignItems: 'flex-start' }}>
          <Field label={t('det.chooseFarm')} htmlFor="farm">
            <Select id="farm" value={farmId} onChange={(e) => { setFarmId(e.target.value); setResult(null); }}>
              {farms.map((f) => <option key={f._id} value={f._id}>{districtLabel(f.region, lang)} · {t(`species.${f.species}`)}</option>)}
            </Select>
          </Field>
          <Field label={t('animal.choose')} htmlFor="animal">
            <Select id="animal" value={animalId} onChange={(e) => { setAnimalId(e.target.value); setResult(null); }} disabled={farmAnimals.length === 0}>
              {farmAnimals.map((a) => <option key={a._id} value={a._id}>{a.animalTag} · {t(`breed.${a.breed}`)}</option>)}
            </Select>
          </Field>
        </div>
        {farmAnimals.length === 0 && (
          <Alert tone="warn" title={t('det.needAnimalTitle')}>{t('det.needAnimalText')} <Link to="/farmer/animals" state={{ farmId }}>{t('animal.add')}</Link></Alert>
        )}

        <div
          className={`${d.drop} ${over ? d.dropOn : ''}`}
          role="button" tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); choose(e.dataTransfer.files?.[0]); }}
        >
          <ImageUp size={34} color="var(--green-700)" aria-hidden="true" />
          <p className={s.strong} style={{ color: 'var(--ink)' }}>{t('det.drop')}</p>
          <p>{t('det.formats')}</p>
          <input ref={input} className={d.hidden} type="file" accept="image/png,image/jpeg" tabIndex={-1} onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {fileError && <p role="alert" style={{ color: 'var(--risk-high)', fontWeight: 600 }}>{fileError}</p>}

        {file && (
          <div className={d.preview} style={{ marginTop: '1rem' }}>
            <img src={previewUrl} alt={t('det.previewAlt')} />
            <div>
              <div className={s.strong}>{file.name}</div>
              <div className={`${s.muted} ${s.small}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              <div className={s.row} style={{ marginTop: '0.6rem' }}>
                <Button onClick={analyze} loading={busy} icon={ScanSearch}>{t('det.analyze')}</Button>
                <Button variant="ghost" onClick={() => { setFile(null); setResult(null); }}>{t('common.remove')}</Button>
              </div>
            </div>
          </div>
        )}
        {busy && <div className={d.analyzing} style={{ marginTop: '1rem' }} role="status"><span className="sr-only">{t('common.loading')}</span>{t('det.analyzing')}</div>}
      </Card>

      {result?.outOfScope && (
        <div style={{ marginTop: '1.25rem' }}>
          <Card title={t('det.noMatchTitle')}>
            <Alert tone="warn" title={t(`det.reason.${result.reason}`)}>{t('det.noMatchText')}</Alert>
            <h4>{t('det.suggestedVets')}</h4>
            {vets.map((v) => (
              <div key={v._id} className={d.vetRow}>
                <div><div className={s.strong}>{v.name}</div><div className={`${s.muted} ${s.small}`}>{v.specialty} · {districtLabel(v.location?.region, lang)}{v.distanceKm != null ? ` · ${v.distanceKm} km` : ''}</div></div>
                <Link to="/farmer/appointments" state={{ vetId: v._id, farmId, animalId }}><Button size="sm">{t('appt.book')}</Button></Link>
              </div>
            ))}
          </Card>
        </div>
      )}

      {info && (
        <div style={{ marginTop: '1.25rem' }}>
          <Card>
            <div className={d.resultHead}>
              <div>
                <div className={`${s.muted} ${s.small}`}>{t('det.result')} · <span dir="ltr">{animals.find((a) => a._id === animalId)?.animalTag}</span></div>
                <h2 className={d.name}>{pick(info.name)}</h2>
                <div className={s.row} style={{ marginTop: '0.4rem' }}>
                  {info.kind === 'healthy' ? <Badge tone="low"><CheckCircle2 size={14} /> {t('det.healthyBadge')}</Badge> : <Badge tone="wheat"><TriangleAlert size={14} /> {t('det.possible')}</Badge>}
                  {result.demo && <Badge tone="water">{t('det.demo')}</Badge>}
                </div>
              </div>
              <div className={d.confWrap}>
                <div className={d.confLabel}><span>{t('det.confidence')}</span><span>{fmtPercent(conf)}</span></div>
                <div className={`${d.bar} ${conf < 0.7 ? d.barWarn : ''}`}><i style={{ width: fmtPercent(conf) }} /></div>
              </div>
            </div>
            <p>{pick(info.description)}</p>
            <div className={d.cols}>
              {info.kind !== 'healthy' && <div><h4>{t('det.symptoms')}</h4><ul className={s.bullets}>{pick(info.symptoms).map((x) => <li key={x}>{x}</li>)}</ul></div>}
              <div><h4>{t('det.prevention')}</h4><ul className={s.bullets}>{pick(info.prevention).map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
            <h4>{t('det.treatment')}</h4>
            <p>{pick(info.treatment)}</p>
            <Alert tone="warn">{t('det.vetAdvice')}</Alert>
            <div className={s.row}>
              {info.kind !== 'healthy' && <Link to="/farmer/appointments" state={{ farmId, animalId, healthRecordId: result._id }}><Button>{t('appt.book')}</Button></Link>}
              <Link to="/farmer/chatbot"><Button variant="secondary" icon={MessageCircle}>{t('det.askBot')}</Button></Link>
              <Link to="/farmer/records"><Button variant="ghost">{t('nav.records')}</Button></Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
