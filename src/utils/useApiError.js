import { useCallback } from 'react';
import { errorInfo } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui';

// Turns any API/mock error into a friendly translated message.
export function useErrorText() {
  const { t } = useI18n();
  return useCallback((err) => {
    const { code, message } = errorInfo(err);
    if (code && t(`err.${code}`) !== `err.${code}`) return t(`err.${code}`);
    if (code === 'network') return t('err.network');
    return message || t('err.generic');
  }, [t]);
}

export function useApiError() {
  const toast = useToast();
  const text = useErrorText();
  return useCallback((err) => toast(text(err), 'error'), [toast, text]);
}
