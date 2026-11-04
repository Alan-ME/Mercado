import { useEffect, useState, type ReactElement } from 'react';
import {
  ClipboardCheck,
  History,
  LineChart,
  Moon,
  ScanLine,
  Settings,
  Store,
  Sun,
  Wallet,
} from 'lucide-react';
import { useSession } from './state/session';
import { TenantThemeProvider } from './theme/TenantThemeProvider';
import { useColorMode, type ColorMode } from './theme/colorMode';
import { NotificationBell } from './components/NotificationBell';
import { Storefront } from './pages/Storefront';
import { WalletPage } from './pages/WalletPage';
import { Marketplace } from './pages/Marketplace';
import { AdminPortal } from './pages/AdminPortal';
import { TpvPage } from './pages/TpvPage';
import { AuditPage } from './pages/AuditPage';
import { HistoryPage } from './pages/HistoryPage';

export type Route = 'store' | 'wallet' | 'market' | 'history' | 'tpv' | 'admin' | 'audit';

interface NavDef {
  key: Route;
  label: string;
  icon: typeof Store;
  group: 'client' | 'merchant';
}

const NAV: NavDef[] = [
  { key: 'store', label: 'Tienda', icon: Store, group: 'client' },
  { key: 'wallet', label: 'Billetera', icon: Wallet, group: 'client' },
  { key: 'market', label: 'Mercado P2P', icon: LineChart, group: 'client' },
  { key: 'history', label: 'Historial', icon: History, group: 'client' },
  { key: 'tpv', label: 'TPV Canje', icon: ScanLine, group: 'merchant' },
  { key: 'admin', label: 'Admin B2B', icon: Settings, group: 'merchant' },
  { key: 'audit', label: 'Auditoría', icon: ClipboardCheck, group: 'merchant' },
];

const ROUTE_VIEWS: Record<Route, () => ReactElement | null> = {
  store: Storefront,
  wallet: WalletPage,
  market: Marketplace,
  history: HistoryPage,
  admin: AdminPortal,
  tpv: TpvPage,
  audit: AuditPage,
};

function parseRouteFromHash(): Route {
  const h = window.location.hash.replace('#/', '');
  const found = NAV.find((n) => n.key === h);
  return found ? found.key : 'store';
}

function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parseRouteFromHash);
  useEffect(() => {
    const onHash = () => setRoute(parseRouteFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = (r: Route) => {
    window.location.hash = `#/${r}`;
    setRoute(r);
  };
  return [route, nav];
}

// Port de _Logo (client_shell.dart): gradiente entre acento y primario + nombre en versalitas.
function BrandLogo({ companyName }: { companyName: string }) {
  const initial = companyName.slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-primary text-sm font-black text-brand-accent-fg shadow-sm">
        {initial}
      </div>
      <div>
        <div className="text-sm font-extrabold uppercase tracking-wider text-fg">{companyName}</div>
        <div className="text-[11px] font-semibold tracking-wide text-muted">SMCTA · P2P Trading Desk</div>
      </div>
    </div>
  );
}

// Port de _MarketPulse: pastilla viva en el header que muestra de un vistazo la banda del tenant.
function MarketPulse({ floorPct, ceilingPct }: { floorPct: number; ceilingPct: number }) {
  return (
    <div className="hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-semibold tabular-nums text-muted md:inline-flex">
      <span className="live-dot h-2 w-2 rounded-full bg-up" />
      <span>
        Collar {floorPct}%–{ceilingPct}%
      </span>
    </div>
  );
}

function ThemeToggle({ mode, onToggle }: { mode: ColorMode; onToggle: () => void }) {
  const Icon = mode === 'dark' ? Sun : Moon;
  return (
    <button
      onClick={onToggle}
      aria-label="Cambiar tema claro u oscuro"
      title="Cambiar tema"
      className="grid h-9 w-9 place-items-center rounded-ctl border border-line bg-panel text-muted transition hover:bg-raised hover:text-fg"
    >
      <Icon size={17} />
    </button>
  );
}

function SessionSelectors({ mode, onToggleMode }: { mode: ColorMode; onToggleMode: () => void }) {
  const session = useSession();
  const currentTenant = session.tenant ?? '';
  const currentUser = session.user ? session.user.userId : '';

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      <ThemeToggle mode={mode} onToggle={onToggleMode} />
      <NotificationBell />
      <select
        aria-label="Tenant"
        value={currentTenant}
        onChange={(e) => session.setTenant(e.target.value)}
        className="h-9 rounded-ctl border border-line bg-panel px-2.5 text-xs font-semibold text-fg outline-none transition hover:bg-raised focus:border-brand-accent"
      >
        {session.tenants.map((t) => (
          <option key={t.subdomain} value={t.subdomain}>
            {t.companyName}
          </option>
        ))}
      </select>
      <select
        aria-label="Usuario"
        value={currentUser}
        onChange={(e) => session.setUser(e.target.value)}
        className="h-9 rounded-ctl border border-line bg-panel px-2.5 text-xs font-semibold text-fg outline-none transition hover:bg-raised focus:border-brand-accent"
      >
        {session.users.map((u) => (
          <option key={u.userId} value={u.userId}>
            {u.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

// Port de _NavTab (client_shell.dart): relleno translúcido + borde del acento cuando está activa.
function NavButton({ item, active, onNavigate }: { item: NavDef; active: boolean; onNavigate: (r: Route) => void }) {
  const Icon = item.icon;
  const tone = active
    ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent'
    : 'border-transparent text-muted hover:bg-panel hover:text-fg';
  return (
    <button
      onClick={() => onNavigate(item.key)}
      className={`flex items-center gap-1.5 rounded-ctl border px-3.5 py-2 text-xs font-semibold transition ${tone}`}
    >
      <Icon size={15} />
      <span>{item.label}</span>
    </button>
  );
}

function NavTabs({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  const clientItems = NAV.filter((n) => n.group === 'client');
  const merchantItems = NAV.filter((n) => n.group === 'merchant');

  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 px-4 pb-3">
      {clientItems.map((item) => (
        <NavButton key={item.key} item={item} active={route === item.key} onNavigate={onNavigate} />
      ))}
      <span className="mx-1 hidden h-5 w-px bg-line sm:inline-block" aria-hidden="true" />
      {merchantItems.map((item) => (
        <NavButton key={item.key} item={item} active={route === item.key} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function App() {
  const session = useSession();
  const [route, nav] = useHashRoute();
  const { mode, toggle } = useColorMode();

  if (session.loading || !session.config) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas text-sm text-muted">
        Cargando terminal SMCTA…
      </div>
    );
  }

  const ActiveView = ROUTE_VIEWS[route];
  const cfg = session.config;

  return (
    <TenantThemeProvider config={cfg}>
      <div className="min-h-full bg-canvas text-fg">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3.5">
            <BrandLogo companyName={cfg.companyName} />
            <MarketPulse floorPct={cfg.priceFloorPct} ceilingPct={cfg.priceCeilingPct} />
            <SessionSelectors mode={mode} onToggleMode={toggle} />
          </div>
          <NavTabs route={route} onNavigate={nav} />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <ActiveView />
        </main>
      </div>
    </TenantThemeProvider>
  );
}
