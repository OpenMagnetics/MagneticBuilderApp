// Pure view-model builders for the Winding Studio SVG cross-section.
//
// Inputs are plain MAS JSON (magnetic.core / magnetic.coil). Outputs are plain
// objects in SVG coordinates: MILLIMETERS, y already flipped (SVG y grows down,
// physical y grows up). No physics here: the C++ winder (via WASM) computed
// every coordinate and dimension; this module only arranges them for display.
// If the studio and the WASM painter ever disagree visually, the painter is
// the reference and this module is the bug.

import { effectiveBobbin } from '/WebSharedComponents/assets/js/utils.js';

const MM = 1000;

function rectFromCenter(cx, cy, width, height) {
    // Physical center (m) + dimensions (m) -> SVG rect (mm, y flipped).
    return {
        x: cx * MM - (width * MM) / 2,
        y: -cy * MM - (height * MM) / 2,
        width: width * MM,
        height: height * MM,
    };
}

function rectKey(r) {
    // Key for dedup: winding windows repeat the same region once per wound-column edge.
    return [r.x, r.y, r.width, r.height].map((v) => v.toFixed(6)).join('|');
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

// The cross-section of every concentric (two-piece set) core reduces to the
// outer silhouette rectangle minus the winding-window cavities. Whether a
// mirrored cavity exists on the other side of the main column is data-driven:
// it does iff the core has a lateral column on that side (E-family yes, U no).
export function buildCoreView(core) {
    const processed = core.processedDescription;
    if (processed == null) {
        return null;
    }
    const columns = processed.columns ?? [];
    const windows = processed.windingWindows ?? [];
    if (columns.length === 0 || windows.length === 0) {
        return null;
    }

    const outer = rectFromCenter(0, 0, processed.width, processed.height);

    // Cavities are derived from the COLUMNS (central column edge -> each
    // lateral column's inner edge), not from the windingWindows entries:
    // wound-MAS files in the wild carry two different conventions for a core
    // window's `coordinates` (region center vs inner edge), while the column
    // geometry is unambiguous and matches both.
    const cavities = [];
    const central = columns.find((column) => column.type === 'central') ?? columns[0];
    const laterals = columns.filter((column) => column.type === 'lateral');
    if (laterals.length > 0) {
        const xInner = Math.abs(central.coordinates[0]) + central.width / 2;
        for (const lateral of laterals) {
            const side = lateral.coordinates[0] < 0 ? -1 : 1;
            const xOuter = Math.abs(lateral.coordinates[0]) - lateral.width / 2;
            if (xOuter <= xInner) {
                continue;
            }
            const height = lateral.height ?? central.height ?? processed.height;
            cavities.push({
                x: (side < 0 ? -xOuter : xInner) * MM,
                y: -(lateral.coordinates[1] ?? 0) * MM - (height * MM) / 2,
                width: (xOuter - xInner) * MM,
                height: height * MM,
            });
        }
    }
    else {
        // No lateral columns (e.g. exotic shapes): fall back to the window
        // entries, mirroring like the two-piece painter does.
        const seen = new Set();
        for (const window of windows) {
            if (window.coordinates == null || window.width == null || window.height == null) {
                continue;
            }
            const rect = rectFromCenter(window.coordinates[0], window.coordinates[1] ?? 0, window.width, window.height);
            for (const candidate of [rect, { ...rect, x: -rect.x - rect.width }]) {
                const key = rectKey(candidate);
                if (!seen.has(key)) {
                    seen.add(key);
                    cavities.push(candidate);
                }
            }
        }
    }

    // Gaps: drawn as breaks in the column (painter draws them background-colored).
    const gaps = [];
    for (const gap of core.functionalDescription?.gapping ?? []) {
        if (gap.coordinates == null || gap.length == null) {
            continue;
        }
        const column = findColumnAt(columns, gap.coordinates[0]);
        if (column == null) {
            continue;
        }
        gaps.push({
            ...rectFromCenter(gap.coordinates[0], gap.coordinates[1] ?? 0, column.width, gap.length),
            type: gap.type,
        });
    }

    const columnViews = columns.map((column, index) => ({
        index,
        type: column.type,
        shape: column.shape,
        rect: rectFromCenter(column.coordinates[0], column.coordinates[1] ?? 0, column.width, column.height ?? processed.height),
    }));

    return { outer, cavities, gaps, columns: columnViews };
}

function findColumnAt(columns, x) {
    let best = null;
    let bestDistance = Infinity;
    for (const column of columns) {
        const distance = Math.abs(column.coordinates[0] - x);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = column;
        }
    }
    return best;
}

