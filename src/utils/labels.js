import { slug } from './format';

// Returns the translation if it exists, otherwise the raw fallback text.
export function tOr(t, key, fallback) {
  const v = t(key);
  return v === key ? fallback : v;
}
export const climateLabel = (t, c) => tOr(t, `climate.${slug(c)}`, c);
export const diseaseName = (pick, diseases, id) => {
  const d = diseases?.find((x) => x.id === id);
  return d ? pick(d.name) : id;
};
export const visitLabel = (t, type) => t(`visit.${type}`);
