<script setup>
// Winding Studio — interactive cross-section rendered in Vue SVG straight from
// the MAS descriptions the WASM winder computed (sections/layers/turns carry
// coordinates + dimensions). Unlike Magnetic2DVisualizer (which embeds the C++
// Painter's finished SVG), every element here is a live DOM node with identity,
// so it can be hovered, selected and — in later phases — dragged.
//
// P0 scope: read-only parity view + hover/selection + color-by-winding.
// Gated by magneticBuilderSettings.enableWindingStudio.
import { computed, ref } from 'vue';
import { buildStudioModel, windingColor } from './geometry.js';

const props = defineProps({
    dataTestLabel: {
        type: String,
        default: '',
    },
    masStore: {
        type: Object,
        required: true,
    },
    // P1: winding chips become drag sources and the core legs drop targets;
    // dropping emits placeWinding({winding, columnIndex}) for the host to
    // execute through the WASM winder. Off = P0 read-only view.
    editable: {
        type: Boolean,
        default: false,
    },
    busy: {
        type: Boolean,
        default: false,
    },
    // Number of pinned (hand-drawn) section rectangles the host keeps; shows
    // the "custom layout (N) ✕" chip whose click emits clearCustomRects.
    customCount: {
        type: Number,
        default: 0,
    },
    // Compact pass on/off (emits update:compact). Toggle hidden unless the
    // host opts in — drawn sections are immune to compaction either way.
    showCompactToggle: {
        type: Boolean,
        default: false,
    },
    compact: {
        type: Boolean,
        default: true,
    },
    ferriteColor: {
        type: String,
        default: '#7b7c7d',
    },
    bobbinColor: {
        type: String,
        default: '#1b1b1b',
    },
    copperColor: {
        type: String,
        default: '#b87333',
    },
    insulationColor: {
        type: String,
        default: '#fff05b',
    },
    marginColor: {
        type: String,
        default: '#fff05b',
    },
    backgroundColor: {
        type: String,
        default: 'transparent',
    },
    textColor: {
        type: String,
        default: '#ffffff',
    },
});

const emit = defineEmits(['sectionSelected', 'turnSelected', 'placeWinding', 'resizeProportions', 'resizeMargins', 'resizeSectionRect', 'clearCustomRects', 'update:compact']);

function cssColor(color) {
    // Style-store colors arrive as '0xRRGGBB'; SVG wants '#RRGGBB'.
    if (typeof color === 'string' && color.startsWith('0x')) {
        return '#' + color.slice(2);
    }
    return color;
}

const model = computed(() => buildStudioModel(props.masStore.mas?.magnetic));

const colorByWinding = ref(true);
const hoveredWinding = ref(null);
const hoveredTurn = ref(null);
const selectedSection = ref(null);
const tooltip = ref(null); // {x, y, lines}

