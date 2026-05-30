export type StyleOption = {
  id: 'minimal' | 'cozy' | 'modern' | 'maximalist';
  label: string;
  icon: string;
  description: string;
};

export const STYLES: StyleOption[] = [
  { id: 'minimal', label: 'Minimal', icon: '◻', description: 'Clean lines, empty space, nothing wasted.' },
  { id: 'cozy', label: 'Cozy', icon: '🕯', description: 'Warm textures, soft light, feels like home.' },
  { id: 'modern', label: 'Modern', icon: '⬡', description: 'Sleek materials, bold geometry, precise.' },
  { id: 'maximalist', label: 'Maximalist', icon: '✦', description: 'Layered, eclectic, full of personality.' },
];
