import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { useAsync } from '../../utils/useAsync';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Loading, Modal, PageHeader, Select, StatusBadge, Table } from '../../components/ui';
import { districtLabel } from '../../data/punjab';
import { fmtDate, fmtPercent } from '../../utils/format';
import { diseaseName } from '../../utils/labels';
import s from '../pages.module.css';

export default function Records() {
  const { t, lang, pick } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => {
    const [farms, animals, records, diseases] = await Promise.all([api.listFarms(), api.listAnimals(), api.listRecords(), api.listDiseases()]);
    return { farms, animals, records, diseases };
  }, []);
  const [farm, setFarm] = useState('');
  const [animal, setAnimal] = useState('');
  const [dis, setDis] = useState('');
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => (data ? data.records.filter((r) => (!farm || r.farmId === farm) && (!animal || r.animalId === animal) && (!dis || r.diagnosis.disease === dis)) : []), [data, farm, animal, dis]);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { farms, animals, diseases } = data;
  const animalOf = (id) => animals.find((x) => x._id === id);
  const animalLabel = (id) => { const x = animalOf(id); return x ? `${x.animalTag} · ${t(`breed.${x.breed}`)}` : '–'; };
  const farmName = (id) => { const f = farms.find((x) => x._id === id); return f ? districtLabel(f.region, lang) : ''; };
  const info = open ? diseases.find((x) => x.id === open.diagnosis.disease) : null;

  return (
    <>
      <PageHeader title={t('nav.records')} subtitle={t('rec.sub')} actions={<Link to="/farmer/detect"><Button>{t('nav.detect')}</Button></Link>} />
      <div className={s.filters}>
        <Field label={t('rec.farm')} htmlFor="ff"><Select id="ff" value={farm} onChange={(e) => { setFarm(e.target.value); setAnimal(''); }}><option value="">{t('common.all')}</option>{farms.map((f) => <option key={f._id} value={f._id}>{districtLabel(f.region, lang)}</option>)}</Select></Field>
        <Field label={t('rec.animal')} htmlFor="fa"><Select id="fa" value={animal} onChange={(e) => setAnimal(e.target.value)}><option value="">{t('common.all')}</option>{animals.filter((x) => !farm || x.farmId === farm).map((x) => <option key={x._id} value={x._id}>{x.animalTag} · {t(`breed.${x.breed}`)}</option>)}</Select></Field>
        <Field label={t('rec.disease')} htmlFor="fd"><Select id="fd" value={dis} onChange={(e) => setDis(e.target.value)}><option value="">{t('common.all')}</option>{diseases.map((d) => <option key={d.id} value={d.id}>{pick(d.name)}</option>)}</Select></Field>
      </div>
      <Card pad={false}>
        {rows.length === 0 ? <EmptyState icon={ClipboardList} title={t('rec.emptyTitle')} text={t('rec.emptyText')} /> : (
          <Table>
            <thead><tr><th>{t('rec.date')}</th><th>{t('rec.animal')}</th><th>{t('rec.farm')}</th><th>{t('rec.disease')}</th><th>{t('det.confidence')}</th><th>{t('common.status')}</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{fmtDate(r.createdAt, lang)}</td>
                  <td dir="ltr" style={{ textAlign: 'start' }}>{animalLabel(r.animalId)}</td>
                  <td>{farmName(r.farmId)}</td>
                  <td className={s.strong}>{diseaseName(pick, diseases, r.diagnosis.disease)}</td>
                  <td>{fmtPercent(r.diagnosis.confidenceScore)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><Button size="sm" variant="secondary" onClick={() => setOpen(r)}>{t('common.details')}</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!open} onClose={() => setOpen(null)} title={t('rec.detail')} wide footer={<Button variant="ghost" onClick={() => setOpen(null)}>{t('common.close')}</Button>}>
        {open && info && (
          <>
            <div className={s.row} style={{ alignItems: 'flex-start', gap: '1.25rem' }}>
              {open.diagnosis.imageUrl && <img src={open.diagnosis.imageUrl} alt={t('det.previewAlt')} style={{ width: 160, borderRadius: 10, border: '1px solid var(--line)' }} />}
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 style={{ marginBottom: '0.3rem' }}>{pick(info.name)}</h3>
                <div className={s.row}><StatusBadge status={open.status} /><Badge tone="neutral">{fmtPercent(open.diagnosis.confidenceScore)}</Badge><span className={`${s.muted} ${s.small}`}>{fmtDate(open.createdAt, lang)} · {farmName(open.farmId)} · <span dir="ltr">{animalLabel(open.animalId)}</span></span></div>
                <p style={{ marginTop: '0.75rem' }}>{pick(info.description)}</p>
              </div>
            </div>
            {info.kind !== 'healthy' && <><h4>{t('det.symptoms')}</h4><ul className={s.bullets}>{pick(info.symptoms).map((x) => <li key={x}>{x}</li>)}</ul></>}
            <h4>{t('det.prevention')}</h4>
            <ul className={s.bullets}>{pick(info.prevention).map((x) => <li key={x}>{x}</li>)}</ul>
            <h4>{t('det.treatment')}</h4>
            <p>{pick(info.treatment)}</p>
            {open.treatmentInfo && <p className={s.muted}>{open.treatmentInfo}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
