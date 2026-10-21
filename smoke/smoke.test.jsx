import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { I18nProvider } from '../src/i18n/I18nContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/components/ui';

const errors = [];
const origErr = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' ')); };

function mount(path, { user, lang = 'en' } = {}) {
  localStorage.clear();
  if (user) localStorage.setItem('vs_token', user);
  localStorage.setItem('vs_lang', lang);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></I18nProvider>
    </MemoryRouter>,
  );
}

const ROUTES = {
  u_farmer1: ['/farmer/dashboard', '/farmer/farm', '/farmer/animals', '/farmer/detect', '/farmer/records', '/farmer/chatbot', '/farmer/risk-map', '/farmer/appointments', '/farmer/marketplace', '/farmer/orders', '/farmer/feedback', '/notifications', '/profile'],
  u_vet1: ['/vet/dashboard', '/vet/requests', '/vet/availability', '/profile'],
  u_store1: ['/store/dashboard', '/store/orders', '/store/products', '/notifications'],
  u_admin: ['/admin/dashboard', '/admin/users', '/admin/marketplace', '/admin/diseases', '/admin/feedback'],
};

describe('every page renders for its role', () => {
  for (const [user, paths] of Object.entries(ROUTES)) {
    for (const lang of ['en', 'ur']) {
      for (const p of paths) {
        it(`${user} ${lang} ${p}`, async () => {
          mount(p, { user, lang });
          await waitFor(() => expect(document.querySelector('h1')).not.toBeNull(), { timeout: 8000 });
          await new Promise((r) => setTimeout(r, 450));
          expect(screen.queryByText(/We could not load this data|یہ ڈیٹا لوڈ نہیں ہو سکا/)).toBeNull();
          expect(document.documentElement.dir).toBe(lang === 'ur' ? 'rtl' : 'ltr');
        });
      }
    }
  }
  it('landing + login + register render', async () => {
    for (const p of ['/', '/login', '/register']) { const { unmount } = mount(p); await waitFor(() => expect(document.querySelector('h1')).not.toBeNull()); unmount(); }
  });
  it('wrong-role route redirects to own home', async () => {
    mount('/admin/users', { user: 'u_farmer1' });
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Hello, Ali/), { timeout: 6000 });
  });
  it('protected route redirects to login when signed out', async () => {
    mount('/farmer/dashboard');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
  });
});

