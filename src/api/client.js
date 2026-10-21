import axios from 'axios';

export const TOKEN_KEY = 'vs_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 60000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      window.dispatchEvent(new Event('vs:unauthorized'));
    }
    return Promise.reject(err);
  },
);

export default http;

// Works for FastAPI errors ({detail: "text"} | {detail: {code, message}} | {detail: [{msg}]}) and mock errors.
export function errorInfo(err) {
  if (err?.code && !err.response) return { code: err.code, message: err.message };
  const d = err?.response?.data?.detail;
  if (d && typeof d === 'object' && !Array.isArray(d)) return { code: d.code, message: d.message };
  if (Array.isArray(d)) return { code: 'invalid_input', message: d.map((x) => x.msg).join(', ') };
  if (typeof d === 'string') return { code: undefined, message: d };
  if (err?.code === 'ERR_NETWORK') return { code: 'network', message: err.message };
  return { code: undefined, message: err?.message };
}
