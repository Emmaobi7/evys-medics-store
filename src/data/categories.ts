import { Category, MegaMenuCategory } from '../types';

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
  {
    id: 'medical-equipment',
    name: 'Medical Equipment',
    description: 'Diagnostic equipment, stethoscopes, monitors & clinic devices.',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { id: 'diagnostic-equipment', name: 'Diagnostic Equipment' },
      { id: 'blood-pressure-monitors', name: 'Blood Pressure Monitors' },
      { id: 'stethoscopes', name: 'Stethoscopes' },
      { id: 'patient-equipment', name: 'Patient Monitoring' },
      { id: 'examination-equipment', name: 'Examination Equipment' },
    ],
  },
  {
    id: 'laboratory',
    name: 'Laboratory Equipment',
    description: 'Precision microscopes, micropipettes, instruments & apparatus.',
    imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { id: 'microscopes', name: 'Microscopes' },
      { id: 'pipettes', name: 'Pipettes' },
      { id: 'laboratory-equipment', name: 'Laboratory Instruments' },
      { id: 'lab-accessories', name: 'Laboratory Accessories' },
    ],
  },
  {
    id: 'medical-consumables',
    name: 'Medical Consumables',
    description: 'Sterile cannulas, examination gloves, syringes & clinical supplies.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { id: 'cannulas', name: 'Cannulas' },
      { id: 'disposable-supplies', name: 'Disposable Supplies' },
      { id: 'clinical-consumables', name: 'Clinical Consumables' },
      { id: 'gloves', name: 'Examination Gloves' },
    ],
  },
  {
    id: 'medical-apparel',
    name: 'Healthcare & Workwear',
    description: 'Clinical scrubs, medical uniforms & healthcare accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { id: 'scrubs', name: 'Medical Scrubs' },
      { id: 'healthcare-accessories', name: 'Healthcare Accessories' },
      { id: 'medical-uniforms', name: 'Medical Uniforms' },
    ],
  },
];

export const CATEGORIES: Category[] = [
  {
    id: 'medical-equipment',
    name: 'Medical Equipment',
    shortName: 'Equipment',
    description: 'Reliable equipment for clinical and professional healthcare practices and facilities.',
    itemCount: 68,
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    featured: true,
    subcategories: MEGA_MENU_CATEGORIES[0].subcategories,
  },
  {
    id: 'laboratory',
    name: 'Laboratory Equipment',
    shortName: 'Laboratory',
    description: 'Precision microscopes, micropipettes, tube racks, and testing instruments.',
    itemCount: 54,
    imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
    featured: true,
    subcategories: MEGA_MENU_CATEGORIES[1].subcategories,
  },
  {
    id: 'medical-consumables',
    name: 'Medical Consumables',
    shortName: 'Consumables',
    description: 'Sterile IV cannulas, syringes, disposable examination gloves, and clinical essentials.',
    itemCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    featured: true,
    subcategories: MEGA_MENU_CATEGORIES[2].subcategories,
  },
  {
    id: 'medical-apparel',
    name: 'Healthcare & Workwear',
    shortName: 'Workwear',
    description: 'Comfortable scrub sets, lab coats, and protective healthcare apparel.',
    itemCount: 39,
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    featured: true,
    subcategories: MEGA_MENU_CATEGORIES[3].subcategories,
  },
];
