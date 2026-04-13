<script setup>
import Magnetic2DVisualizer from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import BasicCoilSelector from './BasicCoilSelector.vue'
import PlanarCoilSelector from './PlanarCoilSelector.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
</script>

<script>
export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
            required: true,
        },
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
        enableAutoSimulation: {
            type: Boolean,
            default: true,
        },
        enableSubmenu: {
            type: Boolean,
            default: true,
        },
        enableOptions: {
            type: Boolean,
            default: true,
        },
        enableAdvise: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const coilFits = true;
        const imageUpToDate = false;
        const coilHash = "";
        const inputsHash = "";
        const retries = 0;
        const forceUpdate = 0;
        const subscriptions = [];

        return {
            taskQueueStore,
            coilFits,
            imageUpToDate,
            coilHash,
            retries,
            inputsHash,
            forceUpdate,
            subscriptions,
            _retryTimer: null,
        }
    },
    computed: {
        missingWires() {
            let isMissingWires = false;
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((winding, index) => {
                if (winding.wire == "Dummy" || winding.wire == "" || winding.wire == null) {
                    isMissingWires = true;
                }
                else {
                    if (winding.wire.type == null) {
                        isMissingWires = true;
                    }
                }
            })
            return isMissingWires;
        }
    },
    watch: {
    },
    mounted () {
        // Reset hashes on mount to force fresh plot when returning to builder
        this.coilHash = "";
        this.inputsHash = "";
        this.imageUpToDate = false;

        this.subscriptions.push(this.$stateStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "redraw") {
                    if (!this.taskQueueStore.windingIndexChangeBlock) {
                        this.retries = 1;
                        this.imageUpToDate = false;
                        this.tryPlot(false);
                    }
                }
            });
        }))

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            // Mark image as outdated immediately when wire creation or winding starts
            if (name == "createNewWire") {
                if (!this.taskQueueStore.windingIndexChangeBlock) {
                    this.imageUpToDate = false;
                }
            }
            after(() => {
                if (name == "wind" || name == "windPlanar") {
                    if (!this.taskQueueStore.windingIndexChangeBlock) {
                        this.imageUpToDate = false;
                    }
                }
                if (name == "wound" || name == "planarWound" || name == "coreShapeProcessed" || name == "coreMaterialProcessed" || name == "coreProcessed") {
                    if (args[0]) {
                        // If coreMaterialProcessed, update MAS with full material object
                        if (name == "coreMaterialProcessed" && args[1]) {
                            const coreMaterial = args[1];
                            if (this.masStore?.mas?.magnetic?.core?.functionalDescription) {
                                this.masStore.mas.magnetic.core.functionalDescription.material = coreMaterial;
                            }
                        }
                        // Skip plot on coreProcessed if bobbin regen is pending —
                        // wound action will trigger the final plot after winding completes.
                        const skipPlot = name == "coreProcessed" && this.taskQueueStore.bobbinRegenerationPending;
                        if (!skipPlot && this.$settingsStore.magneticBuilderSettings.autoRedraw && !this.taskQueueStore.windingIndexChangeBlock) {
                            this.imageUpToDate = false;
                            this.tryPlot(false);
                        }
                        else {
                            this.imageUpToDate = false;
                        }
                    }
                    else {
                        console.error(args[1])
                    }
                }

                if (name == "newWireCreated") {
                    if (this.$settingsStore.magneticBuilderSettings.autoRedraw && !this.taskQueueStore.windingIndexChangeBlock) {
                        this.imageUpToDate = false;
                        this.tryPlot(false);
                    }
                }
                // When builder is ready with an existing design, refresh the visualizer
                if (name == "magneticBuilderReady") {
                    if (this.masStore.mas.magnetic?.coil?.turnsDescription != null) {
                        this.imageUpToDate = false;
                        this.tryPlot(true);
                    }
                }
            });
        }))
    },
    beforeUnmount () {
        if (this._retryTimer) clearTimeout(this._retryTimer);
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        tryPlot(force) {
            const newCoilHash = JSON.stringify(this.masStore.mas.magnetic.coil);
            let newInputsHash = "";
            if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                newInputsHash = JSON.stringify(this.masStore.mas.inputs.operatingPoints[0].excitationsPerWinding[0].voltage) + JSON.stringify(this.masStore.mas.inputs.operatingPoints[0].excitationsPerWinding[0].current);
            }
            if (force || !this.imageUpToDate || newCoilHash != this.coilHash || newInputsHash != this.inputsHash) {
                this.coilHash = newCoilHash;
                this.inputsHash = newInputsHash;
                this.forceUpdate += 1;
                this.imageUpToDate = true;
            }
        },
        plotModeChange(newMode) {
            this.$stateStore.magnetic2DVisualizerState.plotMode = newMode;
        },
        swapIncludeFringing(newValue) {
            this.$stateStore.magnetic2DVisualizerState.includeFringing = newValue == '1';
        },
        fits(coilFits) {
            this.coilFits = coilFits;
        },
        errorInImage() {
            this.imageUpToDate = false;

            if (this.retries > 0) {
                if (this._retryTimer) clearTimeout(this._retryTimer);
                this._retryTimer = setTimeout(() => {
                    this._retryTimer = null;
                    this.imageUpToDate = false;
                    this.tryPlot(true);
                    this.retries -= 1;
                }, 1000);
            }
        },
        showParasiticsView() {
            this.$stateStore.magneticBuilder.mode.coil = this.$stateStore.MagneticBuilderModes.Advanced;
        },
        toggleTemperaturePlot() {
            // Toggle between basic and temperature field plot modes
            const currentMode = this.$stateStore.magnetic2DVisualizerState.plotMode;
            if (currentMode === 'temperature_field') {
                this.$stateStore.magnetic2DVisualizerState.plotMode = 'basic';
            } else {
                this.$stateStore.magnetic2DVisualizerState.plotMode = 'temperature_field';
            }
            // Force redraw by updating forceUpdate
            this.forceUpdate += 1;
        },
    }
}
</script>

