import { useState, type ReactElement } from 'react';
import {
  ChevronRight,
  Globe,
  Lock,
  Moon,
  Palette,
  Search,
  Shield,
  Sun,
  TrendingUp,
  User,
} from 'lucide-react';
import { useSession } from '../state/session';
import { useColorMode } from '../theme/colorMode';
import { Badge, Card, money } from '../ui/kit';

type SettingsTab = 'account' | 'security' | 'privacy' | 'appearance' | 'trading';

interface NavItem {
  id: SettingsTab;
  title: string;
  icon: typeof User;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'account', title: 'Cuenta', icon: User },
  { id: 'security', title: 'Seguridad y acceso', icon: Lock },
  { id: 'privacy', title: 'Privacidad y seguridad', icon: Shield },
  { id: 'appearance', title: 'Apariencia e idiomas', icon: Palette },
  { id: 'trading', title: 'Trading Desk & Mercados', icon: TrendingUp },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [search, setSearch] = useState('');

  const filtered = NAV_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-6">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-panel md:grid-cols-12 min-h-[620px]">
        {/* Columna A: Lista Master (estilo Twitter / X Ajustes) */}
        <div className="border-b border-line md:col-span-5 md:border-b-0 md:border-r">
          <div className="p-5">
            <h1 className="text-xl font-black text-fg">Ajustes</h1>
            <div className="relative mt-3">
              <Search size={16} className="absolute left-3 top-3 text-muted" />
              <input
                type="text"
                placeholder="Buscar ajustes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-line bg-canvas py-2 pl-9 pr-3 text-xs text-fg placeholder-muted outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <nav className="divide-y divide-line/40 border-t border-line">
            {filtered.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-raised/80 text-brand-primary'
                      : 'text-fg hover:bg-raised/40 hover:text-fg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isSelected ? 'text-brand-primary' : 'text-muted'} />
                    <span>{item.title}</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Columna B: Detalle Master-Detail (el bloque B marcado en rojo por el usuario) */}
        <div className="p-6 md:col-span-7 bg-canvas/30">
          <DetailPane tab={activeTab} />
        </div>
      </div>
    </div>
  );
}

const DETAIL_MAP: Record<SettingsTab, () => ReactElement | null> = {
  account: AccountDetail,
  security: SecurityDetail,
  privacy: PrivacyDetail,
  appearance: AppearanceDetail,
  trading: TradingDetail,
};

function DetailPane({ tab }: { tab: SettingsTab }) {
  const Comp = DETAIL_MAP[tab];
  return Comp ? <Comp /> : null;
}

function AccountDetail() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tu Cuenta"
        subtitle="Administrá tu identidad de usuario y el comercio activo en la red."
      />
      <div className="space-y-4">
        <UserSelector />
        <TenantSelector />
        <BalanceCard />
      </div>
    </div>
  );
}