describe('flows', () => {
  it('login with demo account lands on dashboard', async () => {
    const u = userEvent.setup();
    mount('/login');
    await u.click(screen.getByRole('button', { name: 'Farmer / Livestock owner' }));
    await u.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Hello, Ali/), { timeout: 6000 });
  });
  it('wrong password shows error', async () => {
    const u = userEvent.setup();
    mount('/login');
    await u.type(screen.getByLabelText(/Email/), 'ali@example.com');
    await u.type(screen.getByLabelText(/Password/), 'nope');
    await u.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(screen.getByText('Incorrect email or password.')).toBeTruthy());
  });
  it('register farmer with OTP', async () => {
    const u = userEvent.setup();
    mount('/register');
    await u.type(screen.getByLabelText(/First name/), 'Test');
    await u.type(screen.getByLabelText(/Last name/), 'User');
    await u.type(screen.getByLabelText(/^Email/), 'test.user@example.com');
    await u.type(screen.getByLabelText(/^Password/), 'password1');
    await u.type(screen.getByLabelText(/Confirm password/), 'password1');
    await u.click(screen.getByLabelText(/I accept/));
    await u.click(screen.getByRole('button', { name: 'Send verification code' }));
    await waitFor(() => expect(screen.getByText('Verify your email')).toBeTruthy());
    const boxes = screen.getAllByRole('textbox');
    await u.click(boxes[0]);
    await u.paste('123456');
    await u.click(screen.getByRole('button', { name: 'Verify and continue' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Hello, Test/), { timeout: 6000 });
  });
  it('register shows validation errors', async () => {
    const u = userEvent.setup();
    mount('/register');
    await u.click(screen.getByRole('button', { name: 'Send verification code' }));
    expect(screen.getAllByText('This field is required').length).toBeGreaterThan(1);
  });
  it('detect disease upload returns a result or no-match', async () => {
    const u = userEvent.setup();
    mount('/farmer/detect', { user: 'u_farmer1' });
    await waitFor(() => expect(document.querySelector('input[type=file]')).not.toBeNull(), { timeout: 6000 });
    const input = document.querySelector('input[type=file]');
    await u.upload(input, new File(['x'], 'cow1.jpg', { type: 'image/jpeg' }));
    await u.click(await screen.findByRole('button', { name: /Check photo/ }));
    await waitFor(() => expect(screen.queryAllByText(/Confidence|No supported disease found/).length).toBeGreaterThan(0), { timeout: 9000 });
  });
  it('detect rejects wrong file type', async () => {
    mount('/farmer/detect', { user: 'u_farmer1' });
    await waitFor(() => expect(document.querySelector('input[type=file]')).not.toBeNull(), { timeout: 6000 });
    const input = document.querySelector('input[type=file]');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] } });
    await waitFor(() => expect(screen.getByText('Invalid file format. Use PNG, JPG or JPEG.')).toBeTruthy());
  });
  it('chatbot answers a symptom and offers actions (Urdu too)', async () => {
    const u = userEvent.setup();
    mount('/farmer/chatbot', { user: 'u_farmer1', lang: 'ur' });
    const box = await screen.findByPlaceholderText('اپنی علامات لکھیں…');
    await u.type(box, 'میری گائے کی جلد پر گلٹیاں ہیں');
    await u.click(screen.getByRole('button', { name: /بھیجیں/ }));
    await waitFor(() => expect(screen.getByText(/ممکنہ معلومات، تصدیق شدہ|ممکنہ بیماری|ہو سکتی ہے/)).toBeTruthy(), { timeout: 5000 });
    await u.click(await screen.findByRole('button', { name: 'دوا کے اختیارات' }));
    await waitFor(() => expect(screen.getByText(/Oxytetracycline Injection/)).toBeTruthy(), { timeout: 5000 });
    expect(screen.queryByText(/روپے/)).toBeNull();
  });
  it('farmer books an in-person appointment', async () => {
    const u = userEvent.setup();
    mount('/farmer/appointments', { user: 'u_farmer1' });
    await u.click(await screen.findByRole('button', { name: 'Book appointment' }));
    await u.click(await screen.findByRole('button', { name: 'In-person at clinic' }));
    const vet = await screen.findByRole('radio', { name: /Dr\. Sana Malik/ });
    await u.click(vet);
    const dlg = screen.getByRole('dialog');
    const slots = within(dlg).getAllByRole('button').filter((b) => /^\d{1,2}:\d{2}/.test(b.textContent));
    expect(slots.length).toBeGreaterThan(0);
    await u.click(slots[0]);
    await u.click(within(dlg).getByRole('button', { name: 'Send request' }));
    await waitFor(() => expect(screen.getByText('Request sent to the vet')).toBeTruthy(), { timeout: 5000 });
  });
  it('marketplace blocks Rx product without prescription then orders OTC item', async () => {
    const u = userEvent.setup();
    mount('/farmer/marketplace', { user: 'u_farmer1' });
    const rx = await screen.findByText('Oxytetracycline Injection');
    const card = rx.closest('section');
    await u.click(within(card).getByRole('button', { name: /Order/ }));
    expect(await screen.findByText('Cash on delivery')).toBeTruthy();
    await u.click(await screen.findByRole('button', { name: 'Confirm order' }));
    await waitFor(() => expect(screen.getByText('A vet prescription is required for this product.')).toBeTruthy());
    await u.click(screen.getByRole('button', { name: 'Cancel' }));
    const otc = (await screen.findByText('Antiseptic Wound Spray')).closest('section');
    await u.click(within(otc).getByRole('button', { name: /Order/ }));
    await u.click(await screen.findByRole('button', { name: 'Confirm order' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Orders/), { timeout: 6000 });
  });
  it('store accepts the order placed earlier and moves it to processing', async () => {
    const u = userEvent.setup();
    mount('/store/orders', { user: 'u_store1' });
    await u.click(await screen.findByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(screen.getByText('Order updated')).toBeTruthy(), { timeout: 5000 });
  });
  it('vet confirms a request', async () => {
    const u = userEvent.setup();
    mount('/vet/requests', { user: 'u_vet1' });
    await u.click((await screen.findAllByRole('button', { name: 'Review' }))[0]);
    await u.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(screen.getByText('Request confirmed')).toBeTruthy(), { timeout: 5000 });
  });
  it('admin approves pending vet', async () => {
    const u = userEvent.setup();
    mount('/admin/users', { user: 'u_admin' });
    await u.click(await screen.findByRole('button', { name: /Approve/ }));
    await waitFor(() => expect(screen.getByText('Account approved')).toBeTruthy(), { timeout: 5000 });
  });
});

