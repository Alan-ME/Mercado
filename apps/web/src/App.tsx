import { useEffect, useState } from 'react';
import { Store, Wallet, LineChart, Settings, ScanLine, ClipboardCheck, History } from 'lucide-react';
import { useSession } from './state/session';
import { TenantThemeProvider } from './theme/TenantThemeProvider';
import { NotificationBell } from './components/NotificationBell';
import { Storefront } from './pages/Storefront';
import { WalletPage } from './pages/WalletPage';
import { Marketplace } from './pages/Marketplace';
import { AdminPortal } from './pages/AdminPortal';
import { TpvPage } from './pages/TpvPage';
import { AuditPage } from './pages/AuditPage';
import { HistoryPage } from './pages/HistoryPage';

type Route = 'store' | 'wallet' | 'market' | 'history' | 'admin' | 'tpv' | 'audit';

const NAV: { key: Route; label: string; icon: typeof Store; role: string }[] = [
  { key: 'store', label: 'Tienda', icon: Store, role: 'Consumidor' },
  { key: 'wallet', label: 'Billetera', icon: Wallet, role: 'Consumidor' },
  { key: 'market', label: 'Mercado P2P', icon: LineChart, role: 'Trader' },
  { key: 'history', label: 'Historial', icon: History, role: 'Consumidor' },
  { key: 'tpv', label: 'TPV Canje', icon: ScanLine, role: 'Comercio' },
  { key: 'admin', label: 'Admin B2B', icon: Settings, role: 'Comercio' },
  { key: 'audit', label: 'Auditoría', icon: ClipboardCheck, role: 'Comercio' },
];

function useHashRoute(): [Route, (r: Route) => void] {
  const parse = (): Route => {
    const h = window.location.hash.replace('#/', '');
    return (NAV.find((n) => n.key === h)?.key ?? 'store') as Route;
  };
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = (r: Route) => {
    window.location.hash = `#/${r}`;
    setRoute(r);
  };
  return [route, nav];
}

export function App() {
  const session = useSession();
  const [route, nav] = useHashRoute();

  if (session.loading || !session.config) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando plataforma SMCTA…
      </div>
    );
  }

  return (
    <TenantThemeProvider config={session.config}>
      <div className="min-h-full">
        <header className="bg-[var(--smcta-brand-primary)] text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="grid h-9 w-9 place-items-center rounded-brand font-black"
                style={{ background: 'var(--smcta-brand-accent)' }}
              >
                S
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">{session.config.companyName}</div>
                <div className="text-[11px] opacity-70">SMCTA · Mercado P2P White-Label</div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <select
                aria-label="Tenant"
                value={session.tenant ?? ''}
                onChange={(e) => session.setTenant(e.target.value)}
                className="rounded-brand bg-white/10 px-2 py-1.5 text-sm outline-none"
              >
                {session.tenants.map((t) => (
                  <option key={t.subdomain} value={t.subdomain} className="text-slate-900">
                    {t.companyName}
                  </option>
                ))}
              </select>
              <select
                aria-label="Usuario"
                value={session.user?.userId ?? ''}
                onChange={(e) => session.setUser(e.target.value)}
                className="rounded-brand bg-white/10 px-2 py-1.5 text-sm outline-none"
              >
                {session.users.map((u) => (
                  <option key={u.userId} value={u.userId} className="text-slate-900">
                    {u.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className="mx-auto max-w-6xl px-2">
            <div className="flex flex-wrap gap-1 pb-2">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = route === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => nav(n.key)}
                    className={`flex items-center gap-1.5 rounded-brand px-3 py-1.5 text-sm transition ${
                      active ? 'bg-white text-[var(--smcta-brand-primary)]' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    {n.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          {route === 'store' && <Storefront />}
          {route === 'wallet' && <WalletPage />}
          {route === 'market' && <Marketplace />}
          {route === 'history' && <HistoryPage />}
          {route === 'admin' && <AdminPortal />}
          {route === 'tpv' && <TpvPage />}
          {route === 'audit' && <AuditPage />}
        </main>
      </div>
    </TenantThemeProvider>
  );
}
