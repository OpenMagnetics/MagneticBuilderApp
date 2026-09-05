<script setup>
import { useHistoryStore } from '../stores/history'
import { useTaskQueueStore } from '../stores/taskQueue'
import CoreBuilder from './MagneticBuilder/Core/CoreBuilder.vue'
import BasicWireBuilder from './MagneticBuilder/Wire/BasicWireBuilder.vue'
import BasicCoilBuilder from './MagneticBuilder/Coil/BasicCoilBuilder.vue'
import AdvancedCoreSelector from './MagneticBuilder/Core/AdvancedCoreSelector.vue'
import AdvancedCoilInfo from './MagneticBuilder/Coil/AdvancedCoilInfo.vue'
import GraphInfo from './MagneticBuilder/GraphInfo.vue'
import { isMobile } from '/WebSharedComponents/assets/js/utils.js'
import { recordDesign } from '/WebSharedComponents/assets/js/telemetry.js'
import { useMagneticBuilderSettingsStore } from '../stores/magneticBuilderSettings'

</script>

<script>
export default {
    emits: ["canContinue"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
        },
        isIsolatedApp: {
            type: Boolean,
            default: false,
        },
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        enableCoil: {
            type: Boolean,
            default: true,
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
        enableAdvisers: {
            type: Boolean,
            default: true,
        },
        enableCoilOptions: {
            type: Boolean,
            default: true,
        },
        enableInsertIntermediateMas: {
            type: Boolean,
            default: true,
        },
        enableGraphs: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        showInterleavingOrder: {
            type: Boolean,
            default: true,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
        enableTemperaturePlot: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        // Settle recorder (ABT #1084): quiet time before a burst of design
        // changes counts as settled.
        const SETTLE_MS = 1500;
        const taskQueueStore = useTaskQueueStore();
        const magneticBuilderSettingsStore = useMagneticBuilderSettingsStore();
        const magneticBuilt = false;
        const subscriptions = [];
        this.$settingsStore.magneticBuilderSettings.autoRedraw = true;

        return {
            SETTLE_MS,
            settleTimer: null,
            burstStartedAt: null,
            stopSettleWatch: null,
            magneticBuilderSettingsStore,
            taskQueueStore,
            magneticBuilt,
            historyStore,
            subscriptions,
        }
    },
    computed: {
        enableVisualizers() {
            if (this.isIsolatedApp) {
                return true;
            }
            else {
                return this.magneticBuilderSettingsStore.enableVisualizers;
            }
        },
        enableSimulationComputed() {
            if (this.isIsolatedApp) {
                return false;
            }
            else {
                return this.enableSimulation && this.magneticBuilderSettingsStore.enableSimulation;
            }
            
        },
        enableAutoSimulationComputed() {
            if (this.isIsolatedApp) {
                return true; // Isolated app always auto-simulates
            }
            else {
                return this.magneticBuilderSettingsStore.enableAutoSimulation;
            }
        },
        enableSubmenu() {
            // if (this.isIsolatedApp) {
            //     return false;
            // }
            // else {
                return this.magneticBuilderSettingsStore.enableSubmenu;
            // }
            
        },
    },
    watch: { 
    },
    mounted () {
        if (this.masStore.mas.magnetic.manufacturerInfo == null) {
            this.masStore.mas.magnetic.manufacturerInfo = {};
            this.masStore.mas.magnetic.manufacturerInfo.name = "OpenMagnetics";
            this.masStore.mas.magnetic.manufacturerInfo.reference = "My custom magnetic";
        }

        this.magneticBuilt = this.isMagneticBuilt();
        // Block history during initial mount — intermediate states (processCore,
        // bobbin regen, winding) won't create entries. The settle recorder below
        // (or the first wind() completion) lifts the block and saves the
        // fully-built state as the first history entry.
        this.historyStore.blockAdditions();
        this.subscriptions.push(this.historyStore.$onAction((action) => {
            if (action.name == "addToHistory") {
                this.magneticBuilt = this.isMagneticBuilt();
                this.$emit("canContinue", this.magneticBuilt);
            }
        }));

        // ABT #1084 — settle recorder. Edits used to reach the history only
        // through a wind() completion, so a design without a wound coil (core
        // shape / material / gap / stacks edits before a wire exists) was never
        // recorded and Undo stayed dark. Now every burst of changes to the
        // design is recorded once it has been quiet for SETTLE_MS: the entry
        // holds the SETTLED state (after autocomplete, bobbin, wind), and
        // replaces an entry the SAME burst already made (e.g. wind's own add)
        // so one gesture stays one undo step, and never touches an entry from
        // an earlier burst. Timed blocks (after undo/redo) are respected —
        // lifting them would truncate the redo stack.
        this.settleTimer = null;
        this.stopSettleWatch = this.$watch(
            () => this.masStore.mas,
            () => {
                if (this.settleTimer) {
                    clearTimeout(this.settleTimer);
                }
                else {
                    this.burstStartedAt = Date.now();
                }
                this.settleTimer = setTimeout(() => {
                    this.settleTimer = null;
                    if (this.historyStore.isBlockedTimed()) return;
                    if (this.historyStore.isBlockedIndefinitely()) {
                        this.historyStore.unblockAdditions();
                    }
                    this.historyStore.addToHistory(this.masStore.mas, null, { coalesceIfAddedAfter: this.burstStartedAt });
                }, this.SETTLE_MS);
            },
            { deep: true }
        );

        // Notify components that builder is ready with existing design
        // This triggers visualizers and simulations to refresh
        if (this.magneticBuilt) {
            setTimeout(() => {
                this.taskQueueStore.magneticBuilderReady(this.masStore.mas.magnetic);
            }, 100);
        }

    },
    beforeUnmount() {
        if (this.settleTimer) clearTimeout(this.settleTimer);
        if (this.stopSettleWatch) this.stopSettleWatch();
        // Capture the builder state once, as the user leaves the builder, rather
        // than on every edit. Tied to the session_id, this gives one clean
        // "final builder state" row that pairs with the later design_report.
        if (this.magneticBuilt && !this.isIsolatedApp && this.enableInsertIntermediateMas) {
            this.insertIntermediateMas();
        }
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    },
    methods: {
        insertIntermediateMas() {
            // Intermediate working state — the builder design as the user leaves it.
            recordDesign({ event_type: 'builder_snapshot', source: 'builder', mas: this.masStore.mas });
        },
        isMagneticBuilt() {
            if (this.masStore.mas.magnetic.core.functionalDescription.material == null) {
                return false;
            }
            if (this.masStore.mas.magnetic.core.functionalDescription.shape == null) {
                return false;
            }
            if (this.masStore.mas.magnetic.core.functionalDescription.gapping == null) {
                return false;
            }
            if (this.masStore.mas.magnetic.coil.functionalDescription.length == 0) {
                return false;
            }
            if (this.masStore.mas.magnetic.coil.bobbin == null) {
                return false;
            }
            if (this.masStore.mas.magnetic.coil.bobbin == "") {
                return false;
            }
            if (this.masStore.mas.magnetic.coil.bobbin == "Dummy") {
                return false;
            }
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((winding) => {
                if (winding.wire == null) {
                    return false;
                }
                if (winding.wire == "") {
                    return false;
                }
                if (winding.wire == "Dummy") {
                    return false;
                }
            })
            if (this.masStore.mas.magnetic.coil.turnsDescription == null) {
                return false;
            }
            return true;
        },
        customizeCore() {
            this.$stateStore.magneticBuilder.mode.core = this.$stateStore.MagneticBuilderModes.Advanced;
        }
    }
}
</script>

<template>
    <div class="container" :style="$styleStore.magneticBuilder.main">
        <div
            class="row"
            v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced"
        >
            <AdvancedCoreSelector
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelector'"
                :masStore="masStore"
                :enableSimulation="true"
            />
        </div>
        <div
            class="row gx-0"
            v-else-if="$stateStore.magneticBuilder.mode.coil == $stateStore.MagneticBuilderModes.Advanced"
        >
            <AdvancedCoilInfo
                :dataTestLabel="dataTestLabel + '-AdvancedCoilInfo'"
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
            />
        </div>
        <div 
            v-else
            class="row gx-0"
        >
            <div :class="isMobile($windowWidth)? 'col-12' : enableCoil? 'col-4' : 'col-offset-1 col-4'">
                <CoreBuilder 
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :useVisualizers="useVisualizers && enableVisualizers"
                    :enableSimulation="enableSimulationComputed"
                    :enableAutoSimulation="enableAutoSimulationComputed"
                    :enableSubmenu="enableSubmenu"
                    :enableCustomize="magneticBuilderSettingsStore.enableCustomize"
                    :enableAdvise="enableAdvisers && !isIsolatedApp"
                    :operatingPointIndex="operatingPointIndex"
                    @customizeCore="customizeCore"
                />
            </div>
            <div :class="isMobile($windowWidth)? 'col-12' : enableCoil? 'col-4' : 'col-offset-1 col-4'">
                <BasicWireBuilder 
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :useVisualizers="useVisualizers && enableVisualizers"
                    :enableSimulation="enableSimulationComputed"
                    :enableAutoSimulation="enableAutoSimulationComputed"
                    :enableSubmenu="enableSubmenu"
                    :enableAdvise="enableAdvisers && !isIsolatedApp"
                    :isIsolatedApp="isIsolatedApp"
                    :operatingPointIndex="operatingPointIndex"
                />
            </div>
            <div v-if="enableCoil" :class="isMobile($windowWidth)? 'col-12' : 'col-4'">
                <BasicCoilBuilder 
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :useVisualizers="useVisualizers && enableVisualizers"
                    :enableSimulation="enableSimulationComputed"
                    :enableAutoSimulation="enableAutoSimulationComputed"
                    :enableOptions="enableCoilOptions"
                    :enableSubmenu="enableSubmenu"
                    :enableAdvise="enableAdvisers && !isIsolatedApp"
                    :operatingPointIndex="operatingPointIndex"
                    :showInterleavingOrder="showInterleavingOrder"
                    :enableTemperaturePlot="enableTemperaturePlot"
                />
            </div> 
            <div v-else class="col-2"/>
        </div>
        <div
            v-if="enableGraphs && magneticBuilderSettingsStore.enableGraphs && $stateStore.magneticBuilder.mode.core != $stateStore.MagneticBuilderModes.Advanced"
            class="row w-100"
        >
            <h5 v-if="!magneticBuilt" class="text-danger my-2">Select the magnetic first</h5>
            <GraphInfo 
                v-else
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
            />
        </div>
    </div>
</template>
