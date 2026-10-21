import { forwardRef, useEffect, useRef, createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Inbox, X, XCircle } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { cx } from '../../utils/format';
import s from './ui.module.css';

export function Button({ variant = 'primary', size, block, loading, icon: Icon, children, className, type = 'button', ...rest }) {
  return (
    <button type={type} className={cx(s.btn, s[variant], size && s[size], block && s.block, className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className={s.spinner} style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" /> : Icon ? <Icon size={18} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Card({ title, actions, children, pad = true, className }) {
  return (
    <section className={cx(s.card, className)}>
      {title && (
        <div className={s.cardHead}>
          <h3>{title}</h3>
          {actions}
        </div>
      )}
      {pad ? <div className={s.cardBody}>{children}</div> : children}
    </section>
  );
}

const BADGE = { neutral: s.neutral, green: s.green, wheat: s.wheatBadge, water: s.water, low: s.low, med: s.med, high: s.high };
export function Badge({ tone = 'neutral', dot, children }) {
  return <span className={cx(s.badge, BADGE[tone])}>{dot && <span className={s.dot} />}{children}</span>;
}

export function RiskBadge({ level }) {
  const { t } = useI18n();
  const tone = level === 'High' ? 'high' : level === 'Medium' ? 'med' : 'low';
  return <Badge tone={tone} dot>{t(`risk.${level}`)}</Badge>;
}

const STATUS_TONE = {
  requested: 'wheat', confirmed: 'green', rescheduled: 'water', completed: 'neutral', cancelled: 'neutral', rejected: 'high',
  ordered: 'wheat', accepted: 'green', processing: 'water', 'out-for-delivery': 'water', delivered: 'green',
  active: 'green', pending: 'wheat', blocked: 'high', healthy: 'low', recovered: 'green', referred: 'water', new: 'wheat', resolved: 'green',
};
export function StatusBadge({ status }) {
  const { t } = useI18n();
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{t(`status.${status}`)}</Badge>;
}

export function Field({ label, error, hint, required, htmlFor, children }) {
  return (
    <div className={s.field}>
      {label && <label className={s.label} htmlFor={htmlFor}>{label}{required && <span className={s.req} aria-hidden="true">*</span>}</label>}
      {children}
      {hint && !error && <span className={s.hint}>{hint}</span>}
      {error && <span className={s.error} role="alert">{error}</span>}
    </div>
  );
}
export const Input = forwardRef(function Input({ invalid, className, ...p }, ref) {
  return <input ref={ref} className={cx(s.input, invalid && s.invalid, className)} aria-invalid={invalid || undefined} {...p} />;
});
export const Select = forwardRef(function Select({ invalid, className, children, ...p }, ref) {
  return <select ref={ref} className={cx(s.select, invalid && s.invalid, className)} aria-invalid={invalid || undefined} {...p}>{children}</select>;
});
export const Textarea = forwardRef(function Textarea({ invalid, className, ...p }, ref) {
  return <textarea ref={ref} className={cx(s.textarea, invalid && s.invalid, className)} aria-invalid={invalid || undefined} {...p} />;
});
export function Checkbox({ id, children, ...p }) {
  return (
    <div className={s.checkRow}>
      <input id={id} type="checkbox" {...p} />
      <label htmlFor={id}>{children}</label>
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  const { t } = useI18n();
  const ref = useRef(null);
  // Keep the latest onClose in a ref so the effect below runs only when the dialog opens or closes.
  // (Depending on onClose re-ran it on every keystroke and stole focus back to the first field.)
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const focusable = ref.current?.querySelector('input, select, textarea, button:not([data-close])');
    (focusable || ref.current)?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className={s.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={cx(s.modal, wide && s.modalWide)} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className={s.modalHead}>
          <h3>{title}</h3>
          <button type="button" data-close className={s.iconBtn} onClick={onClose} aria-label={t('common.close')}><X size={20} /></button>
        </div>
        <div className={s.modalBody}>{children}</div>
        {footer && <div className={s.modalFoot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Loading({ label }) {
  const { t } = useI18n();
  return <div className={s.loading} role="status"><span className={s.spinner} aria-hidden="true" />{label || t('common.loading')}</div>;
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}><Icon size={26} aria-hidden="true" /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

const ALERT_ICON = { info: Info, warn: AlertTriangle, danger: XCircle, ok: CheckCircle2 };
const ALERT_CLS = { info: s.alertInfo, warn: s.alertWarn, danger: s.alertDanger, ok: s.alertOk };
export function Alert({ tone = 'info', title, children }) {
  const Icon = ALERT_ICON[tone];
  return (
    <div className={cx(s.alert, ALERT_CLS[tone])} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={20} aria-hidden="true" style={{ flex: 'none', marginTop: 3 }} />
      <div>{title && <strong>{title}</strong>}{children}</div>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useI18n();
  return (
    <Alert tone="danger" title={t('common.loadError')}>
      <Button variant="secondary" size="sm" onClick={onRetry}>{t('common.retry')}</Button>
    </Alert>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className={s.pageHead}>
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, icon: Icon, tone, to }) {
  const inner = (
    <>
      <span className={cx(s.statIcon, tone && s[`t-${tone}`])}>{Icon && <Icon size={22} aria-hidden="true" />}</span>
      <div><div className={s.statValue}>{value}</div><div className={s.statLabel}>{label}</div></div>
    </>
  );
  return to ? <Link className={cx(s.card, s.stat)} to={to}>{inner}</Link> : <div className={cx(s.card, s.stat)}>{inner}</div>;
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className={s.segmented} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={s.seg} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Table({ children }) {
  return <div className={s.tableWrap}><table className={s.table}>{children}</table></div>;
}

// Toasts
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={s.toasts} aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={cx(s.toast, i.tone === 'error' && s.toastError)} role="status">
            {i.tone === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}{i.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
