<script setup>
import PanelFrame from '/WebSharedComponents/Common/PanelFrame.vue'
import BasicCoreSelector from '../Core/BasicCoreSelector.vue'
import CoreInfo from '../Core/CoreInfo.vue'
import AlternativesPanel from '../Common/AlternativesPanel.vue'
import VisualizerSwitch from '../Common/VisualizerSwitch.vue'
</script>

<script>
import { BUILDER_LAYOUT_PROPS, BUILDER_LAYOUT_EMITS } from './layoutProps.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'

/**
 * Compare — the design pinned as the reference, everything else ranked against
 * it (ABT #1121).
 *
 * The question is "what else could I build this with?". The core panel stays,
 * because changing the reference is part of the comparison, but the screen
 * belongs to the alternatives; picking one adopts it and the comparison
 * re-centres on the new design.
 */
export default {
    emits: BUILDER_LAYOUT_EMITS,
    props: { ...BUILDER_LAYOUT_PROPS },
    data() {
        return {
            taskQueueStore: useTaskQueueStore(),
            geometryView: '2D',
            redraw: 0,
            adopted: null,
            subscriptions: [],
        }
    },
    mounted() {
        this.subscriptions.push(this.taskQueueStore.$onAction(({ name, after }) => {
            after(() => {
                if (name === 'coreProcessed' || name === 'magneticBuilderReady') {
                    this.redraw += 1;
                }
            });
        }));
    },
    beforeUnmount() {
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    },
    methods: {
        coreAdopted(candidate) {
            const core = candidate?.mas?.magnetic?.core?.functionalDescription;
            const shape = typeof core?.shape === 'string' ? core.shape : core?.shape?.name;
            this.adopted = shape ?? null;
            this.redraw += 1;
            setTimeout(() => { this.adopted = null; }, 8000);
        },
    },
}
</script>

<template>
    <div class="layout-compare" :data-cy="dataTestLabel + '-LayoutCompare'">
        <div class="compare-reference">
            <PanelFrame
                title="Reference design"
                icon="pi-bookmark-fill"
                :dataTestLabel="dataTestLabel + '-Compare-Reference'"
            >
                <div class="compare-canvas">
                    <VisualizerSwitch
                        :dataTestLabel="dataTestLabel + '-Compare'"
                        :masStore="masStore"
                        :operatingPointIndex="operatingPointIndex"
                        v-model:view="geometryView"
                        :enableSimulation="enableSimulation"
                        :enableTemperaturePlot="enableTemperaturePlot"
                        :forceUpdate="redraw"
                    />
                </div>
            </PanelFrame>

            <CoreInfo
                v-if="enableSimulation"
                :dataTestLabel="dataTestLabel + '-CoreInfo'"
                :advancedMode="$settingsStore.magneticBuilderSettings.advancedMode"
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
                :enableAutoSimulation="enableAutoSimulation"
            />

            <BasicCoreSelector
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableAutoSimulation="enableAutoSimulation"
                :enableSubmenu="enableSubmenu"
                :enableCustomize="enableCustomize"
                :enableAdvise="enableAdvise"
                :useVisualizers="false"
                :showInfoPanel="false"
                :forceUpdateVisualizer="redraw"
                :imageUpToDate="true"
                @customizeCore="$emit('customizeCore')"
            />
        </div>

        <div class="compare-alternatives">
            <PanelFrame
                title="Alternatives to this core"
                icon="pi-sitemap"
                accent="var(--p-info)"
                :dataTestLabel="dataTestLabel + '-Compare-Alternatives'"
            >
                <p
                    v-if="adopted"
                    :data-cy="dataTestLabel + '-Compare-adopted'"
                    class="compare-adopted"
                >Now building on {{ adopted }} — the comparison re-centred on it.</p>
                <AlternativesPanel
                    :dataTestLabel="dataTestLabel + '-Compare'"
                    :masStore="masStore"
                    :autoLoad="true"
                    @coreAdopted="coreAdopted"
                />
            </PanelFrame>
        </div>
    </div>
</template>

<style scoped>
.layout-compare {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
    width: 100%;
}

.compare-reference {
    flex: 0 0 26%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.compare-canvas {
    min-height: 12rem;
    display: flex;
    flex-direction: column;
}

.compare-alternatives {
    flex: 1 1 0;
    min-width: 0;
    min-height: 32rem;
    display: flex;
    flex-direction: column;
}

.compare-adopted {
    color: var(--p-primary);
    font-size: 0.8rem;
    margin: 0 0 0.4rem 0;
    text-align: center;
}

@media (max-width: 1100px) {
    .layout-compare {
        flex-direction: column;
    }
    .compare-reference,
    .compare-alternatives {
        flex: 1 1 auto;
    }
}
</style>
