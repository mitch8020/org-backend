import type { Product } from './schemas/product.schema';

export const INITIAL_PRODUCTS: Product[] = [
  {
    slug: 'molecule-model',
    name: '3D-Printed Molecule Model',
    category: '3d-printed-parts',
    summary:
      'A made-to-order molecular structure model for display or education.',
    description:
      'Choose a size and finish for an illustrative molecular structure. Models are printed to order, and custom molecules or colors can be discussed in the order notes.',
    specifications: [
      'Food-safe PETG or PLA by request',
      'Multiple nozzle qualities',
      'Made to order',
    ],
    imageUrl: '/offerings/molecule-model.webp',
    imageAlt:
      'Illustrative render of a freestanding 3D-printed molecular structure model',
    availability: 'made-to-order',
    variants: [
      {
        id: '8-37-hq',
        label: '8.37 cm · high quality',
        suggestedDonationCents: 2500,
        options: { size: '8.37 cm', quality: 'High' },
      },
      {
        id: '10-standard',
        label: '10 cm · standard',
        suggestedDonationCents: 1500,
        options: { size: '10 cm', quality: 'Standard' },
      },
      {
        id: '15-standard',
        label: '15 cm · standard',
        suggestedDonationCents: 3000,
        options: { size: '15 cm', quality: 'Standard' },
      },
      {
        id: '15-medium',
        label: '15 cm · medium-low',
        suggestedDonationCents: 2000,
        options: { size: '15 cm', quality: 'Medium-low' },
      },
      {
        id: '15-economy',
        label: '15 cm · economy',
        suggestedDonationCents: 1000,
        options: { size: '15 cm', quality: 'Economy' },
      },
      {
        id: '25-5-medium',
        label: '25.5 cm · medium',
        suggestedDonationCents: 4500,
        options: { size: '25.5 cm', quality: 'Medium' },
      },
    ],
  },
  {
    slug: 'capsule-cone',
    name: 'Octagonal Capsule Cone',
    category: 'laboratory-tools',
    summary:
      'A stable weighing stand sized for capsules or 510-style components.',
    description:
      'The octagonal cone keeps small parts upright during weighing and handling. Add the capsule or component size in your notes for a fitted insert.',
    specifications: [
      '40 mm base',
      'Custom heights available',
      'Capsule and display inserts',
    ],
    imageUrl: '/offerings/capsule-cone.webp',
    imageAlt:
      'Illustrative render of an octagonal capsule weighing cone with a fitted insert',
    availability: 'made-to-order',
    variants: [
      {
        id: 'capsule',
        label: 'Capsule insert',
        options: { insert: 'Capsule' },
      },
      {
        id: 'display',
        label: '510 display insert',
        options: { insert: '510 display' },
      },
    ],
  },
  {
    slug: 'petg-drip-tips',
    name: 'PETG Drip Tips',
    category: 'vaporizer-accessories',
    summary:
      'Cleanable 510 or 810 tips with an optional anti-spitback channel.',
    description:
      'Printed from food-safe PETG and available in 510 or 810 sizes. Select one or a matched pair and note your preferred color.',
    specifications: [
      'Food-safe PETG',
      '510 or 810 fit',
      'Water and white-vinegar resistant',
    ],
    imageUrl: '/offerings/petg-drip-tips.webp',
    imageAlt: 'Illustrative render of two geometric PETG vaporizer drip tips',
    availability: 'made-to-order',
    variants: [
      {
        id: 'single',
        label: 'One tip',
        suggestedDonationCents: 1000,
        options: { quantity: '1' },
      },
      {
        id: 'pair',
        label: 'Two tips',
        suggestedDonationCents: 1500,
        options: { quantity: '2' },
      },
    ],
  },
  {
    slug: 'glass-drip-tip',
    name: 'Glass Drip Tip',
    category: 'vaporizer-accessories',
    summary:
      'A simple glass tip in straight or interchangeable mesh-ready form.',
    description:
      'Choose a straight 810 tube or an interchangeable 810/510 glass tip prepared for a custom-cut SS316 mesh insert.',
    specifications: ['Glass body', 'Straight or mesh-ready', 'Easy to clean'],
    imageUrl: '/offerings/glass-drip-tip.webp',
    imageAlt:
      'Illustrative render of a clean glass vaporizer drip tip and small metal mesh insert',
    availability: 'active',
    variants: [
      {
        id: 'mesh-ready',
        label: '810/510 mesh-ready',
        suggestedDonationCents: 1000,
        options: { style: 'Mesh-ready' },
      },
      {
        id: 'straight-810',
        label: 'Straight 810 tube',
        suggestedDonationCents: 500,
        options: { style: 'Straight 810' },
      },
    ],
  },
  {
    slug: '810-plug',
    name: '810 Dust Plug',
    category: 'vaporizer-accessories',
    summary:
      'A small fitted plug that keeps dust and trail debris out of an 810 opening.',
    description:
      'A compact made-to-order plug for RTA, RDA, or mesh hardware. Note the device and opening dimensions when possible.',
    specifications: ['810 fit', 'Washable polymer', 'Made to order'],
    imageUrl: '/offerings/810-plug.webp',
    imageAlt:
      'Illustrative render of a small octagonal 810 dust plug for vaporizer hardware',
    availability: 'made-to-order',
    variants: [
      {
        id: 'standard',
        label: 'Standard 810',
        options: { size: '810' },
      },
    ],
  },
  {
    slug: 'mesh-template',
    name: 'Mesh Template Tool',
    category: 'laboratory-tools',
    summary:
      'A measured folding guide for repeatable right-angle mesh preparation.',
    description:
      'The raised guide helps size, fold, and cut SS316 mesh consistently. The standard guide is 16 mm; custom lengths can be requested.',
    specifications: [
      '16 mm standard length',
      '90° folding edge',
      'SS316 sizing guide',
    ],
    imageUrl: '/offerings/mesh-template.webp',
    imageAlt:
      'Illustrative render of a compact measured mesh folding template tool',
    availability: 'made-to-order',
    variants: [
      {
        id: '16mm',
        label: '16 mm standard',
        options: { length: '16 mm' },
      },
      {
        id: 'custom',
        label: 'Custom length',
        options: { length: 'Custom' },
      },
    ],
  },
  {
    slug: 'rta-cutting-tool',
    name: 'RTA Cutting Tool',
    category: 'laboratory-tools',
    summary:
      'A compact trimming jig with repeatable depth guides for coil preparation.',
    description:
      'Choose a single-size tool or a larger multi-size block. Custom numbering and color can be discussed in the order notes.',
    specifications: [
      'Single or multi-size',
      'Raised depth labels',
      'Made to order',
    ],
    imageUrl: '/offerings/rta-cutting-tool.webp',
    imageAlt:
      'Illustrative render of a small multi-slot RTA coil cutting guide',
    availability: 'made-to-order',
    variants: [
      {
        id: 'single',
        label: 'Single-size guide',
        options: { format: 'Single-size' },
      },
      {
        id: 'multi',
        label: 'Multi-size block',
        options: { format: 'Multi-size' },
      },
    ],
  },
];
