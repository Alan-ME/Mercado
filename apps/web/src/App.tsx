import { useEffect, useState, type ReactElement } from 'react';
import {
  ClipboardCheck,
  History,
  LineChart,
  Moon,
  ScanLine,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useSession } from './state/session';
import { CartProvider, useCart } from './state/cart';
import { CartDrawer } from './components/CartDrawer';
import { TenantThemeProvider } from './theme/TenantThemeProvider';
import { useColorMode, type ColorMode } from './theme/colorMode';
import { NotificationBell } from './components/NotificationBell';
import { Storefront } from './pages/Storefront';
import { CartaPage } from './pages/CartaPage';
import { WalletPage } from './pages/WalletPage';
import { Marketplace } from './pages/Marketplace';
import { AdminPortal } from './pages/AdminPortal';
import { TpvPage } from './pages/TpvPage';
import { AuditPage } from './pages/AuditPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export type Route =
  | 'store'
  | 'carta'
  | 'wallet'
  | 'market'
  | 'history'
  | 'settings'
  | 'tpv'
  | 'admin'
  | 'audit';

interface NavDef {
  key: Route;
  label: string;
  icon: typeof Store;
  group: 'client' | 'merchant';
}

const NAV: NavDef[] = [
  { key: 'store', label: 'INICIO', icon: Store, group: 'client' },
  { key: 'carta', label: 'CARTA', icon: UtensilsCrossed, group: 'client' },
  { key: 'wallet', label: 'BILLETERA', icon: Wallet, group: 'client' },
  { key: 'market', label: 'MERCADO P2P', icon: LineChart, group: 'client' },
  { key: 'history', label: 'HISTORIAL', icon: History, group: 'client' },
  { key: 'settings', label: 'AJUSTES', icon: Settings, group: 'client' },
  { key: 'tpv', label: 'TPV Canje', icon: ScanLine, group: 'merchant' },
  { key: 'admin', label: 'Admin B2B', icon: Settings, group: 'merchant' },
  { key: 'audit', label: 'Auditoría', icon: ClipboardCheck, group: 'merchant' },
];

const ROUTE_VIEWS: Record<Route, () => ReactElement | null> = {
  store: Storefront,
  carta: CartaPage,
  wallet: WalletPage,
  market: Marketplace,
  history: HistoryPage,
  settings: SettingsPage,
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

function BrandLogo({ companyName }: { companyName: string }) {
  const isCoffee = companyName.toLowerCase().includes('brew') || companyName.toLowerCase().includes('coffee');
  return (
    <div
      onClick={() => (window.location.hash = '#/store')}
      className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-primary text-black shadow-md">
        {isCoffee ? (
          <span className="text-lg">☕</span>
        ) : (
          <span className="text-sm font-black">{companyName.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div>
        <div className="text-sm font-black uppercase tracking-wider text-fg">
          {isCoffee ? 'BREW/DESK' : companyName}
        </div>
        <div className="text-[10px] font-semibold tracking-wide text-muted">
          {isCoffee ? 'specialty coffee' : 'SMCTA · P2P Trading Desk'}
        </div>
      </div>
    </div>
  );
}

function MarketPulse() {
  return (
    <div className="hidden items-center gap-2 rounded-full border border-warn/40 bg-warn/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-warn xl:inline-flex">
      <span className="live-dot h-2 w-2 rounded-full bg-up animate-pulse" />
      <span>AHORA EN VIVO · HOY</span>
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
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel text-muted transition hover:bg-raised hover:text-fg"
    >
      <Icon size={16} />
    </button>
  );
}

function CartButton() {
  const { items, openCart } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={openCart}
      aria-label="Abrir carrito"
      className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel text-brand-primary transition hover:bg-raised"
    >
      <ShoppingBag size={17} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-black text-black">
          {count}
        </span>
      )}
    </button>
  );
}

function UserButton({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user } = useSession();

  if (!user) {
    return (
      <button
        onClick={onOpenSettings}
        className="rounded-xl bg-brand-accent px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95"
      >
        INICIAR SESION
      </button>
    );
  }

  return (
    <button
      onClick={onOpenSettings}
      className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-1.5 text-xs font-bold text-fg transition hover:bg-raised"
    >
      <div className="grid h-5 w-5 place-items-center rounded-full bg-brand-primary text-[10px] font-black text-black">
        {user.displayName.slice(0, 1).toUpperCase()}
      </div>
      <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName}</span>
    </button>
  );
}

function HeaderRightControls({
  mode,
  onToggleMode,
  onOpenSettings,
}: {
  mode: ColorMode;
  onToggleMode: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <UserButton onOpenSettings={onOpenSettings} />
      <button
        onClick={onOpenSettings}
        title="Ajustes (estilo Twitter)"
        className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel text-muted transition hover:bg-raised hover:text-fg"
      >
        <Settings size={17} />
      </button>
      <CartButton />
      <NotificationBell />
      <ThemeToggle mode={mode} onToggle={onToggleMode} />
    </div>
  );
}

function NavPill({
  item,
  active,
  onNavigate,
}: {
  item: NavDef;
  active: boolean;
  onNavigate: (r: Route) => void;
}) {
  const isPrimaryPill = item.key === 'store' || item.key === 'carta';
  const activeStyle = isPrimaryPill
    ? 'bg-brand-primary text-black font-black shadow-md'
    : 'border-brand-primary/40 bg-brand-primary/15 text-brand-primary font-bold';

  const inactiveStyle = 'border-transparent text-muted hover:bg-raised/60 hover:text-fg';

  return (
    <button
      onClick={() => onNavigate(item.key)}
      className={`rounded-xl px-3 py-1.5 text-xs uppercase tracking-wider transition ${
        active ? activeStyle : inactiveStyle
      }`}
    >
      <span>{item.label}</span>
    </button>
  );
}

function AppContent() {
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
  const clientNav = NAV.filter((n) => n.group === 'client');
  const merchantNav = NAV.filter((n) => n.group === 'merchant');

  return (
    <TenantThemeProvider config={cfg}>
      <div className="min-h-full bg-canvas text-fg">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <BrandLogo companyName={cfg.companyName} />
            <span className="hidden h-5 w-px bg-line md:inline-block" />

            <nav className="hidden items-center gap-1.5 md:flex">
              {clientNav.slice(0, 4).map((item) => (
                <NavPill
                  key={item.key}
                  item={item}
                  active={route === item.key}
                  onNavigate={nav}
                />
              ))}
            </nav>

            <MarketPulse />

            <HeaderRightControls
              mode={mode}
              onToggleMode={toggle}
              onOpenSettings={() => nav('settings')}
            />
          </div>

          {/* Sub-barra en mobile y para accesos de liquidación/auditoría */}
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 pb-2 md:hidden">
            {clientNav.map((item) => (
              <NavPill
                key={item.key}
                item={item}
                active={route === item.key}
                onNavigate={nav}
              />
            ))}
            <span className="mx-1 h-4 w-px bg-line" />
            {merchantNav.map((item) => (
              <NavPill
                key={item.key}
                item={item}
                active={route === item.key}
                onNavigate={nav}
              />
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-4">
          <ActiveView />
        </main>

        <CartDrawer />
      </div>
    </TenantThemeProvider>
  );
}

export function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