function UserSelector() {
  const { user, users, setUser } = useSession();
  return (
    <div>
      <label className="text-xs font-bold text-muted uppercase tracking-wider">
        Usuario Activo (Simulador P2P)
      </label>
      <select
        value={user?.userId ?? ''}
        onChange={(e) => setUser(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-panel p-3 text-sm font-semibold text-fg outline-none focus:border-brand-primary"
      >
        {users.map((u) => (
          <option key={u.userId} value={u.userId}>
            {u.displayName} ({u.email})
          </option>
        ))}
      </select>
    </div>
  );
}

function TenantSelector() {
  const { tenant, tenants, setTenant } = useSession();
  return (
    <div>
      <label className="text-xs font-bold text-muted uppercase tracking-wider">
        Comercio / Tenant Activo
      </label>
      <select
        value={tenant ?? ''}
        onChange={(e) => setTenant(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-panel p-3 text-sm font-semibold text-fg outline-none focus:border-brand-primary"
      >
        {tenants.map((t) => (
          <option key={t.subdomain} value={t.subdomain}>
            {t.companyName} ({t.subdomain})
          </option>
        ))}
      </select>
    </div>
  );
}

function BalanceCard() {
  return (
    <div className="rounded-xl border border-line bg-raised/50 p-4">
      <div className="text-xs text-muted">Saldo disponible en cuenta</div>
      <div className="mt-1 text-2xl font-black text-fg tabular-nums">
        {money(1000)}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Los fondos se debitan automáticamente al adquirir o pujar en el mercado P2P.
      </p>
    </div>
  );
}

function SecurityDetail() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Seguridad y Acceso"
        subtitle="Criptografía de emisión y resguardo de cupones contra fraude."
      />

      <div className="space-y-3 text-xs">
        <Card className="p-4">
          <div className="font-bold text-fg">Tokens QR Dinámicos (HMAC-SHA256)</div>
          <p className="mt-1 text-muted leading-relaxed">
            Cada cupón de tu billetera genera una firma temporal con rotación cada 90 segundos. Si
            alguien toma una captura de pantalla, el código expira y es rechazado por el lector TPV
            del mostrador.
          </p>
          <div className="mt-3">
            <Badge tone="up">Criptografía Activa</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-bold text-fg">Lector de Cámara Óptica</div>
          <p className="mt-1 text-muted leading-relaxed">
            El lector del mostrador (TPV) procesa el canje en milisegundos y quema el cupón
            atendiendo a la firma HMAC sin almacenar datos sensibles en el navegador.
          </p>
        </Card>
      </div>
    </div>
  );
}

function PrivacyDetail() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Privacidad y Custodia Segregada"
        subtitle="Invariante contable de Escrow y trazabilidad financiera inmutable."
      />

      <Card className="p-4 text-xs space-y-3">
        <div className="font-bold text-fg">Invariante de Balance Cero</div>
        <p className="text-muted leading-relaxed">
          El 100% de los fondos recibidos en emisiones primarias y secundarias permanece custodiado
          en el ledger contable hasta el instante del canje o la liquidación atómica.
        </p>
        <div className="rounded-lg bg-canvas p-3 font-mono text-[11px] text-brand-accent">
          Balance Escrow = Total Emitido - Total Canjeado = $0.00
        </div>
      </Card>
    </div>
  );
}

function AppearanceDetail() {
  const { mode, toggle } = useColorMode();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Apariencia e Idioma"
        subtitle="Personalizá el contraste y la presentación de la interfaz."
      />

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider">
            Tema Visual
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => mode !== 'dark' && toggle()}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-extrabold transition-all ${
                mode === 'dark'
                  ? 'border-brand-primary bg-raised text-brand-primary'
                  : 'border-line bg-panel text-muted hover:text-fg'
              }`}
            >
              <Moon size={16} /> Modo Oscuro (Terminal)
            </button>
            <button
              onClick={() => mode !== 'light' && toggle()}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-extrabold transition-all ${
                mode === 'light'
                  ? 'border-brand-primary bg-raised text-brand-primary'
                  : 'border-line bg-panel text-muted hover:text-fg'
              }`}
            >
              <Sun size={16} /> Modo Claro
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider">
            Idioma del Sistema
          </label>
          <div className="mt-1.5 flex items-center justify-between rounded-xl border border-line bg-panel p-3 text-xs">
            <div className="flex items-center gap-2 text-fg font-semibold">
              <Globe size={16} className="text-muted" /> Español (Rioplatense / Latam)
            </div>
            <Badge tone="neutral">Activo</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradingDetail() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Accesos Directos de Trading"
        subtitle="Navegación rápida a las mesas de liquidez y liquidación del recinto."
      />

      <div className="grid gap-3 sm:grid-cols-2 text-xs">
        <NavCard
          title="Billetera de Activos"
          desc="Tus cupones en custodia y códigos QR para canje."
          hash="#/wallet"
        />
        <NavCard
          title="Mercado P2P"
          desc="Libro de órdenes de compra/venta y Price Collar."
          hash="#/market"
        />
        <NavCard
          title="Terminal TPV Canje"
          desc="Escáner óptico de mostrador para validar pedidos."
          hash="#/tpv"
        />
        <NavCard
          title="Panel de Auditoría"
          desc="Invariante contable de escrow y métricas financieras."
          hash="#/audit"
        />
      </div>
    </div>
  );
}

function NavCard({ title, desc, hash }: { title: string; desc: string; hash: string }) {
  return (
    <button
      onClick={() => (window.location.hash = hash)}
      className="flex flex-col text-left rounded-xl border border-line bg-panel p-4 hover:border-brand-primary transition-colors"
    >
      <div className="font-bold text-fg">{title}</div>
      <div className="mt-1 text-muted text-[11px] leading-relaxed">{desc}</div>
      <div className="mt-3 text-[11px] font-extrabold text-brand-accent">Abrir panel →</div>
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-line pb-4">
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>
    </div>
  );
}
