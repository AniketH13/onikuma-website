export const defaultCategories = [
  {
    name: 'Gaming Headsets',
    slug: 'gaming-headsets',
    icon: '🎧',
    parent: null,
    description: 'Pro 7.1 Virtual Surround Sound Gaming Headsets with Noise Canceling Microphones',
    order: 1
  },
  {
    name: 'Cat-Ear Series',
    slug: 'cat-ear-series',
    icon: '🐱',
    parent: null,
    description: 'Iconic Onikuma signature pastel pink & purple detachable Cat Ear RGB gear',
    order: 2
  },
  {
    name: 'Mechanical Keyboards',
    slug: 'keyboards',
    icon: '⌨️',
    parent: null,
    description: 'Ultra-responsive clicky blue & linear red switches with dynamic RGB backlighting',
    order: 3
  },
  {
    name: 'Gaming Mice',
    slug: 'gaming-mice',
    icon: '🖱️',
    parent: null,
    description: 'High-precision optical sensors, customizable DPI, and lightweight honeycomb shells',
    order: 4
  },
  {
    name: 'Headset Stands & Hubs',
    slug: 'headset-stands',
    icon: '🗼',
    parent: null,
    description: 'RGB desktop organizers with built-in USB hubs and 3.5mm audio ports',
    order: 5
  },
  {
    name: 'Gaming Earbuds & TWS',
    slug: 'earbuds',
    icon: '⚡',
    parent: null,
    description: 'Ultra-low latency Bluetooth 5.3 gaming earphones with touch controls',
    order: 6
  },
  {
    name: 'Deskmats & Accessories',
    slug: 'accessories',
    icon: '🎮',
    parent: null,
    description: 'Extended speed-surface mousepads, replacement cushions, and audio splitters',
    order: 7
  }
];