// ---------------------------------------------------------------------------
// Bobbin
// ---------------------------------------------------------------------------

// One U-duct per distinct winding-window region: a column wall on the side of
// the wound column plus top/bottom walls. Faithful enough for the studio; the
// painter remains the reference for print-quality drawings.
export function buildBobbinView(coil, coreView) {
    const bobbin = effectiveBobbin(coil?.bobbin);
    const processed = typeof bobbin === 'object' ? bobbin?.processedDescription : null;
    if (processed == null || coreView == null) {
        return [];
    }
    const columnThickness = processed.columnThickness ?? 0;
    const wallThickness = processed.wallThickness ?? 0;
    if (columnThickness <= 0 && wallThickness <= 0) {
        return [];
    }

    const parts = [];
    const seen = new Set();
    for (const window of processed.windingWindows ?? []) {
        if (window.coordinates == null || window.width == null || window.height == null) {
            continue;
        }
        const rect = rectFromCenter(window.coordinates[0], window.coordinates[1] ?? 0, window.width, window.height);
        const key = rectKey(rect);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);

        // The wall sits between the window and the column it wraps: the wound
        // column is the nearest one on the window's own side (main column for
        // window 0, the lateral leg for lateral windows).
        const columnIndex = window.column ?? 0;
        const column = coreView.columns[columnIndex] ?? coreView.columns[0];
        const columnCenterX = column.rect.x + column.rect.width / 2;
        const windowCenterX = rect.x + rect.width / 2;
        const wallOnLeft = columnCenterX < windowCenterX;

        if (columnThickness > 0) {
            parts.push({
                x: wallOnLeft ? rect.x - columnThickness * MM : rect.x + rect.width,
                y: rect.y - wallThickness * MM,
                width: columnThickness * MM,
                height: rect.height + 2 * wallThickness * MM,
            });
        }
        if (wallThickness > 0) {
            for (const side of [-1, 1]) {
                parts.push({
                    x: rect.x,
                    y: side < 0 ? rect.y - wallThickness * MM : rect.y + rect.height,
                    width: rect.width,
                    height: wallThickness * MM,
                });
            }
        }
    }
    return parts;
}

// ---------------------------------------------------------------------------
// Windows / sections / layers / turns
// ---------------------------------------------------------------------------

export function buildWindowViews(coil, core) {
    // Prefer the bobbin windows (that is where sections actually live); fall
    // back to the core ones so the studio still draws around a "Dummy" bobbin.
    const mergedBobbin = effectiveBobbin(coil?.bobbin);
    const bobbinProcessed = typeof mergedBobbin === 'object' ? mergedBobbin?.processedDescription : null;
    const windows = bobbinProcessed?.windingWindows ?? core?.processedDescription?.windingWindows ?? [];
    return windows
        .map((window, index) => {
            if (window.coordinates == null || window.width == null || window.height == null) {
                return null;
            }
            return {
                index,
                column: window.column ?? null,
                sectionsOrientation: window.sectionsOrientation ?? null,
                rect: rectFromCenter(window.coordinates[0], window.coordinates[1] ?? 0, window.width, window.height),
            };
        })
        .filter(Boolean);
}

export function buildSectionViews(coil) {
    const sections = coil?.sectionsDescription ?? [];
    return sections
        .map((section) => {
            if (section.coordinates == null || section.dimensions == null) {
                return null;
            }
            return {
                name: section.name,
                type: section.type,
                windingWindow: section.windingWindow ?? 0,
                windings: (section.partialWindings ?? []).map((partial) => partial.winding),
                fillingFactor: section.fillingFactor ?? null,
                margin: section.margin ?? null,
                layersOrientation: section.layersOrientation ?? null,
                rect: rectFromCenter(section.coordinates[0], section.coordinates[1], section.dimensions[0], section.dimensions[1]),
            };
        })
        .filter(Boolean);
}

export function buildLayerViews(coil) {
    const layers = coil?.layersDescription ?? [];
    return layers
        .map((layer) => {
            if (layer.coordinates == null || layer.dimensions == null) {
                return null;
            }
            return {
                name: layer.name,
                type: layer.type,
                section: layer.section ?? null,
                rect: rectFromCenter(layer.coordinates[0], layer.coordinates[1], layer.dimensions[0], layer.dimensions[1]),
            };
        })
        .filter(Boolean);
}

