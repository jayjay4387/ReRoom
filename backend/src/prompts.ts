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

export function finalDesignPrompt(answers: QuestionnaireAnswers): string {
  return `Interior design photography of a fully reorganized room on a neutral seamless studio backdrop. Using the room dimensions, wall layout, windows, and doors from the reference image as the exact spatial blueprint — cleaned up and reorganized with intention.

CRITICAL — NO ITEM REMOVAL: Every original item stays. Nothing is added or taken away. The only things that change are positioning, organization, and finish. The same furniture, the same decor, the same accessories — just exactly where they should be.

SPATIAL CONSTRAINTS — STRICTLY RESPECTED: All windows remain in exact original positions — unblocked, unobscured, always visible. All doors remain in exact original positions with full clearance kept free. No furniture or objects placed in any door swing zone. All structural elements — ceiling height, floor area, wall lengths, alcoves — preserved exactly as in the reference image.

THE ROOM: Walls repainted in a fresh clean version of their original tone — same color family, lighter and more deliberate, no marks or wear. All wall-mounted items straightened, reframed, or refined in place — nothing removed. Window treatments re-dressed in crisp freshly pressed versions of what exists — same style, same position, openings fully visible.

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

// Static — no answers needed. Start frame = original photo, end frame = Gemini reorganized room.
// Chaos image is described as mid-scatter reference in the motion prompt only — not sent as a keyframe.
export const videoMotionPrompt = `START FRAME: Original room as photographed — all furniture, decor, and accessories fully present, grounded, still. Original walls, floor, ceiling, doors, and windows exactly as photographed. Soft diffused light from camera-left.
END FRAME: Same room, exact same items, reorganized with intention. Nothing added, nothing removed. Primary seating floated from wall and centered on main axis. Secondary seating flanking at equal distances, angled inward. Primary surface centered in the grouping. Floor coverings anchored beneath furniture, centered and straight. Tall items and plants pushed to corners. Storage flush to walls with breathing room. Every surface cleared to intentional objects only. Same walls, same floor, same light.
TRANSITION:
0:00–0:05 Room holds still. Every object grounded and quiet. Walls, floor, ceiling, doors, and windows static and unchanged for the entire video.
0:05–0:50 Every item visible in the start frame simultaneously launches outward in a violent explosive burst from the room's center — only and exactly those items, nothing else. Seating tilts and rises, surfaces spin, floor coverings unroll mid-air, smaller objects scatter, tall items arc sideways, plants tip and trail soil particles. Architecture does not move.
0:50–1:20 Peak scatter — every item suspended at maximum distance. Room empty below, only original architecture visible. No new items, nothing that was not in the original room.
1:20–5:30 Every item descends slowly into its new optimized position. Largest seating first, secondary seating follows symmetrically, floor coverings unfurl flat, primary surface centers precisely, tall items settle into corners, smaller decor lands last. Each arrival final and precise — one graceful descent, no adjustment.
5:30–7:00 Room locks into place. Dust settles. Last object lands. Stillness.
Emotional arc: violent dispersal — mid-air reorganization — precise intentional rebirth.
STYLE: Photorealistic. Original architecture intact throughout. Only exact items from the start frame in motion — nothing extra. Light from camera-left, consistent. Camera locked-off — zero movement. 24fps minimum, no artifacts, no motion blur on frozen frames.
DURATION: 7 seconds
ASPECT RATIO: 3:4
MODEL: Kling 3.0 via eachlabs.ai — start frame + end frame mode, no enhance`;
