import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    slug: 'professional-clinical-stethoscope-black',
    name: 'Professional Clinical Stethoscope (Black Edition)',
    sku: 'MED-10482',
    category: 'medical-equipment',
    categoryName: 'Medical Equipment',
    subcategory: 'stethoscopes',
    subcategoryName: 'Stethoscopes',
    productType: 'Stethoscope',
    price: 39.99,
    compareAtPrice: 49.99,
    rating: 4.9,
    reviewCount: 42,
    badge: 'Bestseller',
    brand: 'EVYS Clinical',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 65,
    isFeatured: true,
    isPromoEssential: true,
    shortDescription: 'Precision dual-head stainless steel stethoscope engineered for clear acoustic sound transmission during routine clinical examinations.',
    description: [
      'The EVYS Professional Clinical Stethoscope features an acoustic response designed for accurate heart, lung, and vascular auscultation.',
      'Manufactured with a precision-machined stainless steel chestpiece, durable dual-channel tubing, and soft-sealing silicone eartips for practitioner comfort.'
    ],
    features: [
      'Dual-head stainless steel chestpiece with non-chill rim',
      'High-sensitivity diaphragm and deep acoustic bell',
      'Flexible, latex-free dual lumen acoustic tubing',
      'Ergonomic binaural headset with soft silicone eartips'
    ],
    specifications: [
      { name: 'Product type', value: 'Clinical stethoscope' },
      { name: 'Material', value: 'Stainless steel & PVC' },
      { name: 'Use', value: 'Clinical examination' },
      { name: 'Colour', value: 'Obsidian Black' },
      { name: 'SKU', value: 'MED-10482' },
      { name: 'Chestpiece Weight', value: '85 g' },
      { name: 'Total Length', value: '71 cm' }
    ],
    images: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-002',
    slug: 'digital-automatic-blood-pressure-monitor',
    name: 'Automatic Upper Arm Digital Blood Pressure Monitor',
    sku: 'MED-10893',
    category: 'medical-equipment',
    categoryName: 'Medical Equipment',
    subcategory: 'blood-pressure-monitors',
    subcategoryName: 'Blood Pressure Monitors',
    productType: 'Blood Pressure Monitor',
    price: 49.50,
    compareAtPrice: 59.99,
    rating: 4.8,
    reviewCount: 38,
    badge: 'Popular',
    brand: 'EVYS Diagnostics',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 44,
    isFeatured: true,
    isPromoEssential: true,
    shortDescription: 'Accurate oscillometric upper arm blood pressure monitor with clear LCD screen, universal cuff, and irregular pulse detection.',
    description: [
      'A dependable automated blood pressure monitor suitable for clinical practice rooms, consultation rooms, and care environments.',
      'Includes an easy-wrap universal cuff (22–42 cm) and dual-user memory storage for up to 90 readings per profile.'
    ],
    features: [
      'Oscillometric automatic inflation and gentle deflation',
      'Wide-range universal arm cuff (22 - 42 cm)',
      'Dual-user memory storage (90 readings each)',
      'Clear high-contrast backlit LCD display'
    ],
    specifications: [
      { name: 'Product type', value: 'Upper arm blood pressure monitor' },
      { name: 'Measurement method', value: 'Oscillometric' },
      { name: 'Pressure Range', value: '0 - 299 mmHg (±3 mmHg)' },
      { name: 'Cuff Size', value: '22 - 42 cm circumference' },
      { name: 'Power source', value: '4x AA Batteries / USB-C DC input' },
      { name: 'SKU', value: 'MED-10893' }
    ],
    images: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-003',
    slug: 'binocular-biological-laboratory-microscope-1000x',
    name: 'Precision Binocular Biological Microscope (1000x)',
    sku: 'LAB-20941',
    category: 'laboratory',
    categoryName: 'Laboratory',
    subcategory: 'microscopes',
    subcategoryName: 'Microscopes',
    productType: 'Microscope',
    price: 385.00,
    compareAtPrice: 420.00,
    rating: 4.9,
    reviewCount: 26,
    badge: 'Popular',
    brand: 'EVYS Laboratory',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 16,
    isFeatured: true,
    isPromoEssential: true,
    shortDescription: 'Achromatic binocular biological microscope with adjustable LED illumination, mechanical stage, and 40x-1000x magnification.',
    description: [
      'Designed for professional laboratory testing, research institutions, and training facilities requiring crisp optical resolution and ergonomic operation.',
      'Supplied with DIN standard achromatic 4x, 10x, 40x, and 100x oil immersion objectives and a 360-degree rotating Siedentopf binocular head.'
    ],
    features: [
      'Achromatic optics with 4x, 10x, 40x and 100x (Oil) objectives',
      'Double-layer mechanical stage with vernier position scales',
      'Coaxial coarse and fine focusing with tension adjustment',
      'Continuous brightness adjustable 3W LED illumination'
    ],
    specifications: [
      { name: 'Product type', value: 'Biological compound microscope' },
      { name: 'Magnification', value: '40x - 1000x' },
      { name: 'Head type', value: 'Siedentopf Binocular (30° inclined)' },
      { name: 'Condenser', value: 'Abbe N.A. 1.25 with iris diaphragm' },
      { name: 'Power', value: '100-240V AC UK plug' },
      { name: 'SKU', value: 'LAB-20941' }
    ],
    images: [
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-004',
    slug: 'variable-volume-micropipette-100-1000ul',
    name: 'Precision Variable Volume Micropipette (100–1000 µL)',
    sku: 'LAB-20155',
    category: 'laboratory',
    categoryName: 'Laboratory',
    subcategory: 'pipettes',
    subcategoryName: 'Pipettes',
    productType: 'Pipette',
    price: 62.00,
    rating: 4.8,
    reviewCount: 31,
    badge: 'Standard',
    brand: 'EVYS Laboratory',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 52,
    isFeatured: true,
    shortDescription: 'Autoclavable single-channel laboratory pipette featuring smooth volume adjustment and clear digital display.',
    description: [
      'Engineered for liquid handling accuracy in clinical, chemical, and educational laboratories.',
      'Fully autoclavable lower manifold with universal tip cone compatible with standard pipette tips.'
    ],
    features: [
      'Smooth volume adjustment with locking click-wheel',
      'Clear 4-digit volume display',
      'Autoclavable lower cone assembly (121°C)',
      'Lightweight ergonomic body reducing hand fatigue'
    ],
    specifications: [
      { name: 'Product type', value: 'Single channel micropipette' },
      { name: 'Volume range', value: '100 - 1000 µL' },
      { name: 'Increment', value: '1 µL' },
      { name: 'Inaccuracy', value: '±0.6%' },
      { name: 'SKU', value: 'LAB-20155' }
    ],
    images: [
      'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-005',
    slug: 'stainless-steel-rotary-pipette-stand-6-place',
    name: 'Stainless Steel Rotary Pipette Stand (6-Place)',
    sku: 'LAB-20380',
    category: 'laboratory',
    categoryName: 'Laboratory',
    subcategory: 'lab-accessories',
    subcategoryName: 'Lab Accessories',
    productType: 'Pipette Stand',
    price: 36.50,
    rating: 4.7,
    reviewCount: 19,
    brand: 'EVYS Laboratory',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 30,
    shortDescription: 'Weighted 360-degree rotating stainless steel carousel stand holding up to 6 single or multichannel micropipettes.',
    description: [
      'Keeps pipettes organized and protected from benchtop contamination. Stable, weighted circular base with chemical-resistant stainless steel finish.'
    ],
    features: [
      'Universal carousel holding 6 pipettes',
      'Weighted anti-tip base',
      'Chemical-resistant 304 stainless steel'
    ],
    specifications: [
      { name: 'Product type', value: 'Pipette carousel stand' },
      { name: 'Capacity', value: '6 Pipettes' },
      { name: 'Material', value: 'Grade 304 Stainless Steel' },
      { name: 'SKU', value: 'LAB-20380' }
    ],
    images: [
      'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-006',
    slug: 'sterile-safety-iv-cannula-20g-box-50',
    name: 'Sterile Safety IV Cannula with Port 20G (Box of 50)',
    sku: 'CON-30128',
    category: 'medical-consumables',
    categoryName: 'Medical Consumables',
    subcategory: 'cannulas',
    subcategoryName: 'Cannulas',
    productType: 'IV Cannula',
    price: 22.50,
    compareAtPrice: 26.00,
    rating: 4.9,
    reviewCount: 57,
    badge: 'Bestseller',
    brand: 'EVYS Consumables',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 180,
    isFeatured: true,
    isPromoEssential: true,
    shortDescription: 'Sterile 20G radiopaque safety catheter with integrated injection port and passive needle protection mechanism.',
    description: [
      'Designed for safe vascular access. Features a precision back-bevel needle and translucent flashback chamber for rapid vein entry confirmation.',
      'Individual sterile blister pack packaging in standardized boxes of 50 units.'
    ],
    features: [
      'Integrated passive needle shield to protect against accidental injury',
      'Colour-coded ISO standard pink hub (20 Gauge)',
      'Smooth catheter transition for minimal insertion discomfort',
      'Box of 50 sterile individual blister units'
    ],
    specifications: [
      { name: 'Product type', value: 'Safety IV Cannula' },
      { name: 'Gauge', value: '20G (1.1 x 32 mm)' },
      { name: 'Flow rate', value: '61 mL/min' },
      { name: 'Packaging', value: 'Box of 50' },
      { name: 'Sterilisation', value: 'Ethylene Oxide' },
      { name: 'SKU', value: 'CON-30128' }
    ],
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-007',
    slug: 'nitrile-powder-free-examination-gloves-box-100',
    name: 'Nitrile Powder-Free Medical Examination Gloves (Box of 100)',
    sku: 'CON-30410',
    category: 'medical-consumables',
    categoryName: 'Medical Consumables',
    subcategory: 'gloves',
    subcategoryName: 'Gloves',
    productType: 'Examination Gloves',
    price: 7.95,
    compareAtPrice: 9.50,
    rating: 4.8,
    reviewCount: 92,
    badge: 'Popular',
    brand: 'EVYS Consumables',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 450,
    isFeatured: true,
    shortDescription: 'Latex-free, powder-free textured blue nitrile gloves providing reliable barrier protection and tactile precision.',
    description: [
      'Medical examination gloves suitable for clinical diagnostics, procedures, care work, and laboratory handling.',
      'Micro-textured fingertips ensure a dependable grip in wet and dry conditions.'
    ],
    features: [
      'Latex-free and powder-free synthetic nitrile',
      'Textured fingertips for precise grip',
      'Beaded cuff for easy donning',
      'Box of 100 ambidextrous gloves'
    ],
    specifications: [
      { name: 'Product type', value: 'Medical Nitrile Gloves' },
      { name: 'Material', value: 'Nitrile (Latex-free)' },
      { name: 'Colour', value: 'Medical Blue' },
      { name: 'Quantity', value: '100 Gloves per box' },
      { name: 'SKU', value: 'CON-30410' }
    ],
    images: [
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-008',
    slug: 'tailored-antimicrobial-medical-scrub-set',
    name: 'Tailored 4-Way Stretch Medical Scrub Set (Navy)',
    sku: 'APP-40512',
    category: 'medical-apparel',
    categoryName: 'Medical Apparel',
    subcategory: 'scrubs',
    subcategoryName: 'Scrubs',
    productType: 'Scrub Set',
    price: 36.00,
    compareAtPrice: 44.00,
    rating: 4.8,
    reviewCount: 45,
    badge: 'Popular',
    brand: 'EVYS Apparel',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 90,
    isFeatured: true,
    isPromoEssential: true,
    shortDescription: 'Ergonomic 9-pocket active-stretch medical scrub top and trouser set designed for comfortable healthcare shifts.',
    description: [
      'Tailored with a flexible 4-way stretch poly-rayon-spandex blend. Moisture-wicking, wrinkle-resistant, and suitable for commercial laundry wash cycles up to 60°C.'
    ],
    features: [
      '4-way active stretch durable fabric blend',
      '9 practical pockets across top and trousers',
      'Elastic drawstring waistband with secure pocket closures',
      'Easy care and machine washable up to 60°C'
    ],
    specifications: [
      { name: 'Product type', value: 'Medical scrub set (Top & Bottom)' },
      { name: 'Material', value: '72% Polyester, 21% Rayon, 7% Spandex' },
      { name: 'Colour', value: 'Navy Blue' },
      { name: 'Fit', value: 'Modern athletic unisex fit' },
      { name: 'SKU', value: 'APP-40512' }
    ],
    images: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-009',
    slug: 'infrared-non-contact-clinical-thermometer',
    name: 'Infrared Non-Contact Digital Clinical Thermometer',
    sku: 'MED-10650',
    category: 'medical-equipment',
    categoryName: 'Medical Equipment',
    subcategory: 'diagnostic-equipment',
    subcategoryName: 'Diagnostic Equipment',
    productType: 'Thermometer',
    price: 28.50,
    rating: 4.7,
    reviewCount: 34,
    badge: 'Standard',
    brand: 'EVYS Diagnostics',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 70,
    shortDescription: 'Rapid 1-second non-contact forehead thermometer with backlit LCD and fever alert indicator.',
    description: [
      'Hygienic non-invasive temperature screening at a 1–5 cm distance. Ideal for rapid triage and general practice use.'
    ],
    features: [
      '1-second rapid accurate temperature reading',
      'Tri-colour backlit fever alert display',
      '32-slot reading memory recall'
    ],
    specifications: [
      { name: 'Product type', value: 'Infrared forehead thermometer' },
      { name: 'Measuring distance', value: '1 - 5 cm' },
      { name: 'Accuracy', value: '±0.2°C' },
      { name: 'SKU', value: 'MED-10650' }
    ],
    images: [
      'https://images.unsplash.com/photo-1583912267670-6575ad4736f8?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-010',
    slug: 'centrifuge-tube-rack-80-well',
    name: 'Polypropylene 80-Well Microcentrifuge Tube Rack (Pack of 5)',
    sku: 'LAB-20710',
    category: 'laboratory',
    categoryName: 'Laboratory',
    subcategory: 'laboratory-consumables',
    subcategoryName: 'Laboratory Consumables',
    productType: 'Tube Rack',
    price: 18.00,
    rating: 4.8,
    reviewCount: 22,
    badge: 'New',
    brand: 'EVYS Laboratory',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 110,
    shortDescription: 'Autoclavable 5x16 grid rack for 1.5ml and 2.0ml microcentrifuge tubes with alphanumeric indexing.',
    description: [
      'Organize benchtop samples with heavy-gauge virgin polypropylene racks, suitable for freezer storage down to -80°C and autoclaving at 121°C.'
    ],
    features: [
      'Holds 80 microcentrifuge tubes (1.5 / 2.0 mL)',
      'Alphanumeric moulded grid for sample tracking',
      'Autoclavable at 121°C'
    ],
    specifications: [
      { name: 'Product type', value: 'Microtube rack' },
      { name: 'Capacity', value: '80 wells (5 x 16)' },
      { name: 'Material', value: 'Polypropylene' },
      { name: 'Quantity', value: 'Pack of 5' },
      { name: 'SKU', value: 'LAB-20710' }
    ],
    images: [
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-011',
    slug: 'fingertip-pulse-oximeter-oled',
    name: 'Compact Digital Fingertip Pulse Oximeter',
    sku: 'MED-10772',
    category: 'medical-equipment',
    categoryName: 'Medical Equipment',
    subcategory: 'monitoring-equipment',
    subcategoryName: 'Monitoring Equipment',
    productType: 'Pulse Oximeter',
    price: 24.00,
    rating: 4.7,
    reviewCount: 39,
    brand: 'EVYS Diagnostics',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 60,
    shortDescription: 'Dual-colour OLED display pulse oximeter for SpO2 saturation and pulse rate monitoring.',
    description: [
      'Clear plethysmogram waveform, compact portable form factor with lanyard and batteries included.'
    ],
    features: [
      'High-contrast rotating OLED display',
      'Measures SpO2 and pulse rate (BPM)',
      'Auto power-off battery saver'
    ],
    specifications: [
      { name: 'Product type', value: 'Fingertip pulse oximeter' },
      { name: 'Display', value: 'Dual-colour OLED' },
      { name: 'Power', value: '2x AAA Alkaline' },
      { name: 'SKU', value: 'MED-10772' }
    ],
    images: [
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-012',
    slug: 'unisex-clinical-laboratory-coat-white',
    name: 'Unisex White Clinical Laboratory Coat',
    sku: 'APP-40220',
    category: 'medical-apparel',
    categoryName: 'Medical Apparel',
    subcategory: 'medical-uniforms',
    subcategoryName: 'Medical Uniforms',
    productType: 'Lab Coat',
    price: 26.50,
    rating: 4.6,
    reviewCount: 28,
    brand: 'EVYS Apparel',
    leadTime: 'UK delivery available',
    inStock: true,
    stockCount: 75,
    shortDescription: 'Durable 240gsm poly-cotton lab coat with concealed stud fasteners, chest pen pocket, and side access vents.',
    description: [
      'Protective workwear designed for laboratory technicians, pharmacy staff, and clinical students.'
    ],
    features: [
      '65% Polyester / 35% Cotton 240gsm twill',
      'Concealed press stud front fastening',
      '3 reinforced utility pockets'
    ],
    specifications: [
      { name: 'Product type', value: 'Laboratory Coat' },
      { name: 'Material', value: 'Poly-cotton twill' },
      { name: 'Colour', value: 'White' },
      { name: 'SKU', value: 'APP-40220' }
    ],
    images: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    ]
  }
];