export function buildTurnViews(coil) {
    const turns = coil?.turnsDescription ?? [];
    const views = [];
    const firstTurnSeen = new Set();
    for (const turn of turns) {
        if (turn.coordinates == null || turn.dimensions == null) {
            continue;
        }
        const round = turn.crossSectionalShape !== 'rectangular';
        const key = `${turn.winding}|${turn.parallel}`;
        const isStart = !firstTurnSeen.has(key);
        firstTurnSeen.add(key);

        const base = {
            name: turn.name,
            winding: turn.winding,
            parallel: turn.parallel ?? 0,
            section: turn.section ?? null,
            layer: turn.layer ?? null,
            round,
            isStart,
        };
        views.push({
            ...base,
            isReturn: false,
            rect: rectFromCenter(turn.coordinates[0], turn.coordinates[1], turn.dimensions[0], turn.dimensions[1]),
        });
        // The winder emits the extra window crossings of off-axis loops (e.g. a
        // lateral-leg turn crossing the main window on its way back).
        for (const coordinates of turn.additionalCoordinates ?? []) {
            views.push({
                ...base,
                isStart: false,
                isReturn: true,
                rect: rectFromCenter(coordinates[0], coordinates[1], turn.dimensions[0], turn.dimensions[1]),
            });
        }
    }
    return views;
}

// ---------------------------------------------------------------------------
// Toroidal
// ---------------------------------------------------------------------------

// Top view, mm, centered at the origin. MAS toroidal conventions (verified
// against the winder + painter): the winding window is the inner hole (radius
// = windingWindows[0].radialHeight); a section is an annular sector with polar
// coordinates [radial inset from the ring's inner wall toward the center,
// center angle in degrees] and dimensions [radial band, angular span in
// degrees]. Turns come as cartesian top-view coordinates (their outer return
// crossings sit outside the ring).
//
// ORIENTATION: unlike the two-piece cross-section (y flipped, physical y up),
// the toroidal view maps data y DOWN the screen — because the painter does:
// MKF's export_svg wraps toroidal SVGs in an extra scale(1,-1) group, so its
// displayed toroid is the vertical mirror of the raw coordinates. The painter
// is the display reference, so the studio mirrors the same way; a section at
// data angle +90deg renders at the bottom in BOTH.

