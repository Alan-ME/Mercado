export interface CoffeeProduct {
  id: string;
  name: string;
  symbol: string;
  category: 'Espresso' | 'Con leche' | 'Frío' | 'Postres' | 'Combos';
  categoryTag: string;
  tagColor: string;
  glowGradient: string;
  image: string;
  description: string;
  price: number;
  change24h: number;
  changeWeek: number;
  minWeek: number;
  maxWeek: number;
  ordersToday: number;
  history: number[];
  badge?: string;
  badgeColor?: string;
  extractionNotes?: string;
}

export const COFFEE_PRODUCTS: CoffeeProduct[] = [
  {
    id: 'p-combo',
    name: 'COMBO ESPRESSO + MEDIALUNA',
    symbol: 'CMB-MED',
    category: 'Combos',
    categoryTag: 'DESAYUNO',
    tagColor: '#F59E0B',
    badge: 'RECOMENDADO',
    badgeColor: '#F59E0B',
    glowGradient: 'from-amber-500/35 via-amber-600/15 to-transparent',
    image: '/images/carta/1.png',
    price: 4.9,
    change24h: 3.2,
    changeWeek: 7.5,
    minWeek: 4.4,
    maxWeek: 4.95,
    ordersToday: 185,
    history: [4.45, 4.55, 4.7, 4.65, 4.8, 4.85, 4.9],
    description:
      'Pack express de mañanas intensas. Doble espresso de origen colombiano con medialuna de manteca recién horneada.',
    extractionNotes: 'Doble shot · Medialuna hojaldrada manteca pura',
  },
  {
    id: 'p-sandwich',
    name: 'SÁNDWICH + LATTE',
    symbol: 'CMB-LAT',
    category: 'Combos',
    categoryTag: 'MEDIODÍA',
    tagColor: '#A855F7',
    badge: 'MEDIODÍA',
    badgeColor: '#A855F7',
    glowGradient: 'from-purple-600/35 via-fuchsia-600/15 to-transparent',
    image: '/images/carta/2.png',
    price: 4.2,
    change24h: -1.1,
    changeWeek: 2.4,
    minWeek: 4.1,
    maxWeek: 4.4,
    ordersToday: 210,
    history: [4.35, 4.28, 4.22, 4.15, 4.18, 4.25, 4.2],
    description:
      'Sándwich caliente del día acompañado por un latte vainilla. Se sirve hasta las 15h en la barra.',
    extractionNotes: 'Pan brioche tostado · Latte vainilla natural 220ml',
  },
  {
    id: 'p-mokaccino-promo',
    name: 'MOKACCINO',
    symbol: 'MOK-PRO',
    category: 'Con leche',
    categoryTag: 'CON LECHE',
    tagColor: '#00D9A3',
    badge: 'RECOMENDADO',
    badgeColor: '#00D9A3',
    glowGradient: 'from-teal-500/35 via-emerald-600/15 to-transparent',
    image: '/images/carta/3.png',
    price: 4.9,
    change24h: 5.7,
    changeWeek: 12.4,
    minWeek: 4.3,
    maxWeek: 4.95,
    ordersToday: 289,
    history: [4.3, 4.45, 4.5, 4.7, 4.65, 4.85, 4.9],
    description:
      'Nuestro barista eligió el mokaccino: espresso, chocolate belga y leche cremosa. Se agota rápido, calculá.',
    extractionNotes: 'Espresso single · Chocolate 70% belga · Leche texturizada',
  },
  {
    id: 'p-affogato',
    name: 'AFFOGATO',
    symbol: 'AFF-VAN',
    category: 'Postres',
    categoryTag: 'POSTRES',
    tagColor: '#EF4444',
    glowGradient: 'from-rose-600/35 via-red-600/15 to-transparent',
    image: '/images/carta/4.png',
    price: 6.2,
    change24h: 7.3,
    changeWeek: 11.2,
    minWeek: 5.7,
    maxWeek: 6.3,
    ordersToday: 142,
    history: [5.75, 5.88, 6.0, 5.95, 6.1, 6.18, 6.2],
    description: 'Bocha de crema ahogada en espresso caliente recién tirado.',
    extractionNotes: 'Helado artesanal crema americana · Espresso doppio',
  },
  {
    id: 'p-mokaccino-carta',
    name: 'MOKACCINO',
    symbol: 'MOK-CLS',
    category: 'Con leche',
    categoryTag: 'CON LECHE',
    tagColor: '#F59E0B',
    glowGradient: 'from-amber-600/35 via-orange-600/15 to-transparent',
    image: '/images/carta/5.png',
    price: 4.9,
    change24h: 4.1,
    changeWeek: 8.8,
    minWeek: 4.5,
    maxWeek: 4.95,
    ordersToday: 240,
    history: [4.55, 4.65, 4.7, 4.68, 4.82, 4.88, 4.9],
    description: 'Mezcla de espresso, chocolate belga y leche cremosa.',
    extractionNotes: 'Chocolate amargo derretido al vapor · 180ml',
  },
  {
    id: 'p-matcha',
    name: 'MATCHA LATTE',
    symbol: 'MAT-LAT',
    category: 'Frío',
    categoryTag: 'FRÍO',
    tagColor: '#22C55E',
    glowGradient: 'from-emerald-500/35 via-green-600/15 to-transparent',
    image: '/images/carta/6.png',
    price: 5.1,
    change24h: 2.0,
    changeWeek: 5.1,
    minWeek: 4.8,
    maxWeek: 5.2,
    ordersToday: 178,
    history: [4.85, 4.92, 5.0, 4.98, 5.05, 5.1],
    description: 'Té matcha ceremonial japonés con leche espumada.',
    extractionNotes: 'Grado ceremonial Uji Japón · Leche de avena o entera',
  },
  {
    id: 'p-espresso',
    name: 'ESPRESSO ORIGEN COLOMBIA',
    symbol: 'ESP-COL',
    category: 'Espresso',
    categoryTag: 'ESPRESSO',
    tagColor: '#00D9A3',
    glowGradient: 'from-teal-600/35 via-cyan-600/15 to-transparent',
    image: '/images/carta/7.png',
    price: 2.8,
    change24h: 2.4,
    changeWeek: 8.1,
    minWeek: 2.55,
    maxWeek: 2.83,
    ordersToday: 342,
    history: [2.58, 2.64, 2.7, 2.68, 2.74, 2.78, 2.8],
    description: 'Notas a chocolate amargo y frutos rojos. Cuerpo sedoso.',
    extractionNotes: 'Doble shot · 18g café · extracción 26 segundos',
  },
];

export function findCoffeeById(id: string): CoffeeProduct | undefined {
  return COFFEE_PRODUCTS.find((p) => p.id === id);
}