<template>
    <h5 v-if="masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''" class="text-danger my-2">Select a core first</h5>
    <h5 v-if="missingWires" class="text-danger my-2">Select wires</h5>
    <div v-if="!missingWires && masStore.mas.magnetic.core != null && masStore.mas.magnetic.core.functionalDescription.shape != ''" class="container">
        <div class="card border-0 shadow-lg" :style="{ background: $styleStore.magneticBuilder.main['background-color'] || $styleStore.magneticBuilder.main['background'] || '#1a1a1a' }">
            <div class="card-header border-bottom px-3 py-2" :style="{ borderColor: $styleStore.magneticBuilder.main['border-color'] || 'var(--bs-border-color)' }">
                <div class="d-flex align-items-center">
                    <i class="fa-solid fa-circle-notch text-primary me-2"></i>
                    <h6 class="card-title mb-0" :style="{ color: $styleStore.magneticBuilder.main['color'] }">Coil Configuration</h6>
                </div>
            </div>
            <div class="card-body px-3 py-2">
                <div
                    v-if="useVisualizers && masStore.mas.magnetic != null && masStore.mas.magnetic.core != null && masStore.mas.magnetic.core.functionalDescription.shape != ''"
                    class="row mb-3"
                    :style="(imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;') + ((masStore.mas.inputs.designRequirements.wiringTechnology == null || masStore.mas.inputs.designRequirements.wiringTechnology == 'Wound')? ' max-height: 50vh;' : ' max-height: 40vh;')"
                >
                    <Magnetic2DVisualizer 
                        :modelValue="masStore.mas"
                        :forceUpdate="forceUpdate"
                        :operatingPointIndex="operatingPointIndex"
                        :enableZoom="false"
                        :enableOptions="false"
                        :enableHideOnFitting="enableSimulation"
                        :coilFits="true"
                        :plotModeInit="$stateStore.magnetic2DVisualizerState.plotMode"
                        :includeFringingInit="$stateStore.magnetic2DVisualizerState.includeFringing"
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color'] || $styleStore.magneticBuilder.main['background'] || '#1a1a1a'"
                        :textColor="$styleStore.magneticBuilder.inputTextColor?.color || '#ffffff'"
                        :buttonStyle="$styleStore.magneticBuilder.coilVisualizerButton"
                        @plotModeChange="plotModeChange"
                        @swapIncludeFringing="swapIncludeFringing"
                        @errorInImage="errorInImage"
                        :loadingGif="$settingsStore.loadingGif"
                        />
                </div>

                <button
                    v-if="enableSimulation && useVisualizers"
                    :style="$styleStore.magneticBuilder.showAlignmentOptionsButton"
                    :disabled="masStore.mas.magnetic == null || masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''"
                    :data-cy="dataTestLabel + '-Coil-ShowParasiticsView-button'"
                    class="btn mx-auto d-block mb-3 mt-0"
                    @click="showParasiticsView"
                >
                    {{'Open Advanced Parasitics Section'}}
                </button>

                <button
                    v-if="enableSimulation && useVisualizers"
                    :style="$styleStore.magneticBuilder.showAlignmentOptionsButton"
                    :disabled="masStore.mas.magnetic == null || masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''"
                    :data-cy="dataTestLabel + '-Coil-ToggleTemperaturePlot-button'"
                    class="btn mx-auto d-block mb-3 mt-0"
                    :class="$stateStore.magnetic2DVisualizerState.plotMode === 'temperature_field' ? 'btn-success' : 'btn-primary'"
                    @click="toggleTemperaturePlot"
                >
                    {{ $stateStore.magnetic2DVisualizerState.plotMode === 'temperature_field' ? 'Hide Temperature Plot' : 'Show Temperature Plot' }}
                </button>

                <div class="row">
                    <BasicCoilSelector
                        v-if="(masStore.mas.inputs.designRequirements.wiringTechnology == null || masStore.mas.inputs.designRequirements.wiringTechnology == 'Wound')"
                        :masStore="masStore"
                        :readOnly="readOnly"
                        :operatingPointIndex="operatingPointIndex"
                        :enableSimulation="enableSimulation"
                        :enableAutoSimulation="enableAutoSimulation"
                        :enableSubmenu="enableSubmenu"
                        @fits="fits"
                    />
                    <PlanarCoilSelector
                        v-else
                        :masStore="masStore"
                        :readOnly="readOnly"
                        :operatingPointIndex="operatingPointIndex"
                        :enableSimulation="enableSimulation"
                        :enableAutoSimulation="enableAutoSimulation"
                        :enableSubmenu="enableSubmenu"
                        @fits="fits"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
