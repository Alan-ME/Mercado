import { Loader2, ShoppingBag, Trash2, X, ShieldCheck } from 'lucide-react';
import { useCart } from '../state/cart';
import { Button, money } from '../ui/kit';

export function CartDrawer() {
  const { items, isOpen, isCheckingOut, totalAmount, closeCart, removeFromCart, checkout } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-primary text-black">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Tu Pedido</h2>
              <p className="text-xs text-muted">Emisión primaria en mostrador</p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-fg"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <ShoppingBag size={48} className="text-muted/40" />
              <p className="mt-3 text-sm font-semibold text-fg">Tu carrito está vacío</p>
              <p className="mt-1 text-xs text-muted">
                Elegí algún combo de la barra o de la carta para empezar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-raised/50 p-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-14 w-14 rounded-lg object-cover bg-black/40"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-fg truncate">{product.name}</h4>
                    <p className="text-[11px] text-muted">
                      {quantity} x {money(product.price)}
                    </p>
                    <p className="text-xs font-extrabold text-brand-accent tabular-nums">
                      {money(product.price * quantity)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1.5 text-muted hover:text-down"
                    title="Quitar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line pt-4 space-y-3">
            <div className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-xs text-muted flex items-start gap-2">
              <ShieldCheck size={16} className="text-warn shrink-0 mt-0.5" />
              <span>
                El 100% del pago queda bajo custodia segregada en <strong>Escrow</strong> hasta que
                canjees tu QR en barra.
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Total a emitir:</span>
              <span className="text-xl font-extrabold text-fg tabular-nums">
                {money(totalAmount)}
              </span>
            </div>

            <Button
              className="w-full justify-center bg-brand-accent text-black font-extrabold hover:brightness-110"
              onClick={() => void checkout()}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Emitiendo en Escrow...
                </>
              ) : (
                'Confirmar Pedido'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
