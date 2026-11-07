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
  // En v2.2 el precio de carta es fijo; lo que se mide es la demanda real de barra + trueques P2P
  change24h: number;
  changeWeek: number;
  ordersToday: number;
  p2pOpenOffers: number;
  p2pWantedBy: number;
  topSwaps: string;
  tradeRewardGold: number;
  demandByRange: {
    '1D': number[];
    '1S': number[];
    '1M': number[];
  };
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
    change24h: 14,
    changeWeek: 22,
    ordersToday: 185,
    p2pOpenOffers: 8,
    p2pWantedBy: 24,
    topSwaps: 'Matcha Latte · Sándwich + Latte',
    tradeRewardGold: 50,
    demandByRange: {
      '1D': [18, 34, 62, 95, 130, 162, 185],
      '1S': [135, 148, 160, 154, 171, 179, 185],
      '1M': [110, 125, 142, 158, 165, 174, 185],
    },
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
    change24h: 11,
    changeWeek: 19,
    ordersToday: 210,
    p2pOpenOffers: 5,
    p2pWantedBy: 31,
    topSwaps: 'Mokaccino · Combo Medialuna',
    tradeRewardGold: 45,
    demandByRange: {
      '1D': [12, 28, 74, 128, 166, 194, 210],
      '1S': [165, 172, 184, 179, 195, 202, 210],
      '1M': [140, 152, 168, 175, 188, 198, 210],
    },
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
    change24h: 24,
    changeWeek: 35,
    ordersToday: 289,
    p2pOpenOffers: 11,
    p2pWantedBy: 42,
    topSwaps: 'Affogato · Matcha Latte',
    tradeRewardGold: 50,
    demandByRange: {
      '1D': [30, 68, 115, 164, 215, 258, 289],
      '1S': [210, 228, 240, 252, 265, 278, 289],
      '1M': [175, 194, 218, 235, 250, 271, 289],
    },
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
    change24h: 19,
    changeWeek: 28,
    ordersToday: 142,
    p2pOpenOffers: 4,
    p2pWantedBy: 27,
    topSwaps: 'Mokaccino · Espresso Colombia',
    tradeRewardGold: 65,
    demandByRange: {
      '1D': [10, 22, 45, 72, 98, 124, 142],
      '1S': [98, 106, 115, 112, 126, 135, 142],
      '1M': [82, 94, 105, 114, 122, 133, 142],
    },
    description: 'Bocha de crema ahogada en espresso caliente recién tirado.',
    extractionNotes: 'Helado artesanal crema americana · Espresso doppio',
  },
  {
    id: 'p-mokaccino-carta',
    name: 'MOKACCINO CLÁSICO',
    symbol: 'MOK-CLS',
    category: 'Con leche',
    categoryTag: 'CON LECHE',
    tagColor: '#F59E0B',
    glowGradient: 'from-amber-600/35 via-orange-600/15 to-transparent',
    image: '/images/carta/5.png',
    price: 4.9,
    change24h: 16,
    changeWeek: 21,
    ordersToday: 240,
    p2pOpenOffers: 9,
    p2pWantedBy: 29,
    topSwaps: 'Sándwich + Latte · Matcha Latte',
    tradeRewardGold: 50,
    demandByRange: {
      '1D': [25, 58, 96, 138, 182, 214, 240],
      '1S': [182, 195, 208, 204, 221, 232, 240],
      '1M': [150, 168, 185, 198, 212, 228, 240],
    },
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
    change24h: 18,
    changeWeek: 26,
    ordersToday: 178,
    p2pOpenOffers: 6,
    p2pWantedBy: 19,
    topSwaps: 'Combo Medialuna · Affogato',
    tradeRewardGold: 55,
    demandByRange: {
      '1D': [22, 48, 79, 108, 136, 159, 178],
      '1S': [124, 138, 152, 146, 164, 178],
      '1M': [95, 112, 128, 141, 155, 168, 178],
    },
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
    change24h: 15,
    changeWeek: 29,
    ordersToday: 342,
    p2pOpenOffers: 14,
    p2pWantedBy: 38,
    topSwaps: 'Medialuna · Alfajor · Mokaccino',
    tradeRewardGold: 30,
    demandByRange: {
      '1D': [45, 92, 148, 205, 260, 308, 342],
      '1S': [250, 268, 285, 279, 304, 325, 342],
      '1M': [210, 232, 255, 278, 296, 318, 342],
    },
    description: 'Notas a chocolate amargo y frutos rojos. Cuerpo sedoso.',
    extractionNotes: 'Doble shot · 18g café · extracción 26 segundos',
  },
];

export function findCoffeeById(id: string): CoffeeProduct | undefined {
  return COFFEE_PRODUCTS.find((p) => p.id === id);
}