const viewBox = computed(() => {
    const bounds = model.value.bounds;
    return `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;
});

// Core silhouette as one even-odd path: outer rectangle minus window cavities.
const corePath = computed(() => {
    const core = model.value.core;
    const rectPath = (r) => `M ${r.x} ${r.y} h ${r.width} v ${r.height} h ${-r.width} Z`;
    return [rectPath(core.outer), ...core.cavities.map(rectPath)].join(' ');
});

function turnFill(turn) {
    if (!colorByWinding.value) {
        return cssColor(props.copperColor);
    }
    return windingColor(model.value.windingNames, turn.winding);
}

function turnOpacity(turn) {
    if (hoveredWinding.value != null && turn.winding !== hoveredWinding.value) {
        return 0.25;
    }
    return turn.isReturn ? 0.55 : 1.0;
}

function marginRects(section) {
    // section.margin = [topOrLeft, bottomOrRight] in meters, along the
    // section's turns axis: overlapping layers stack radially, so the margins
    // sit above/below; contiguous layers stack axially, so they sit left/right.
    if (section.margin == null || section.type !== 'conduction') {
        return [];
    }
    const MM = 1000;
    const rects = [];
    const [before, after] = section.margin;
    const horizontal = section.layersOrientation === 'contiguous';
    if (before > 0) {
        rects.push(horizontal
            ? { x: section.rect.x - before * MM, y: section.rect.y, width: before * MM, height: section.rect.height }
            : { x: section.rect.x, y: section.rect.y - before * MM, width: section.rect.width, height: before * MM });
    }
    if (after > 0) {
        rects.push(horizontal
            ? { x: section.rect.x + section.rect.width, y: section.rect.y, width: after * MM, height: section.rect.height }
            : { x: section.rect.x, y: section.rect.y + section.rect.height, width: section.rect.width, height: after * MM });
    }
    return rects;
}

function onTurnEnter(turn, event) {
    hoveredTurn.value = turn.name;
    hoveredWinding.value = turn.winding;
    const lines = [turn.name + (turn.isReturn ? ' (return crossing)' : '')];
    if (turn.layer != null) {
        lines.push(turn.layer);
    }
    moveTooltip(event, lines);
}

function onTurnLeave() {
    hoveredTurn.value = null;
    hoveredWinding.value = null;
    tooltip.value = null;
}

function onSectionClick(section) {
    selectedSection.value = selectedSection.value === section.name ? null : section.name;
    emit('sectionSelected', selectedSection.value);
}

function onSectionEnter(section, event) {
    if (hoveredTurn.value != null) {
        return;
    }
    const lines = [section.name];
    if (section.fillingFactor != null) {
        lines.push(`filling factor ${(section.fillingFactor * 100).toFixed(1)} %`);
    }
    if (section.windingWindow != null) {
        lines.push(`winding window ${section.windingWindow}`);
    }
    moveTooltip(event, lines);
}

function moveTooltip(event, lines) {
    const container = event.currentTarget.closest('.winding-studio-plot');
    const containerBounds = container.getBoundingClientRect();
    tooltip.value = {
        x: event.clientX - containerBounds.left + 12,
        y: event.clientY - containerBounds.top + 12,
        lines,
    };
}

function legendHover(windingName) {
    hoveredWinding.value = windingName;
}

function legendLeave() {
    hoveredWinding.value = null;
}

// P1 fit indicator — pure DISPLAY geometry on the winder's output (section /
// turn containment in their windows + the winder's own fillingFactor). No
// physics is recomputed here; the winder remains the authority and throws on
// truly unwindable inputs.
const fitStatus = computed(() => {
    const m = model.value;
    if (!m.valid || m.windows.length === 0 || m.sections.length === 0) {
        return null;
    }
    const eps = 1e-3; // mm
    const within = (r, w) =>
        r.x >= w.x - eps && r.y >= w.y - eps
        && r.x + r.width <= w.x + w.width + eps
        && r.y + r.height <= w.y + w.height + eps;
    const windowFor = (index) => m.windows.find((w) => w.index === index) ?? m.windows[0];
    let worstFill = 0;
    let overflow = false;
    for (const section of m.sections) {
        if (section.type !== 'conduction') {
            continue;
        }
        if (section.fillingFactor != null) {
            worstFill = Math.max(worstFill, section.fillingFactor);
        }
        if (!within(section.rect, windowFor(section.windingWindow).rect)) {
            overflow = true;
        }
    }
    for (const turn of m.turns) {
        // Return crossings legitimately sit outside the windows (even outside
        // the core for lateral-leg loops); only own crossings must fit.
        if (!turn.isReturn && !m.windows.some((w) => within(turn.rect, w.rect))) {
            overflow = true;
        }
    }
    if (worstFill > 1) {
        overflow = true;
    }
    return { overflow, worstFill };
});

// ---------------------------------------------------------------------------
// P1: drag a winding chip onto a core leg
// ---------------------------------------------------------------------------

const drag = ref(null); // {winding, color, x, y} in client coords
const dropColumn = ref(null); // column index under the pointer

function startChipDrag(windingName, event) {
    if (!props.editable || props.busy) {
        return;
    }
    // No preventDefault: the chips set touch-action: none, and preventing here
    // trips Chrome's passive-listener warning.
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.value = {
        winding: windingName,
        color: windingColor(model.value.windingNames, windingName),
        x: event.clientX,
        y: event.clientY,
    };
    dropColumn.value = null;
}

function moveChipDrag(event) {
    if (drag.value == null) {
        return;
    }
    drag.value.x = event.clientX;
    drag.value.y = event.clientY;
    // The chip holds pointer capture, so hit-test geometrically.
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const slot = under?.closest?.('[data-studio-column]');
    dropColumn.value = slot != null ? Number(slot.getAttribute('data-studio-column')) : null;
}

function endChipDrag() {
    if (drag.value == null) {
        return;
    }
    const placement = dropColumn.value;
    const windingName = drag.value.winding;
    drag.value = null;
    if (placement != null) {
        emit('placeWinding', { winding: windingName, columnIndex: placement });
    }
    dropColumn.value = null;
}

function columnLabel(column) {
    if (column.type === 'central') {
        return 'Center leg';
    }
    return column.rect.x + column.rect.width / 2 < 0 ? 'Left leg' : 'Right leg';
}

// ---------------------------------------------------------------------------
// P2: drag the boundary between two adjacent sections to resize proportions
// ---------------------------------------------------------------------------

// Boundaries between adjacent conduction sections of DIFFERENT windings in the
// same winding window, stacking along x (the concentric overlapping layout).
// Dragging one re-distributes the per-winding proportions; the winder recomputes
// the real geometry on the emitted re-wind.
const sectionBoundaries = computed(() => {
    if (!props.editable || !model.value.valid) {
        return [];
    }
    const conduction = model.value.sections
        .filter((section) => section.type === 'conduction')
        .sort((a, b) => a.rect.x - b.rect.x);
    const boundaries = [];
    for (let i = 0; i + 1 < conduction.length; i++) {
        const left = conduction[i];
        const right = conduction[i + 1];
        if (left.windingWindow !== right.windingWindow) {
            continue;
        }
        if (left.windings.join() === right.windings.join()) {
            continue;
        }
        const y0 = Math.max(left.rect.y, right.rect.y);
        const y1 = Math.min(left.rect.y + left.rect.height, right.rect.y + right.rect.height);
        if (y1 <= y0) {
            continue;
        }
        boundaries.push({
            id: `${left.name}|${right.name}`,
            left,
            right,
            x: (left.rect.x + left.rect.width + right.rect.x) / 2,
            y: y0,
            height: y1 - y0,
            hitWidth: Math.max(right.rect.x - left.rect.x - left.rect.width, Math.min(left.rect.width, right.rect.width) * 0.3),
        });
    }
    return boundaries;
});

const boundaryDrag = ref(null); // {boundary, startClientX, dx (mm), scale}

function startBoundaryDrag(boundary, event) {
    if (!props.editable || props.busy) {
        return;
    }
    const svg = event.currentTarget.ownerSVGElement;
    const ctm = svg.getScreenCTM();
    event.currentTarget.setPointerCapture(event.pointerId);
    boundaryDrag.value = { boundary, startClientX: event.clientX, dx: 0, scale: 1 / ctm.a };
}

function moveBoundaryDrag(event) {
    const drag_ = boundaryDrag.value;
    if (drag_ == null) {
        return;
    }
    const raw = (event.clientX - drag_.startClientX) * drag_.scale;
    // Clamp: neither section may shrink below ~15% of its width (the winder is
    // the authority on true limits; this just keeps the gesture sane).
    const minKeep = 0.15;
    const maxGrow = drag_.boundary.right.rect.width * (1 - minKeep);
    const maxShrink = drag_.boundary.left.rect.width * (1 - minKeep);
    drag_.dx = Math.max(-maxShrink, Math.min(maxGrow, raw));
}

function endBoundaryDrag() {
    const drag_ = boundaryDrag.value;
    boundaryDrag.value = null;
    if (drag_ == null || Math.abs(drag_.dx) < 1e-3) {
        return;
    }
    // Re-derive per-winding proportions from the CURRENT conduction sections,
    // with the dragged boundary shifting width between its two neighbours.
    // (Same measure the builder itself uses: sum of section widths per winding.)
    const dims = new Map();
    for (const section of model.value.sections) {
        if (section.type !== 'conduction') {
            continue;
        }
        let width = section.rect.width;
        if (section.name === drag_.boundary.left.name) {
            width += drag_.dx;
        }
        else if (section.name === drag_.boundary.right.name) {
            width -= drag_.dx;
        }
        for (const windingName of section.windings) {
            dims.set(windingName, (dims.get(windingName) ?? 0) + width / section.windings.length);
        }
    }
    const total = [...dims.values()].reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
        return;
    }
    const proportions = model.value.windingNames.map((name) => (dims.get(name) ?? 0) / total);
    emit('resizeProportions', proportions);
}

// ---------------------------------------------------------------------------
// P2: drag a section's top/bottom edge against the window wall to set margins
// ---------------------------------------------------------------------------

// Resizing a section along its turns axis IS margin tape in MAS terms: the
// distance from the winding-window wall to the section edge. Dragging an edge
// emits the margin; the winder re-spreads/re-packs the turns accordingly.
const MARGIN_MM = 1000;
const sectionEdgeHandles = computed(() => {
    if (!props.editable || !model.value.valid || model.value.windows.length === 0) {
        return [];
    }
    const handles = [];
    for (const section of model.value.sections) {
        if (section.type !== 'conduction' || section.layersOrientation === 'contiguous') {
            continue;
        }
        if (section.name === selectedSection.value) {
            // The selected section is in free-transform mode; its edges belong
            // to the transform handles, not the margin handles.
            continue;
        }
        const window = model.value.windows.find((w) => w.index === section.windingWindow) ?? model.value.windows[0];
        const hitHeight = Math.min(section.rect.height * 0.25, window.rect.height * 0.06);
        for (const side of ['top', 'bottom']) {
            const edgeY = side === 'top' ? section.rect.y : section.rect.y + section.rect.height;
            handles.push({
                id: `${section.name}|${side}`,
                section,
                side,
                window,
                x: section.rect.x,
                width: section.rect.width,
                y: edgeY - hitHeight / 2,
                hitHeight,
                edgeY,
            });
        }
    }
    return handles;
});

const edgeDrag = ref(null); // {handle, startClientY, dy (mm), scale}

function startEdgeDrag(handle, event) {
    if (!props.editable || props.busy) {
        return;
    }
    const svg = event.currentTarget.ownerSVGElement;
    const ctm = svg.getScreenCTM();
    event.currentTarget.setPointerCapture(event.pointerId);
    edgeDrag.value = { handle, startClientY: event.clientY, dy: 0, scale: 1 / ctm.d };
}

function moveEdgeDrag(event) {
    const drag_ = edgeDrag.value;
    if (drag_ == null) {
        return;
    }
    const raw = (event.clientY - drag_.startClientY) * drag_.scale;
    // Clamp: the edge stays between the window wall and 20% of the section's
    // height from its opposite edge (the winder is the authority on real fit).
    const { handle } = drag_;
    const minKeep = handle.section.rect.height * 0.2;
    let low;
    let high;
    if (handle.side === 'top') {
        low = handle.window.rect.y - handle.edgeY;
        high = handle.section.rect.y + handle.section.rect.height - minKeep - handle.edgeY;
    }
    else {
        low = handle.section.rect.y + minKeep - handle.edgeY;
        high = handle.window.rect.y + handle.window.rect.height - handle.edgeY;
    }
    drag_.dy = Math.max(low, Math.min(high, raw));
}

function endEdgeDrag() {
    const drag_ = edgeDrag.value;
    edgeDrag.value = null;
    if (drag_ == null || Math.abs(drag_.dy) < 1e-3) {
        return;
    }
    const { handle } = drag_;
    const newEdgeY = handle.edgeY + drag_.dy;
    // Margin = distance from the window wall to the section edge, in meters.
    // SVG y is flipped, so the smaller-y wall is the physical TOP (topOrLeft).
    let side;
    let marginMm;
    if (handle.side === 'top') {
        side = 'topOrLeft';
        marginMm = newEdgeY - handle.window.rect.y;
    }
    else {
        side = 'bottomOrRight';
        marginMm = handle.window.rect.y + handle.window.rect.height - newEdgeY;
    }
    // Snap back to "no margin" when released within a hair of the wall.
    if (marginMm < 0.05) {
        marginMm = 0;
    }
    emit('resizeMargins', {
        sectionName: handle.section.name,
        side,
        value: marginMm / MARGIN_MM,
    });
}

// ---------------------------------------------------------------------------
// P2.5: free transform of a SELECTED section — a totally custom rectangle.
// Dragging any of the four edges resizes it (including the laterals); dragging
// the body moves it. On release the host writes the new rect into the section
// and the winder re-flows layers+turns INSIDE it (rewind_layers_and_turns —
// sections are not recomputed and nothing re-compacts the custom placement).
// ---------------------------------------------------------------------------

const transformTarget = computed(() => {
    if (!props.editable || selectedSection.value == null || !model.value.valid) {
        return null;
    }
    const section = model.value.sections.find(
        (candidate) => candidate.name === selectedSection.value && candidate.type === 'conduction');
    return section ?? null;
});

const transformDrag = ref(null); // {mode, section, startX, startY, sx, sy, rect}

const transformRect = computed(() => transformDrag.value?.rect ?? transformTarget.value?.rect ?? null);

function transformThickness() {
    const rect = transformRect.value;
    return Math.max(Math.min(rect.width, rect.height) * 0.25, Math.min(rect.width, rect.height, 1.5));
}

function startTransformDrag(mode, event) {
    const section = transformTarget.value;
    if (section == null || props.busy) {
        return;
    }
    const svg = event.currentTarget.ownerSVGElement;
    const ctm = svg.getScreenCTM();
    event.currentTarget.setPointerCapture(event.pointerId);
    transformDrag.value = {
        mode,
        section,
        startX: event.clientX,
        startY: event.clientY,
        sx: 1 / ctm.a,
        sy: 1 / ctm.d,
        rect: { ...section.rect },
    };
}

function moveTransformDrag(event) {
    const drag_ = transformDrag.value;
    if (drag_ == null) {
        return;
    }
    const dx = (event.clientX - drag_.startX) * drag_.sx;
    const dy = (event.clientY - drag_.startY) * drag_.sy;
    const original = drag_.section.rect;
    const minWidth = original.width * 0.2;
    const minHeight = original.height * 0.2;
    const rect = { ...original };
    switch (drag_.mode) {
        case 'move':
            rect.x = original.x + dx;
            rect.y = original.y + dy;
            break;
        case 'w': {
            const newX = Math.min(original.x + dx, original.x + original.width - minWidth);
            rect.width = original.width + (original.x - newX);
            rect.x = newX;
            break;
        }
        case 'e':
            rect.width = Math.max(minWidth, original.width + dx);
            break;
        case 'n': {
            const newY = Math.min(original.y + dy, original.y + original.height - minHeight);
            rect.height = original.height + (original.y - newY);
            rect.y = newY;
            break;
        }
        case 's':
            rect.height = Math.max(minHeight, original.height + dy);
            break;
    }
    drag_.rect = rect;
}

function endTransformDrag() {
    const drag_ = transformDrag.value;
    transformDrag.value = null;
    if (drag_ == null) {
        return;
    }
    const original = drag_.section.rect;
    const rect = drag_.rect;
    const unchanged = ['x', 'y', 'width', 'height']
        .every((key) => Math.abs(rect[key] - original[key]) < 1e-3);
    if (unchanged) {
        if (drag_.mode === 'move') {
            // A plain click on the transform body deselects the section.
            selectedSection.value = null;
            emit('sectionSelected', null);
        }
        return;
    }
    // SVG mm (y flipped) -> physical meters, center-based like MAS sections.
    emit('resizeSectionRect', {
        sectionName: drag_.section.name,
        coordinates: [(rect.x + rect.width / 2) / MARGIN_MM, -(rect.y + rect.height / 2) / MARGIN_MM],
        dimensions: [rect.width / MARGIN_MM, rect.height / MARGIN_MM],
    });
}
</script>

<template>
    <div
        class="winding-studio"
        :data-cy="dataTestLabel + '-WindingStudio'"
        :style="{ 'background-color': backgroundColor, color: textColor }"
    >
        <div v-if="!model.valid" class="winding-studio-empty">
            {{ model.reason }}
        </div>
        <template v-else>
            <div class="winding-studio-toolbar">
                <span class="winding-studio-title">Winding Studio</span>
                <div class="winding-studio-legend">
                    <button
                        v-for="windingName in model.windingNames"
                        :key="windingName"
                        type="button"
                        class="winding-studio-chip"
                        :class="{ 'winding-studio-chip-draggable': editable && !busy }"
                        :style="{ '--chip-color': windingColor(model.windingNames, windingName) }"
                        :data-cy="dataTestLabel + '-WindingStudio-chip-' + windingName"
                        @mouseenter="legendHover(windingName)"
                        @mouseleave="legendLeave()"
                        @pointerdown="startChipDrag(windingName, $event)"
                        @pointermove="moveChipDrag($event)"
                        @pointerup="endChipDrag()"
                        @pointercancel="endChipDrag()"
                    >
                        <span class="winding-studio-chip-dot"></span>{{ windingName }}
                    </button>
                    <span v-if="editable && !busy" class="winding-studio-hint">{{
                        transformTarget != null
                            ? 'custom rectangle — drag edges to reshape, centre to move, click to deselect'
                            : 'drag a winding onto a leg · click a section to reshape it'
                    }}</span>
                    <span v-if="busy" class="winding-studio-hint">winding…</span>
                </div>
                <span
                    v-if="fitStatus != null"
                    class="winding-studio-fit"
                    :class="fitStatus.overflow ? 'winding-studio-fit-bad' : 'winding-studio-fit-good'"
                    :data-cy="dataTestLabel + '-WindingStudio-fit'"
                >
                    {{ fitStatus.overflow ? '⚠ does not fit' : '✓ fits' }}<template
                        v-if="fitStatus.worstFill > 0"> · fill {{ (fitStatus.worstFill * 100).toFixed(0) }}%</template>
                </span>
                <button
                    v-if="customCount > 0 && editable"
                    type="button"
                    class="winding-studio-chip winding-studio-custom-chip"
                    :data-cy="dataTestLabel + '-WindingStudio-clear-custom'"
                    title="Sections you drew are pinned and survive re-winds; click to clear them and return to the automatic layout"
                    @click="emit('clearCustomRects')"
                >
                    custom layout ({{ customCount }}) ✕
                </button>
                <label v-if="showCompactToggle && editable" class="winding-studio-toggle" title="Compaction pass on re-winds (drawn sections are never compacted)">
                    <input
                        type="checkbox"
                        :checked="compact"
                        :data-cy="dataTestLabel + '-WindingStudio-compact'"
                        @change="emit('update:compact', $event.target.checked)"
                    />
                    Compact
                </label>
                <label class="winding-studio-toggle">
                    <input v-model="colorByWinding" type="checkbox" />
                    Color by winding
                </label>
            </div>
            <div class="winding-studio-plot">
                <svg
                    :viewBox="viewBox"
                    preserveAspectRatio="xMidYMid meet"
                    class="winding-studio-svg"
                >
                    <!-- Core -->
                    <path :d="corePath" :fill="cssColor(ferriteColor)" fill-rule="evenodd" />
                    <!-- Gaps: breaks in the columns -->
                    <rect
                        v-for="(gap, index) in model.core.gaps"
                        :key="'gap' + index"
                        v-bind="gap"
                        :fill="backgroundColor === 'transparent' ? '#000000' : backgroundColor"
                    />
                    <!-- Bobbin -->
                    <rect
                        v-for="(part, index) in model.bobbin"
                        :key="'bobbin' + index"
                        v-bind="part"
                        :fill="cssColor(bobbinColor)"
                    />
                    <!-- Margins -->
                    <template v-for="section in model.sections">
                        <rect
                            v-for="(marginRect, index) in marginRects(section)"
                            :key="section.name + 'margin' + index"
                            v-bind="marginRect"
                            :fill="cssColor(marginColor)"
                            opacity="0.8"
                        />
                    </template>
                    <!-- Insulation layers -->
                    <template v-for="layer in model.layers">
                        <rect
                            v-if="layer.type === 'insulation'"
                            :key="layer.name"
                            v-bind="layer.rect"
                            :fill="cssColor(insulationColor)"
                            opacity="0.9"
                        />
                    </template>
                    <!-- Turns -->
                    <g v-for="turn in model.turns" :key="turn.name + (turn.isReturn ? '-r' : '')">
                        <circle
                            v-if="turn.round"
                            :cx="turn.rect.x + turn.rect.width / 2"
                            :cy="turn.rect.y + turn.rect.height / 2"
                            :r="turn.rect.width / 2"
                            :fill="turnFill(turn)"
                            :opacity="turnOpacity(turn)"
                            :stroke="hoveredTurn === turn.name ? '#ffffff' : 'none'"
                            stroke-width="1"
                            vector-effect="non-scaling-stroke"
                            class="winding-studio-turn"
                            @mouseenter="onTurnEnter(turn, $event)"
                            @mouseleave="onTurnLeave()"
                            @click="emit('turnSelected', turn.name)"
                        />
                        <rect
                            v-else
                            v-bind="turn.rect"
                            :fill="turnFill(turn)"
                            :opacity="turnOpacity(turn)"
                            :stroke="hoveredTurn === turn.name ? '#ffffff' : 'none'"
                            stroke-width="1"
                            vector-effect="non-scaling-stroke"
                            class="winding-studio-turn"
                            @mouseenter="onTurnEnter(turn, $event)"
                            @mouseleave="onTurnLeave()"
                            @click="emit('turnSelected', turn.name)"
                        />
                        <!-- PI-Expert visual language: filled center marks the winding start -->
                        <circle
                            v-if="turn.isStart"
                            :cx="turn.rect.x + turn.rect.width / 2"
                            :cy="turn.rect.y + turn.rect.height / 2"
                            :r="turn.rect.width / 6"
                            fill="#000000"
                            opacity="0.6"
                            pointer-events="none"
                        />
                    </g>
                    <!-- Section outlines on top (hover/selection targets) -->
                    <rect
                        v-for="section in model.sections"
                        :key="'section' + section.name"
                        v-bind="section.rect"
                        fill="transparent"
                        :stroke="selectedSection === section.name ? '#ffffff' : (section.type === 'conduction' ? '#ffffff55' : 'transparent')"
                        :stroke-dasharray="selectedSection === section.name ? 'none' : '4 3'"
                        stroke-width="1"
                        vector-effect="non-scaling-stroke"
                        class="winding-studio-section"
                        :data-cy="dataTestLabel + '-WindingStudio-section-' + section.name"
                        @mouseenter="onSectionEnter(section, $event)"
                        @mouseleave="tooltip = null"
                        @click="onSectionClick(section)"
                    />
                    <!-- Section boundary handles: drag to re-distribute proportions -->
                    <g v-for="boundary in sectionBoundaries" :key="'boundary' + boundary.id">
                        <rect
                            :x="boundary.x - boundary.hitWidth / 2"
                            :y="boundary.y"
                            :width="boundary.hitWidth"
                            :height="boundary.height"
                            fill="transparent"
                            class="winding-studio-boundary"
                            :data-cy="dataTestLabel + '-WindingStudio-boundary'"
                            @pointerdown="startBoundaryDrag(boundary, $event)"
                            @pointermove="moveBoundaryDrag($event)"
                            @pointerup="endBoundaryDrag()"
                            @pointercancel="endBoundaryDrag()"
                        />
                        <line
                            v-if="boundaryDrag != null && boundaryDrag.boundary.id === boundary.id"
                            :x1="boundary.x + boundaryDrag.dx"
                            :x2="boundary.x + boundaryDrag.dx"
                            :y1="boundary.y"
                            :y2="boundary.y + boundary.height"
                            stroke="#ffffff"
                            stroke-width="2"
                            stroke-dasharray="5 3"
                            vector-effect="non-scaling-stroke"
                            pointer-events="none"
                        />
                    </g>
                    <!-- Section edge handles: drag against the window wall to set margins -->
                    <g v-for="handle in sectionEdgeHandles" :key="'edge' + handle.id">
                        <rect
                            :x="handle.x"
                            :y="handle.y"
                            :width="handle.width"
                            :height="handle.hitHeight"
                            fill="transparent"
                            class="winding-studio-edge"
                            :data-cy="dataTestLabel + '-WindingStudio-edge-' + handle.side"
                            @pointerdown="startEdgeDrag(handle, $event)"
                            @pointermove="moveEdgeDrag($event)"
                            @pointerup="endEdgeDrag()"
                            @pointercancel="endEdgeDrag()"
                        />
                        <line
                            v-if="edgeDrag != null && edgeDrag.handle.id === handle.id"
                            :x1="handle.x"
                            :x2="handle.x + handle.width"
                            :y1="handle.edgeY + edgeDrag.dy"
                            :y2="handle.edgeY + edgeDrag.dy"
                            stroke="#ffffff"
                            stroke-width="2"
                            stroke-dasharray="5 3"
                            vector-effect="non-scaling-stroke"
                            pointer-events="none"
                        />
                    </g>
                    <!-- Free transform of the selected section: custom rectangle -->
                    <g v-if="transformTarget != null && drag == null">
                        <rect
                            :x="transformRect.x"
                            :y="transformRect.y"
                            :width="transformRect.width"
                            :height="transformRect.height"
                            fill="#ffffff10"
                            stroke="#ffffff"
                            stroke-width="1.5"
                            :stroke-dasharray="transformDrag != null ? '6 3' : 'none'"
                            vector-effect="non-scaling-stroke"
                            class="winding-studio-transform-move"
                            :data-cy="dataTestLabel + '-WindingStudio-transform-move'"
                            @pointerdown="startTransformDrag('move', $event)"
                            @pointermove="moveTransformDrag($event)"
                            @pointerup="endTransformDrag()"
                            @pointercancel="endTransformDrag()"
                        />
                        <rect
                            v-for="side in ['n', 's', 'w', 'e']"
                            :key="'transform' + side"
                            :x="side === 'e' ? transformRect.x + transformRect.width - transformThickness() / 2
                                : side === 'w' ? transformRect.x - transformThickness() / 2 : transformRect.x"
                            :y="side === 's' ? transformRect.y + transformRect.height - transformThickness() / 2
                                : side === 'n' ? transformRect.y - transformThickness() / 2 : transformRect.y"
                            :width="side === 'n' || side === 's' ? transformRect.width : transformThickness()"
                            :height="side === 'w' || side === 'e' ? transformRect.height : transformThickness()"
                            fill="transparent"
                            :class="side === 'n' || side === 's' ? 'winding-studio-transform-ns' : 'winding-studio-transform-ew'"
                            :data-cy="dataTestLabel + '-WindingStudio-transform-' + side"
                            @pointerdown="startTransformDrag(side, $event)"
                            @pointermove="moveTransformDrag($event)"
                            @pointerup="endTransformDrag()"
                            @pointercancel="endTransformDrag()"
                        />
                    </g>
                    <!-- Drop slots: the core legs light up while a chip is dragged -->
                    <g v-if="drag != null">
                        <g v-for="column in model.core.columns" :key="'slot' + column.index">
                            <rect
                                v-bind="column.rect"
                                :data-studio-column="column.index"
                                :fill="dropColumn === column.index ? drag.color : '#ffffff'"
                                :opacity="dropColumn === column.index ? 0.55 : 0.18"
                                :stroke="drag.color"
                                stroke-width="2"
                                vector-effect="non-scaling-stroke"
                                class="winding-studio-slot"
                            />
                            <text
                                :x="column.rect.x + column.rect.width / 2"
                                :y="column.rect.y + column.rect.height / 2"
                                text-anchor="middle"
                                dominant-baseline="middle"
                                class="winding-studio-slot-label"
                                :style="{ fontSize: Math.min(column.rect.width * 0.28, model.bounds.height * 0.05) + 'px' }"
                            >{{ columnLabel(column) }}</text>
                        </g>
                    </g>
                </svg>
                <div
                    v-if="tooltip != null"
                    class="winding-studio-tooltip"
                    :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
                >
                    <div v-for="line in tooltip.lines" :key="line">{{ line }}</div>
                </div>
                <div v-if="busy" class="winding-studio-busy">winding…</div>
            </div>
            <Teleport to="body">
                <div
                    v-if="drag != null"
                    class="winding-studio-ghost"
                    :style="{ left: drag.x + 'px', top: drag.y + 'px', '--chip-color': drag.color }"
                >
                    <span class="winding-studio-chip-dot"></span>{{ drag.winding }}
                </div>
            </Teleport>
        </template>
    </div>
</template>

<style scoped>
.winding-studio {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}
.winding-studio-empty {
    padding: 1rem;
    opacity: 0.7;
    font-style: italic;
    text-align: center;
}
.winding-studio-toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
}
.winding-studio-title {
    font-weight: 600;
    opacity: 0.9;
}
.winding-studio-legend {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}
.winding-studio-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    border: 1px solid var(--chip-color);
    border-radius: 1rem;
    background: transparent;
    color: inherit;
    padding: 0.05rem 0.5rem;
    font-size: 0.8rem;
    cursor: default;
}
.winding-studio-chip-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--chip-color);
    display: inline-block;
}
.winding-studio-custom-chip {
    --chip-color: #ffffff88;
    cursor: pointer;
}
.winding-studio-toggle {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    opacity: 0.85;
}
.winding-studio-plot {
    position: relative;
    width: 100%;
}
.winding-studio-svg {
    width: 100%;
    max-height: 45vh;
    display: block;
}
.winding-studio-turn {
    cursor: pointer;
}
.winding-studio-section {
    cursor: pointer;
}
.winding-studio-tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.85);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 10;
}
.winding-studio-chip-draggable {
    cursor: grab;
    touch-action: none;
}
.winding-studio-hint {
    font-size: 0.75rem;
    opacity: 0.6;
    font-style: italic;
}
.winding-studio-fit {
    font-size: 0.8rem;
    padding: 0.05rem 0.5rem;
    border-radius: 1rem;
    border: 1px solid transparent;
}
.winding-studio-fit-good {
    color: #7fd48a;
    border-color: #7fd48a55;
}
.winding-studio-fit-bad {
    color: #ff8b8b;
    border-color: #ff8b8b88;
}
.winding-studio-slot {
    cursor: copy;
}
.winding-studio-boundary {
    cursor: col-resize;
    touch-action: none;
}
.winding-studio-edge {
    cursor: row-resize;
    touch-action: none;
}
.winding-studio-transform-move {
    cursor: move;
    touch-action: none;
}
.winding-studio-transform-ns {
    cursor: ns-resize;
    touch-action: none;
}
.winding-studio-transform-ew {
    cursor: ew-resize;
    touch-action: none;
}
.winding-studio-slot-label {
    fill: #ffffff;
    pointer-events: none;
    font-weight: 600;
}
.winding-studio-busy {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    color: #ffffff;
    font-weight: 600;
    z-index: 5;
}
.winding-studio-ghost {
    position: fixed;
    transform: translate(12px, 12px);
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    border: 1px solid var(--chip-color);
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.8);
    color: #ffffff;
    padding: 0.05rem 0.5rem;
    font-size: 0.8rem;
    pointer-events: none;
    z-index: 1000;
}
</style>
