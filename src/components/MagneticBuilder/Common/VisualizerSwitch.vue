<script setup>
import Magnetic2DVisualizer from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import Magnetic3DVisualizer from '/WebSharedComponents/Common/Magnetic3DVisualizer.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
</script>

<script>
import { useTaskQueueStore } from '../../../stores/taskQueue'

/**
 * The cross-section or the solid, one dropdown (ABT #1121).
 *
 * Three of the layouts give the geometry a cell of its own and let the user say
 * which view goes in it. Both visualizers are the shared ones, bound exactly as
 * the Coil and Core panels bind them, so a view looks the same wherever it is
 * shown; this only decides which of the two is mounted.
 *
 * The choice is per view, not global: a layout that shows two of these (the
 * planar one shows a cross-section beside a response) keeps them independent.
 */
const VIEWS = {
    '2D': 'Cross-section (2D)',
    '3D': 'Solid (3D)',
};

export default {
    emits: ['update:view'],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
            required: true,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
        /** '2D' or '3D'. Bound with v-model:view. */
        view: {
            type: String,
            default: '2D',
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
        enableTemperaturePlot: {
            type: Boolean,
            default: true,
        },
        /** Bumped by the parent to force a redraw after the design changed. */
        forceUpdate: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            taskQueueStore: useTaskQueueStore(),
            availableViews: VIEWS,
            subscriptions: [],
            selfUpdate: 0,
            // What ElementFromList writes into; kept in step with the prop.
            editable: { view: this.view in VIEWS ? this.view : '2D' },
        }
    },
    computed: {
        /**
         * ElementFromList WRITES `modelValue[name]` and then emits `update`, so it
         * needs a real object to write into — a computed would be thrown away and
         * the selection would never stick. This one mirrors the prop.
         */
        viewModel() {
            return this.editable;
        },
        redraw() {
            return this.forceUpdate + this.selfUpdate;
        },
        /**
         * The 3D view needs a magnetic with a wound coil; before that it draws
         * nothing useful, so the switch says so instead of showing an empty box.
         */
        canDraw3D() {
            return this.masStore.mas?.magnetic?.coil?.turnsDescription != null;
        },
        magnetic() {
            return this.masStore.mas.magnetic;
        },
    },
    mounted() {
        // Same trigger the Core panel uses: redraw when the engine says the
        // design was rebuilt, so the canvas is never a step behind the inputs.
        this.subscriptions.push(this.taskQueueStore.$onAction(({ name, args, after }) => {
            after(() => {
                if (name === 'magneticBuilderReady' || name === 'masAutocompleted' || name === 'coreProcessed') {
                    if (args[0] !== false) {
                        this.selfUpdate += 1;
                    }
                }
            });
        }));
    },
    beforeUnmount() {
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    },
    watch: {
        view(chosen) {
            if (chosen in VIEWS && chosen !== this.editable.view) {
                this.editable.view = chosen;
            }
        },
    },
    methods: {
        viewChanged(chosen) {
            if (!(chosen in VIEWS)) {
                throw new Error(`Unknown geometry view "${chosen}"`);
            }
            this.$emit('update:view', chosen);
        },
    },
}
</script>

<template>
    <div class="visualizer-switch" :data-cy="dataTestLabel + '-VisualizerSwitch'">
        <div class="visualizer-switch-bar">
            <ElementFromList
                :dataTestLabel="dataTestLabel + '-VisualizerSwitch-View'"
                :name="'view'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="editable"
                @update="viewChanged"
                :options="availableViews"
                :labelWidthProportionClass="'col-0'"
                :selectStyleClass="'col-12'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
        </div>

        <div
            class="visualizer-switch-canvas"
            :data-cy="dataTestLabel + '-VisualizerSwitch-' + viewModel.view"
        >
            <Magnetic2DVisualizer
                v-if="viewModel.view === '2D'"
                :dataTestLabel="dataTestLabel + '-Magnetic2DVisualizer'"
                :modelValue="masStore.mas"
                :forceUpdate="redraw"
                :operatingPointIndex="operatingPointIndex"
                :enableZoom="false"
                :enableOptions="false"
                :enableHideOnFitting="enableSimulation"
                :coilFits="true"
                :plotModeInit="$stateStore.magnetic2DVisualizerState.plotMode"
                :includeFringingInit="$stateStore.magnetic2DVisualizerState.includeFringing"
                :backgroundColor="$styleStore.magneticBuilder.main['background-color'] || $styleStore.magneticBuilder.main['background'] || 'var(--p-dark)'"
                :textColor="$styleStore.magneticBuilder.inputTextColor?.color || 'var(--p-white)'"
                :buttonStyle="$styleStore.magneticBuilder.coilVisualizerButton"
                :insulationColor="$styleStore.magneticBuilder.painterColorInsulation || '0xfff05b'"
                :marginColor="$styleStore.magneticBuilder.painterColorMargin || '0xfff05b'"
                :spacerColor="$styleStore.magneticBuilder.painterColorSpacer || '0x3b3b3b'"
                :ferriteColor="$styleStore.magneticBuilder.painterColorFerrite || '0x7b7c7d'"
                :copperColor="$styleStore.magneticBuilder.painterColorCopper || '0xb87333'"
                :drawSpacer="$styleStore.magneticBuilder.painterDrawSpacer !== undefined ? $styleStore.magneticBuilder.painterDrawSpacer : true"
                :enableTemperaturePlot="enableTemperaturePlot"
                :loadingGif="$settingsStore.loadingGif"
            />
            <Magnetic3DVisualizer
                v-else-if="canDraw3D"
                :dataTestLabel="dataTestLabel + '-Magnetic3DVisualizer'"
                :magnetic="magnetic"
                :forceUpdate="redraw"
                :showCore="true"
                :showTurns="true"
                :showBobbin="true"
                :buttonColor="$styleStore.magneticBuilder.visualizerButtonColor?.color || 'var(--p-white)'"
                :loadingGif="$settingsStore.loadingGif"
                :backgroundColor="$styleStore.magneticBuilder.main['background-color'] || $styleStore.magneticBuilder.main['background'] || 'var(--p-dark)'"
            />
            <p
                v-else
                :data-cy="dataTestLabel + '-VisualizerSwitch-no3D'"
                class="visualizer-switch-empty"
            >
                The solid view needs a wound coil — advise or set a wire first.
            </p>
        </div>
    </div>
</template>

<style scoped>
.visualizer-switch {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-height: 0;
    height: 100%;
}

.visualizer-switch-bar {
    display: flex;
    justify-content: flex-end;
}

.visualizer-switch-bar :deep(.col-12) {
    max-width: 16rem;
}

.visualizer-switch-canvas {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.visualizer-switch-empty {
    color: var(--p-gray-400);
    font-size: 0.85rem;
    text-align: center;
    margin: 0;
    padding: 1.5rem 0.5rem;
}
</style>
