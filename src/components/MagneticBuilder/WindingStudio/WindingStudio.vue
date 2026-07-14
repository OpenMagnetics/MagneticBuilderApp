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

const emit = defineEmits(['sectionSelected', 'turnSelected']);

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
                        :style="{ '--chip-color': windingColor(model.windingNames, windingName) }"
                        @mouseenter="legendHover(windingName)"
                        @mouseleave="legendLeave()"
                    >
                        <span class="winding-studio-chip-dot"></span>{{ windingName }}
                    </button>
                </div>
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
                        @mouseenter="onSectionEnter(section, $event)"
                        @mouseleave="tooltip = null"
                        @click="onSectionClick(section)"
                    />
                </svg>
                <div
                    v-if="tooltip != null"
                    class="winding-studio-tooltip"
                    :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
                >
                    <div v-for="line in tooltip.lines" :key="line">{{ line }}</div>
                </div>
            </div>
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
</style>