function polarPoint(radius, angleDegrees) {
    const angle = (angleDegrees * Math.PI) / 180;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

export function annularSectorPath(innerRadius, outerRadius, startAngle, endAngle) {
    const span = endAngle - startAngle;
    if (span >= 360 - 1e-9) {
        // Full ring: two circles, even-odd.
        const circle = (r) => `M ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 Z`;
        return `${circle(outerRadius)} ${circle(innerRadius)}`;
    }
    const largeArc = span > 180 ? 1 : 0;
    const [ox0, oy0] = polarPoint(outerRadius, startAngle);
    const [ox1, oy1] = polarPoint(outerRadius, endAngle);
    const [ix0, iy0] = polarPoint(innerRadius, startAngle);
    const [ix1, iy1] = polarPoint(innerRadius, endAngle);
    // Data y maps down the screen (painter-matched mirror), so increasing data
    // angle follows SVG's positive-angle direction: sweep-flag 1 on the way out.
    return `M ${ox0} ${oy0} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${ox1} ${oy1} `
        + `L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix0} ${iy0} Z`;
}

function buildToroidalSectionViews(coil, windowRadiusMm) {
    const sections = coil?.sectionsDescription ?? [];
    return sections
        .map((section) => {
            if (section.coordinates == null || section.dimensions == null) {
                return null;
            }
            const rCenter = windowRadiusMm - section.coordinates[0] * MM;
            const rBand = section.dimensions[0] * MM;
            const thetaCenter = section.coordinates[1];
            const thetaSpan = section.dimensions[1];
            const rIn = Math.max(0, rCenter - rBand / 2);
            const rOut = rCenter + rBand / 2;
            const outerPoint = polarPoint(rOut, thetaCenter);
            return {
                name: section.name,
                type: section.type,
                windingWindow: section.windingWindow ?? 0,
                windings: (section.partialWindings ?? []).map((partial) => partial.winding),
                fillingFactor: section.fillingFactor ?? null,
                margin: section.margin ?? null,
                layersOrientation: section.layersOrientation ?? null,
                polar: { rCenter, rBand, thetaCenter, thetaSpan },
                path: annularSectorPath(rIn, rOut, thetaCenter - thetaSpan / 2, thetaCenter + thetaSpan / 2),
                // Bounding rect kept for the shared bounds/tooltip machinery.
                rect: {
                    x: Math.min(outerPoint[0], -rOut),
                    y: Math.min(outerPoint[1], -rOut),
                    width: rOut * 2,
                    height: rOut * 2,
                },
            };
        })
        .filter(Boolean);
}

function buildToroidalStudioModel(magnetic) {
    const core = magnetic.core;
    const coil = magnetic.coil;
    const processed = core.processedDescription;
    if (processed == null || (processed.columns ?? []).length === 0) {
        return { valid: false, reason: 'Core has no processed description yet' };
    }
    const outerRadius = (processed.width * MM) / 2;
    const column = processed.columns[0];
    const innerRadius = outerRadius - column.width * MM;
    const windows = processed.windingWindows ?? [];
    const windowRadius = windows.length > 0 && windows[0].radialHeight != null
        ? windows[0].radialHeight * MM
        : innerRadius;

    const sections = buildToroidalSectionViews(coil, windowRadius);
    // buildTurnViews flips y for the two-piece convention (physical y up); the
    // toroidal view is painter-matched with data y DOWN, so mirror the glyphs
    // back around y=0 (see the orientation note above).
    const turns = buildTurnViews(coil).map((turn) => ({
        ...turn,
        rect: { ...turn.rect, y: -(turn.rect.y + turn.rect.height) },
    }));

    let extent = outerRadius;
    for (const turn of turns) {
        extent = Math.max(extent,
            Math.abs(turn.rect.x), Math.abs(turn.rect.y),
            Math.abs(turn.rect.x + turn.rect.width), Math.abs(turn.rect.y + turn.rect.height));
    }
    const margin = extent * 0.04;
    const bounds = { x: -extent - margin, y: -extent - margin, width: 2 * (extent + margin), height: 2 * (extent + margin) };

    return {
        valid: true,
        kind: 'toroidal',
        bounds,
        core: { ring: { outerRadius, innerRadius }, columns: [], cavities: [], gaps: [], outer: { x: -outerRadius, y: -outerRadius, width: 2 * outerRadius, height: 2 * outerRadius } },
        bobbin: [],
        windows: [],
        windowRadius,
        sections,
        layers: [],
        turns,
        windingNames: (coil.functionalDescription ?? []).map((winding) => winding.name),
    };
}

// ---------------------------------------------------------------------------
// Whole model
// ---------------------------------------------------------------------------

export function buildStudioModel(magnetic) {
    const core = magnetic?.core;
    const coil = magnetic?.coil;
    if (core == null || coil == null) {
        return { valid: false, reason: 'No magnetic loaded' };
    }
    const family = core.functionalDescription?.shape?.family ?? core.functionalDescription?.shape?.split?.(' ')?.[0]?.toLowerCase();
    if (family === 't') {
        return buildToroidalStudioModel(magnetic);
    }
    const coreView = buildCoreView(core);
    if (coreView == null) {
        return { valid: false, reason: 'Core has no processed description yet' };
    }

    const windows = buildWindowViews(coil, core);
    const sections = buildSectionViews(coil);
    const layers = buildLayerViews(coil);
    const turns = buildTurnViews(coil);
    const bobbin = buildBobbinView(coil, coreView);

    // View bounds: the core silhouette UNION all drawn content. Lateral-leg
    // loops cross the section plane outside the core (their outer crossing),
    // so turns can legitimately sit beyond the silhouette.
    let x0 = coreView.outer.x;
    let y0 = coreView.outer.y;
    let x1 = coreView.outer.x + coreView.outer.width;
    let y1 = coreView.outer.y + coreView.outer.height;
    for (const rect of [...sections.map((s) => s.rect), ...turns.map((t) => t.rect)]) {
        x0 = Math.min(x0, rect.x);
        y0 = Math.min(y0, rect.y);
        x1 = Math.max(x1, rect.x + rect.width);
        y1 = Math.max(y1, rect.y + rect.height);
    }
    const margin = Math.max(x1 - x0, y1 - y0) * 0.03;
    const bounds = {
        x: x0 - margin,
        y: y0 - margin,
        width: x1 - x0 + 2 * margin,
        height: y1 - y0 + 2 * margin,
    };

    const windingNames = (coil.functionalDescription ?? []).map((winding) => winding.name);

    return {
        valid: true,
        kind: 'concentric',
        bounds,
        core: coreView,
        bobbin,
        windows,
        sections,
        layers,
        turns,
        windingNames,
    };
}

// Distinguishable, color-blind-friendly winding palette (Okabe-Ito, minus black).
export const WINDING_PALETTE = [
    '#E69F00',
    '#56B4E9',
    '#009E73',
    '#F0E442',
    '#CC79A7',
    '#0072B2',
    '#D55E00',
    '#999999',
];

export function windingColor(windingNames, windingName) {
    const index = windingNames.indexOf(windingName);
    return WINDING_PALETTE[(index < 0 ? 0 : index) % WINDING_PALETTE.length];
}
