import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { TenantConfigDTO } from '@smcta/shared';
import { api, type DevTenant, type DevUser } from '../api/client';

interface SessionState {
  tenants: DevTenant[];
  tenant: string | null; // subdominio activo
  config: TenantConfigDTO | null;
  users: DevUser[];
  user: DevUser | null;
  loading: boolean;
  setTenant: (subdomain: string) => void;
  setUser: (userId: string) => void;
  reloadConfig: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

const LS_TENANT = 'smcta.tenant';
const LS_USER = 'smcta.user';

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo incógnito estricto o almacenamiento bloqueado: no rompemos la app por no poder recordar la sesión.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<DevTenant[]>([]);
  const [tenant, setTenantState] = useState<string | null>(null);
  const [config, setConfig] = useState<TenantConfigDTO | null>(null);
  const [users, setUsers] = useState<DevUser[]>([]);
  const [user, setUserState] = useState<DevUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial de tenants.
  useEffect(() => {
    void (async () => {
      const list = await api.getTenants();
      setTenants(list);
      const saved = lsGet(LS_TENANT);
      const initial =
        list.find((t) => t.subdomain === saved) ??
        list.find((t) => t.subdomain === 'cafeteria') ??
        list[0];
      if (initial) setTenantState(initial.subdomain);
      setLoading(false);
    })();
  }, []);

  const loadTenantData = useCallback(async (subdomain: string) => {
    const [cfg, us] = await Promise.all([api.getConfig(subdomain), api.getUsers(subdomain)]);
    setConfig(cfg);
    setUsers(us);
    const savedUser = lsGet(LS_USER);
    const initialUser = us.find((u) => u.userId === savedUser) ?? us[0] ?? null;
    setUserState(initialUser);
  }, []);

  useEffect(() => {
    if (tenant) void loadTenantData(tenant);
  }, [tenant, loadTenantData]);

  const setTenant = useCallback((subdomain: string) => {
    lsSet(LS_TENANT, subdomain);
    setTenantState(subdomain);
  }, []);

  const setUser = useCallback(
    (userId: string) => {
      const u = users.find((x) => x.userId === userId) ?? null;
      if (u) {
        lsSet(LS_USER, u.userId);
        setUserState(u);
      }
    },
    [users],
  );

  const reloadConfig = useCallback(async () => {
    if (tenant) setConfig(await api.getConfig(tenant));
  }, [tenant]);

  return (
    <SessionContext.Provider
      value={{ tenants, tenant, config, users, user, loading, setTenant, setUser, reloadConfig }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}