describe('decisions: animals, address, vet cancel, categories, risk', () => {
  it('farm form requires an address', async () => {
    const u = userEvent.setup();
    mount('/farmer/farm', { user: 'u_farmer1' });
    await u.click((await screen.findAllByRole('button', { name: 'Add farm' }))[0]);
    await u.type(await screen.findByLabelText(/Herd size/), '5');
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter the farm address')).toBeTruthy();
  });

  it('farmer registers an animal inside a farm and duplicate IDs are rejected', async () => {
    const u = userEvent.setup();
    mount('/farmer/animals', { user: 'u_farmer1' });
    await u.click((await screen.findAllByRole('button', { name: 'Add animal' }))[0]);
    await u.type(await screen.findByLabelText(/Animal ID/), 'A-999');
    await u.type(screen.getByLabelText(/Age \(years\)/), '4');
    await u.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Animal saved')).toBeTruthy(), { timeout: 5000 });
    expect(await screen.findByText('A-999')).toBeTruthy();
    await u.click((await screen.findAllByRole('button', { name: 'Add animal' }))[0]);
    await u.type(await screen.findByLabelText(/Animal ID/), 'a-999');
    await u.type(screen.getByLabelText(/Age \(years\)/), '2');
    await u.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('An animal with this ID already exists on this farm.')).toBeTruthy(), { timeout: 5000 });
  });

  it('detect is tied to an animal and the record shows it', async () => {
    mount('/farmer/records', { user: 'u_farmer1' });
    await waitFor(() => expect(screen.getAllByText(/A-101/).length).toBeGreaterThan(0), { timeout: 6000 });
  });

  it('vet cancels with a reason; farmer sees who cancelled and why', async () => {
    const u = userEvent.setup();
    const first = mount('/vet/requests', { user: 'u_vet1' });
    await u.click((await screen.findAllByRole('button', { name: 'Review' }))[0]);
    await u.click(await screen.findByRole('button', { name: 'Cancel appointment' }));
    await u.type(await screen.findByLabelText(/Reason for cancelling/), 'Emergency call');
    await u.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    await waitFor(() => expect(screen.getByText('Appointment cancelled')).toBeTruthy(), { timeout: 5000 });
    first.unmount();
    mount('/farmer/appointments', { user: 'u_farmer1' });
    await u.click(await screen.findByRole('button', { name: 'Past' }));
    expect(await screen.findByText('Cancelled by the vet')).toBeTruthy();
    expect(screen.getByText(/Emergency call/)).toBeTruthy();
  });

  it('vet sees animal details and health history on a request', async () => {
    const u = userEvent.setup();
    mount('/vet/requests', { user: 'u_vet1' });
    await u.click(await screen.findByRole('button', { name: 'Completed' }));
    await u.click((await screen.findAllByRole('button', { name: 'Review' }))[0]);
    expect(await screen.findByText('Health history of this animal')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText(/Lumpy Skin/).length).toBeGreaterThan(0), { timeout: 5000 });
  });

  it('admin hides a listing and it disappears for farmers; category in use cannot be removed', async () => {
    const u = userEvent.setup();
    const admin = mount('/admin/marketplace', { user: 'u_admin' });
    const row = (await screen.findByText('Fly Repellent Spray')).closest('tr');
    await u.click(within(row).getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(screen.getByText('Listing updated')).toBeTruthy(), { timeout: 5000 });
    const del = (await screen.findAllByRole('button', { name: 'Delete' }))[0];
    await u.click(del);
    await u.click((await screen.findAllByRole('button', { name: 'Delete' })).pop());
    await waitFor(() => expect(screen.getByText('This category is used by products. Move or remove them first.')).toBeTruthy(), { timeout: 5000 });
    admin.unmount();
    mount('/farmer/marketplace', { user: 'u_farmer1' });
    await screen.findByText('Antiseptic Wound Spray');
    expect(screen.queryByText('Fly Repellent Spray')).toBeNull();
  });

  it('risk map shows the stale-data notice for a district using cached predictions', async () => {
    const u = userEvent.setup();
    mount('/farmer/risk-map', { user: 'u_farmer1' });
    await u.selectOptions(await screen.findByLabelText('District'), 'RajanpUr'.replace('U', 'u'));
    expect(await screen.findByText(/Using last known data/)).toBeTruthy();
  });
});

it('no unexpected React console errors', () => {
  const bad = errors.filter((e) => !/act\(|not wrapped in act|Not implemented|Could not parse CSS|React Router Future Flag|createRoot/.test(e));
  if (bad.length) console.log('CONSOLE ERRORS:\n' + bad.slice(0, 12).join('\n---\n'));
  expect(bad.length).toBe(0);
});