export const defaultProducts = [
  {
    title: 'ONIKUMA K9 Pink Cat Ear RGB Gaming Headset',
    modelCode: 'K9-PINK',
    slug: 'onikuma-k9-pink-cat-ear-headset',
    category: 'Cat-Ear Series',
    categorySlug: 'cat-ear-series',
    regularPrice: 4800,
    salePrice: 3199,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
    ],
    badge: 'Cat-Ear',
    inStock: true,
    stockCount: 28,
    rating: 4.9,
    reviewCount: 84,
    shortDesc: 'Iconic cute detachable cat ears with dynamic RGB LED breathing glow, 50mm neodymium audio drivers, and retractable noise-canceling mic.',
    description: 'The ONIKUMA K9 Pink is the viral gaming headset designed for gamers, streamers, and audiophiles who demand both killer looks and pristine audio precision. Equipped with custom-tuned 50mm magnetic neodymium drivers for rich bass and 360-degree acoustic positioning. Features removable silicone cat ears, memory foam ear cushions, and universal 3.5mm compatibility.',
    features: [
      'Detachable high-grade silicone cat ears',
      '50mm High-flux acoustic drivers',
      'Multi-color RGB glowing earcups',
      '360° Retractable noise-isolating microphone',
      'Breathable memory foam headband & earcups'
    ],
    specs: {
      driver: '50mm High-definition Neodymium',
      connectivity: '3.5mm Audio/Mic Jack + USB (for RGB Lighting)',
      lighting: 'Dynamic Multi-color Breathing RGB',
      microphone: '360° Flexible Omnidirectional Noise-Canceling',
      compatibility: 'PC, PS4, PS5, Xbox One, Nintendo Switch, iPhone, Android',
      cableLength: '2.2m Ultra-durable Braided Fiber Cable',
      weight: '390g'
    },
    isDeal: true,
    isFeatured: true,
    isCatEarSpecial: true
  },
  {
    title: 'ONIKUMA K10 Pro RGB 7.1 Surround Gaming Headset',
    modelCode: 'K10-PRO',
    slug: 'onikuma-k10-pro-rgb-gaming-headset',
    category: 'Gaming Headsets',
    categorySlug: 'gaming-headsets',
    regularPrice: 4200,
    salePrice: 2850,
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
    ],
    badge: 'Best Seller',
    inStock: true,
    stockCount: 45,
    rating: 4.8,
    reviewCount: 62,
    shortDesc: 'Tournament-ready 7.1 surround sound gaming headset with camouflage stealth detailing and enhanced crystal-clear footsteps positioning.',
    description: 'Engineered for competitive esports titles like PUBG, Valorant, CS2, and Apex Legends. The ONIKUMA K10 Pro delivers pin-point spatial audio accuracy so you never miss an enemy flank. Deep punchy sub-bass gives explosions real cinematic weight.',
    features: [
      '7.1 Virtual Spatial Surround Sound',
      'Military-inspired stealth design with RGB glow',
      'Ultra-soft protein leather ear cushions',
      'In-line audio control wheel and mic mute toggle',
      'Anti-tangle braided cable'
    ],
    specs: {
      driver: '50mm Custom Neodymium Driver',
      connectivity: '3.5mm Gold-plated Audio + USB (LED Power)',
      lighting: 'Cybernetic Flowing RGB',
      microphone: '120° Adjustable High-Sensitivity Mic',
      compatibility: 'PC, Laptops, Consoles, Tablets',
      cableLength: '2.2m Braided Cable',
      weight: '375g'
    },
    isDeal: true,
    isFeatured: true,
    isCatEarSpecial: false
  },
  {
    title: 'ONIKUMA X15 Pro Cyber RGB Gaming Headset with Cat Decals',
    modelCode: 'X15-PRO',
    slug: 'onikuma-x15-pro-cyber-gaming-headset',
    category: 'Gaming Headsets',
    categorySlug: 'gaming-headsets',
    regularPrice: 3900,
    salePrice: 2499,
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
    ],
    badge: 'Sale',
    inStock: true,
    stockCount: 30,
    rating: 4.7,
    reviewCount: 41,
    shortDesc: 'Ergonomic dual-suspension steel beam headband with breathable mesh earcups and dual RGB rings.',
    description: 'The ONIKUMA X15 Pro combines futuristic cyber aesthetic with featherlight weight distribution. The dual-beam suspension headband automatically contours to any head shape without clamping fatigue.',
    features: [
      'Suspension auto-adjusting steel headband',
      'Dual circular RGB halo lighting rings',
      'Enhanced bass resonance chamber',
      'High-clarity cardioid pickup microphone'
    ],
    specs: {
      driver: '50mm Directional Drivers',
      connectivity: '3.5mm + USB (Lighting)',
      lighting: 'Dual-zone Dynamic Halo RGB',
      microphone: 'Flexible Omnidirectional Mic',
      compatibility: 'Universal 3.5mm Compatible',
      cableLength: '2.0m Braided Cord',
      weight: '310g'
    },
    isDeal: true,
    isFeatured: true,
    isCatEarSpecial: false
  },
  {
    title: 'ONIKUMA B90 Wireless Bluetooth Cat Ear Headset (Purple/Pink)',
    modelCode: 'B90-PURPLE',
    slug: 'onikuma-b90-wireless-bluetooth-cat-ear-headset',
    category: 'Cat-Ear Series',
    categorySlug: 'cat-ear-series',
    regularPrice: 5500,
    salePrice: 3799,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
    ],
    badge: 'Hot',
    inStock: true,
    stockCount: 19,
    rating: 4.9,
    reviewCount: 95,
    shortDesc: 'Bluetooth 5.0 wireless freedom with illuminated LED cat ears, 24-hour battery life, and foldable travel design.',
    description: 'Take your streaming and music everywhere with the wireless ONIKUMA B90. Built-in LED lights on both ears and earcups pulsate with music rhythm. Delivers up to 24 hours of non-stop playback on a single charge.',
    features: [
      'Low latency Bluetooth 5.0 wireless connection',
      'Integrated LED cat ear illumination',
      'Foldable and portable travel structure',
      'Built-in HD voice microphone for calls & Discord',
      'Dual-mode: Wireless Bluetooth or Wired 3.5mm backup'
    ],
    specs: {
      driver: '40mm High Precision Driver',
      connectivity: 'Bluetooth 5.0 + 3.5mm AUX Backup',
      lighting: 'Glowing Cat Ear & Cup LED',
      microphone: 'Built-in Noise Reduction Mic',
      compatibility: 'iOS, Android, Windows, Mac, Laptops',
      cableLength: 'Wireless (10m range) + 1.2m AUX cable',
      weight: '290g'
    },
    isDeal: false,
    isFeatured: true,
    isCatEarSpecial: true
  },
  {
    title: 'ONIKUMA G26 Mechanical Gaming Keyboard (Blue Switch RGB)',
    modelCode: 'G26-RGB',
    slug: 'onikuma-g26-mechanical-gaming-keyboard',
    category: 'Mechanical Keyboards',
    categorySlug: 'keyboards',
    regularPrice: 5200,
    salePrice: 3599,
    images: [
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
    ],
    badge: 'Best Seller',
    inStock: true,
    stockCount: 22,
    rating: 4.8,
    reviewCount: 57,
    shortDesc: 'Full-size 104-key mechanical keyboard with tactile clicky blue switches, aluminum top plate, and 20 RGB backlight modes.',
    description: 'Every keystroke registers with crisp, satisfying tactile feedback. The ONIKUMA G26 features 100% anti-ghosting with full N-key rollover, double-injection molded keycaps that never fade, and sturdy brushed metallic alloy frame.',
    features: [
      '104-Key Full Size layout with numeric keypad',
      'Tactile Clicky Blue Mechanical Switches (50M Keystroke Lifespan)',
      '20 Preset RGB backlight effects with speed/brightness adjustments',
      'Solid Aircraft-grade Aluminum Top Cover',
      'Full Anti-Ghosting N-Key Rollover'
    ],
    specs: {
      driver: 'Mechanical Clicky Blue Switches',
      connectivity: 'Gold-Plated USB Wired',
      lighting: 'Multi-zone Dynamic RGB with 20 Modes',
      microphone: 'N/A',
      compatibility: 'Windows 11, 10, 8, 7, Mac OS',
      cableLength: '1.8m Heavy-Duty Braided Cable',
      weight: '890g'
    },
    isDeal: true,
    isFeatured: true,
    isCatEarSpecial: false
  },
  {
    title: 'ONIKUMA CW905 Wireless/Wired RGB Gaming Mouse',
    modelCode: 'CW905-RGB',
    slug: 'onikuma-cw905-rgb-gaming-mouse',
    category: 'Gaming Mice',
    categorySlug: 'gaming-mice',
    regularPrice: 2800,
    salePrice: 1750,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'
    ],
    badge: 'Sale',
    inStock: true,
    stockCount: 50,
    rating: 4.8,
    reviewCount: 73,
    shortDesc: 'Ergonomic gaming mouse with 6 customizable DPI levels up to 6400 DPI, 7 programmable buttons, and breathing RGB light cycles.',
    description: 'Crafted with a sweat-resistant matte surface and thumb rest, the CW905 provides unmatched ergonomic comfort for long gaming sessions. Instant on-the-fly DPI switching allows flawless transitions between sniper precision and high-speed twitch reflexes.',
    features: [
      '6 DPI Levels: 800 - 1600 - 2400 - 3200 - 4800 - 6400 DPI',
      '7 Programmable buttons with rapid fire thumb trigger',
      '16.8M Color Breathing RGB lighting effects',
      'Ergonomic right-handed contour with anti-slip grip',
      'High-performance optical gaming sensor'
    ],
    specs: {
      driver: 'Advanced Optical Sensor (Up to 6400 DPI)',
      connectivity: 'High-speed USB Wired Interface',
      lighting: '16.8 Million Colors RGB Chroma',
      microphone: 'N/A',
      compatibility: 'Windows, Mac, Linux, PS5/PS4/Xbox (Mouse enabled games)',
      cableLength: '1.8m Braided Fiber Cable',
      weight: '135g'
    },
    isDeal: true,
    isFeatured: true,
    isCatEarSpecial: false
  },
  {
    title: 'ONIKUMA ST-2 Dual-Bracket RGB Gaming Headset Stand',
    modelCode: 'ST-2-RGB',
    slug: 'onikuma-st-2-dual-rgb-headset-stand',
    category: 'Headset Stands & Hubs',
    categorySlug: 'headset-stands',
    regularPrice: 3200,
    salePrice: 2150,
    images: [
      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
    ],
    badge: 'New',
    inStock: true,
    stockCount: 16,
    rating: 4.9,
    reviewCount: 38,
    shortDesc: 'Heavy-base RGB headset stand with dual USB 2.0 extension ports, 3.5mm audio jack, and 8 dynamic lighting modes.',
    description: 'Keep your gaming battlestation organized while adding glowing aesthetic ambiance. Features a weighted non-slip base that securely holds even heavy studio headphones, plus pass-through USB ports for plugging in mice, keyboards, or charging phones.',
    features: [
      '3-in-1 Desk Hub: 2x USB 2.0 Ports + 1x 3.5mm AUX Audio Jack',
      '8 Dynamic RGB Lighting Modes (Rainbow Flow, Breathing, Static Colors)',
      'Weighted metal core base with anti-slip rubber pads',
      'Touch-sensitive RGB mode switch button'
    ],
    specs: {
      driver: 'Built-in USB Hub & DAC Audio Pass-through',
      connectivity: 'USB Type-A Input (Powered)',
      lighting: '8-Mode Dynamic RGB Base & Stem',
      microphone: 'Supports 3.5mm TRRS Headset Audio/Mic',
      compatibility: 'Universal (Any Headset Brand)',
      cableLength: '1.5m Detachable USB Cable',
      weight: '420g Weighted Base'
    },
    isDeal: false,
    isFeatured: true,
    isCatEarSpecial: false
  },
  {
    title: 'ONIKUMA T306 Gaming TWS True Wireless Earbuds',
    modelCode: 'T306-TWS',
    slug: 'onikuma-t306-tws-gaming-earbuds',
    category: 'Gaming Earbuds & TWS',
    categorySlug: 'earbuds',
    regularPrice: 3500,
    salePrice: 2299,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
    ],
    badge: 'New',
    inStock: true,
    stockCount: 32,
    rating: 4.7,
    reviewCount: 29,
    shortDesc: 'Ultra-low 45ms gaming latency, Bluetooth 5.3, cyberpunk mecha charging case with LED power display and 28h battery life.',
    description: 'Designed specifically for mobile gaming (PUBG Mobile, Free Fire, Call of Duty Mobile). The ONIKUMA T306 eliminates audio lag with dedicated Game Mode, delivering instant gunshot and footsteps feedback with powerful punchy bass.',
    features: [
      'Ultra-Low 45ms Gaming Latency Game Mode',
      'Bluetooth 5.3 instant auto-pairing',
      'Futuristic Mecha sliding case with LED status',
      'Dual microphones with ENC call noise cancellation',
      'IPX5 sweatproof for workouts and gaming sessions'
    ],
    specs: {
      driver: '13mm Bio-Diaphragm Drivers',
      connectivity: 'Bluetooth 5.3 (Up to 12m range)',
      lighting: 'Charging Case Cyber Neon LEDs',
      microphone: 'Dual ENC Noise Canceling Microphones',
      compatibility: 'Android, iPhone, iPad, PC with Bluetooth',
      cableLength: 'Type-C Fast Charging Cable Included',
      weight: '45g (Case + Buds)'
    },
    isDeal: true,
    isFeatured: false,
    isCatEarSpecial: false
  }
];

export const defaultSettings = [
  { key: 'hotline', value: '9864006883' },
  { key: 'whatsapp', value: '9864006883' },
  { key: 'storeName', value: 'Onikuma Nepal' },
  { key: 'announcement', value: '🔥 Official Importer & Distributor of ONIKUMA Gaming in Nepal | Delivery Across All 77 Districts | WhatsApp Support: 9864006883' },
  { key: 'freeDeliveryThreshold', value: 3000 },
  { key: 'insideValleyDeliveryFee', value: 100 },
  { key: 'outsideValleyDeliveryFee', value: 200 },
  { key: 'promoCodes', value: [
    { code: 'ONIKUMA10', discountPercent: 10, minSpend: 1500 },
    { code: 'FIRSTORDER', discountPercent: 5, minSpend: 1000 }
  ]}
];
