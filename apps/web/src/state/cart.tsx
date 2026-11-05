import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { CoffeeProduct } from '../data/coffeeCatalog';
import { useSession } from './session';
import { api, ApiError } from '../api/client';
import { useToast } from '../ui/toast';

export interface CartItem {
  product: CoffeeProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  isCheckingOut: boolean;
  totalAmount: number;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: CoffeeProduct) => void;
  removeFromCart: (productId: string) => void;
  checkout: () => Promise<boolean>;
}

const CartContext = createContext<CartContextValue | null>(null);

function formatOrderError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Error al procesar compra';
}

async function emitSingleItem(item: CartItem, buyerId: string, tenant: string) {
  for (let q = 0; q < item.quantity; q++) {
    await api.checkout(tenant, {
      nominalPrice: item.product.price,
      buyerId,
      productName: item.product.name,
    });
  }
}

async function emitAllItems(items: CartItem[], buyerId: string, tenant: string) {
  for (const item of items) {
    await emitSingleItem(item, buyerId, tenant);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user, tenant, reloadConfig } = useSession();
  const toast = useToast();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product: CoffeeProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const totalAmount = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  const checkout = useCallback(async (): Promise<boolean> => {
    if (!user || !tenant) {
      toast.error('Seleccioná un usuario y comercio antes de confirmar tu pedido');
      return false;
    }
    if (items.length === 0) return false;

    setIsCheckingOut(true);
    try {
      await emitAllItems(items, user.userId, tenant);
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);
      toast.success(
        `¡Pedido confirmado! Se emitieron ${totalQty} cupones bajo custodia en tu Billetera.`,
      );
      setItems([]);
      setIsOpen(false);
      void reloadConfig();
      return true;
    } catch (err) {
      toast.error(formatOrderError(err));
      return false;
    } finally {
      setIsCheckingOut(false);
    }
  }, [user, items, toast, reloadConfig]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isCheckingOut,
        totalAmount,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
