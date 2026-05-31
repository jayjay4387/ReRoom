// Per-icon subpaths of @hugeicons/core-free-icons ship JS only (no .d.ts).
// We import them individually for tree-shaking; this types each default export
// as the icon object HugeiconsIcon expects (kept precise — no `any`).
declare module '@hugeicons/core-free-icons/*' {
  import type { ComponentProps } from 'react';
  import type { HugeiconsIcon } from '@hugeicons/react-native';
  const icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  export default icon;
}
