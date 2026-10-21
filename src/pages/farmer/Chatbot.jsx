import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Send, Square } from 'lucide-react';
import { api } from '../../api/services';
import { useI18n } from '../../i18n/I18nContext';
import { Alert, Button, PageHeader } from '../../components/ui';
import { useApiError } from '../../utils/useApiError';
import { districtLabel } from '../../data/punjab';
import s from '../pages.module.css';
import c from './chat.module.css';

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const PROMPTS = ['p1', 'p2', 'p3'];

export default function Chatbot() {
  const { t, lang } = useI18n();
  const onError = useApiError();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(false);
  const log = useRef(null);
  const rec = useRef(null);
  const session = useRef(null);

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy]);
  useEffect(() => () => rec.current?.abort?.(), []);

  const push = (m) => setMsgs((x) => [...x, { id: Math.random().toString(36).slice(2), ...m }]);

  const send = async (payload, shown) => {
    if (busy) return;
    if (shown) push({ sender: 'user', text: shown });
    setBusy(true);
    try {
      const res = await api.sendChatMessage({ sessionId: session.current, language: lang, inputType: voice ? 'voice' : 'text', ...payload });
      if (res.sessionId) session.current = res.sessionId;
      push({ sender: 'bot', ...res });
    } catch (err) { onError(err); }
    setBusy(false); setVoice(false);
  };

  const submit = (e) => {
    e?.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText('');
    send({ text: v }, v);
  };

  const toggleMic = () => {
    if (!SR) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
    r.interimResults = false;
    r.onresult = (e) => { setText((x) => `${x} ${e.results[0][0].transcript}`.trim()); setVoice(true); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  };

  const action = (m, a) => send({ action: a, diseaseId: m.diseaseId }, t(`chat.act.${a}`));
  const lastBotId = [...msgs].reverse().find((m) => m.sender === 'bot')?.id;

  return (
    <>
      <PageHeader title={t('nav.chatbot')} subtitle={t('chat.sub')} />
      <Alert tone="info">{t('chat.disclaimer')}</Alert>
      <div className={c.shell}>
        <div className={c.log} ref={log} aria-live="polite">
          <div className={`${c.msg} ${c.bot}`}><p>{t('chat.welcome')}</p></div>
          {msgs.map((m) => (
            <div key={m.id} className={`${c.msg} ${m.sender === 'user' ? c.user : c.bot}`}>
              <p>{m.text}</p>
              {m.prevention?.length > 0 && <><strong>{t('det.prevention')}</strong><ul className={s.bullets}>{m.prevention.map((x) => <li key={x}>{x}</li>)}</ul></>}
              {m.kind === 'medicines' && m.medicines?.length > 0 && <ul className={s.bullets}>{m.medicines.map((name) => <li key={name}>{name}</li>)}</ul>}
              {m.kind === 'medicines' && m.medicines?.length === 0 && <p className={s.muted}>{t('chat.noMeds')}</p>}
              {m.vets?.map((v) => (
                <div key={v._id} className={c.mini}>
                  <div><div className={s.strong}>{v.name}</div><div className={`${s.muted} ${s.small}`}>{v.specialty} · {districtLabel(v.location?.region, lang)}</div></div>
                  <Link to="/farmer/appointments" state={{ vetId: v._id }}><Button size="sm">{t('appt.book')}</Button></Link>
                </div>
              ))}
              {m.sender === 'bot' && m.id === lastBotId && m.actions?.length > 0 && (
                <div className={c.acts}>
                  {m.actions.map((a) => <Button key={a} size="sm" variant="secondary" disabled={busy} onClick={() => action(m, a)}>{t(`chat.act.${a}`)}</Button>)}
                </div>
              )}
            </div>
          ))}
          {busy && <div className={`${c.msg} ${c.bot}`} aria-label={t('common.loading')}><span className={c.typing}><i /><i /><i /></span></div>}
        </div>

        {msgs.length === 0 && (
          <div className={c.prompts}>
            {PROMPTS.map((p) => <button key={p} type="button" className={s.chip} onClick={() => send({ text: t(`chat.${p}`) }, t(`chat.${p}`))}>{t(`chat.${p}`)}</button>)}
          </div>
        )}

        <form className={c.bar} onSubmit={submit}>
          {SR && (
            <Button type="button" variant={listening ? 'danger' : 'secondary'} className={c.mic} onClick={toggleMic} aria-label={listening ? t('chat.stopMic') : t('chat.startMic')} title={listening ? t('chat.stopMic') : t('chat.startMic')}>
              {listening ? <Square size={18} /> : <Mic size={20} />}
            </Button>
          )}
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={1}
            placeholder={listening ? t('chat.listening') : t('chat.placeholder')} aria-label={t('chat.placeholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
          />
          <Button type="submit" disabled={busy || !text.trim()} icon={Send}><span className="sr-only">{t('chat.send')}</span><span aria-hidden="true">{t('chat.send')}</span></Button>
        </form>
      </div>
    </>
  );
}
