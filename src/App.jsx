import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireRole } from './components/RouteGuards';
import AppShell from './components/layout/AppShell';
import { Loading } from './components/ui';
import { useAuth, HOME_BY_ROLE } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';

import FarmerDashboard from './pages/farmer/Dashboard';
import Farm from './pages/farmer/Farm';
import Animals from './pages/farmer/Animals';
import Detect from './pages/farmer/Detect';
import Records from './pages/farmer/Records';
import Chatbot from './pages/farmer/Chatbot';
import Appointments from './pages/farmer/Appointments';
import Marketplace from './pages/farmer/Marketplace';
import Orders from './pages/farmer/Orders';
import Feedback from './pages/farmer/Feedback';

import VetDashboard from './pages/vet/Dashboard';
import Requests from './pages/vet/Requests';
import Availability from './pages/vet/Availability';

import StoreDashboard from './pages/store/Dashboard';
import StoreOrders from './pages/store/Orders';
import StoreProducts from './pages/store/Products';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminMarketplace from './pages/admin/Marketplace';
import AdminDiseases from './pages/admin/Diseases';
import AdminFeedback from './pages/admin/Feedback';

// The map pulls in Leaflet, so it loads only when someone opens it.
const RiskMap = lazy(() => import('./pages/farmer/RiskMap'));

function Home() {
  const { user } = useAuth();
  return user ? <Navigate to={HOME_BY_ROLE[user.role]} replace /> : <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/farmer" element={<RequireRole roles={['farmer']} />}>
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="farm" element={<Farm />} />
            <Route path="animals" element={<Animals />} />
            <Route path="detect" element={<Detect />} />
            <Route path="records" element={<Records />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="risk-map" element={<Suspense fallback={<Loading />}><RiskMap /></Suspense>} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="orders" element={<Orders />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>

          <Route path="/vet" element={<RequireRole roles={['vet']} />}>
            <Route path="dashboard" element={<VetDashboard />} />
            <Route path="requests" element={<Requests />} />
            <Route path="availability" element={<Availability />} />
          </Route>

          <Route path="/store" element={<RequireRole roles={['store']} />}>
            <Route path="dashboard" element={<StoreDashboard />} />
            <Route path="orders" element={<StoreOrders />} />
            <Route path="products" element={<StoreProducts />} />
          </Route>

          <Route path="/admin" element={<RequireRole roles={['admin']} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="marketplace" element={<AdminMarketplace />} />
            <Route path="diseases" element={<AdminDiseases />} />
            <Route path="feedback" element={<AdminFeedback />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
