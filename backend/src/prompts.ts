export type QuestionnaireAnswers = {
  vibe: string;
  usage: string;
  color: string;
  material: string;
  transformationLevel: string;
};

export function chaosPrompt(answers: QuestionnaireAnswers): string {
  // PUT YOUR CHAOS FRAME PROMPT HERE
  return ``;
}

// Concrete aesthetic direction per style id (answers.vibe). Falls back to the raw
// vibe string for anything unrecognized.
const STYLE_DIRECTION: Record<string, string> = {
  minimal:
    'Minimal — pared-back and calm: a neutral monochrome palette (white, soft grey, warm beige), clean uncluttered surfaces, generous negative space, simple unornamented forms, matte finishes.',
  cozy:
    'Cozy — warm and inviting: a soft warm palette (terracotta, cream, muted ochre), layered textiles (throws, cushions, rugs), natural wood and wool textures, soft diffused lamp light, a lived-in comforting feel.',
  modern:
    'Modern — sleek and intentional: a cool restrained palette with one bold accent, clean geometric lines, polished metal/glass/lacquer finishes, statement lighting, architectural precision.',
  maximalist:
    'Maximalist — rich and layered: a saturated jewel-tone palette, bold patterns, gallery-style wall arrangements, eclectic mixed materials, abundant texture and decor, full of personality.',
};

function styleDirection(vibe: string): string {
  return STYLE_DIRECTION[vibe?.trim().toLowerCase()] ?? `${vibe || 'clean, intentional'} style.`;
}

export function finalDesignPrompt(answers: QuestionnaireAnswers): string {
  return `Interior design photography of this room fully redesigned in the chosen style, on a neutral seamless studio backdrop. Using the room dimensions, wall layout, windows, and doors from the reference image as the exact spatial blueprint — reimagined with intention.

STYLE DIRECTION — ${styleDirection(answers.vibe)} The redesign's palette, materials, finishes, lighting, and decor styling must clearly express this style.

CRITICAL — NO ITEM REMOVAL: Every original item stays. Nothing is added or taken away. The only things that change are positioning, organization, and finish. The same furniture, the same decor, the same accessories — just exactly where they should be.

SPATIAL CONSTRAINTS — STRICTLY RESPECTED: All windows remain in exact original positions — unblocked, unobscured, always visible. All doors remain in exact original positions with full clearance kept free. No furniture or objects placed in any door swing zone. All structural elements — ceiling height, floor area, wall lengths, alcoves — preserved exactly as in the reference image.

THE ROOM: Walls repainted clean and deliberate in the palette of the chosen style, no marks or wear. All wall-mounted items straightened, reframed, or refined in place — nothing removed. Window treatments re-dressed in crisp freshly pressed versions of what exists — same style, same position, openings fully visible.

Primary seating repositioned centered and squared to the main wall — cushions plumped and symmetrically arranged, any throws or pillows folded with intention. Secondary seating pulled to equal distances from the primary piece, angled precisely inward at matching angles. Primary surface centered exactly between the seating — cleared of clutter, only intentional objects remaining. Any floor coverings straightened and centered beneath the furniture grouping. Tall items and lighting repositioned to corners and perimeter walls, cords hidden.

All storage and shelving reorganized with breathing room between objects — stacked items upright and grouped by size, vessels and decorative objects spaced evenly, any trailing plants trimmed and repositioned to cascade naturally. No overcrowding, no random stacking. Each shelf a deliberate composition. Any plants repositioned equidistant from their respective walls, pots wiped clean, soil topped, leaves facing outward.

Every surface carries only what belongs — excess objects removed from surfaces, remaining pieces spaced with intention. Nothing extra. Every item from the original room exactly where it should be.

The original floor is preserved exactly as photographed — same material, same color, same texture, unchanged. All objects fully grounded and still. Soft diffused light from camera-left, gentle shadows beneath each piece.

Photorealistic, 3:4 aspect ratio, editorial interior photography. High detail, 2K resolution. Ultra-sharp.`;
}

export function summaryPrompt(answers: QuestionnaireAnswers): string {
  // PUT YOUR GEMINI TEXT SUMMARY PROMPT HERE
  
  return ``;
}

// Single-image motion prompt: the model animates ONE image (the original room photo)
// transforming from cluttered → reorganized. No start/end frame — the whole transformation
// lives in the prompt (Higgsfield's API only takes one input image).
export const videoMotionPrompt = `The room in this image reorganizes itself into a clean, intentional, beautifully arranged version of itself — the same room with the same furniture and decor, nothing added or removed, only repositioned and tidied.

MOTION: Every object in the room simultaneously lifts and launches outward in a dramatic mid-air burst from the room's center — seating tilts and rises, surfaces spin, rugs unroll mid-air, smaller objects scatter, tall items arc sideways, plants tip and trail particles. At peak scatter the items hang suspended, leaving only the bare room. Then everything descends slowly and precisely into an optimized arrangement: large seating settles centered and squared to the wall, secondary seating flanks it symmetrically, rugs lie flat and centered, every surface clears to only a few intentional objects, storage sits flush against the walls with breathing room, all clutter gone. The room locks into place, dust settles, stillness.

The architecture — walls, floor, ceiling, windows, doors — stays fixed and unchanged throughout; only the room's contents move. Photorealistic, consistent soft lighting, locked-off camera with no camera movement, smooth and satisfying, no artifacts.`;
