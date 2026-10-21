import {
  LayoutDashboard, Sprout, ScanSearch, ClipboardList, MessageCircle, Map, CalendarCheck, Store, PackageCheck,
  MessageSquareHeart, PawPrint, Inbox, CalendarClock, Users, BookOpen, Pill, UserRound, Bell,
} from 'lucide-react';

// key = translation key under "nav."
export const NAV = {
  farmer: [
    { to: '/farmer/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { to: '/farmer/farm', key: 'farm', icon: Sprout },
    { to: '/farmer/animals', key: 'animals', icon: PawPrint },
    { to: '/farmer/detect', key: 'detect', icon: ScanSearch },
    { to: '/farmer/records', key: 'records', icon: ClipboardList },
    { to: '/farmer/chatbot', key: 'chatbot', icon: MessageCircle },
    { to: '/farmer/risk-map', key: 'riskMap', icon: Map },
    { to: '/farmer/appointments', key: 'appointments', icon: CalendarCheck },
    { to: '/farmer/marketplace', key: 'marketplace', icon: Store },
    { to: '/farmer/orders', key: 'orders', icon: PackageCheck },
    { to: '/farmer/feedback', key: 'feedback', icon: MessageSquareHeart },
  ],
  vet: [
    { to: '/vet/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { to: '/vet/requests', key: 'requests', icon: Inbox },
    { to: '/vet/availability', key: 'availability', icon: CalendarClock },
  ],
  store: [
    { to: '/store/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { to: '/store/orders', key: 'orders', icon: PackageCheck },
    { to: '/store/products', key: 'products', icon: Pill },
  ],
  admin: [
    { to: '/admin/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { to: '/admin/users', key: 'users', icon: Users },
    { to: '/admin/marketplace', key: 'marketplaceAdmin', icon: Store },
    { to: '/admin/diseases', key: 'diseases', icon: BookOpen },
    { to: '/admin/feedback', key: 'feedbackAdmin', icon: MessageSquareHeart },
  ],
};

export const SHARED_NAV = [
  { to: '/notifications', key: 'notifications', icon: Bell },
  { to: '/profile', key: 'profile', icon: UserRound },
];
