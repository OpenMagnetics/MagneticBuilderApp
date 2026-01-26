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
        this.subscriptions.push(this.$stateStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "redraw") {
                    this.retries = 1;
                    this.imageUpToDate = false;
                    this.tryPlot(false);
                }
            });
        }))

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            // Mark image as outdated immediately when wire creation or winding starts
            if (name == "createNewWire") {
                this.imageUpToDate = false;
            }
            after(() => {
                if (name == "wind" || name == "windPlanar") {
                    this.imageUpToDate = false;
                }
                if (name == "wound" || name == "planarWound" || name == "coreShapeProcessed" || name == "coreMaterialProcessed") {
                    if (args[0]) {
                        if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
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
                    if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
                        this.imageUpToDate = false;
                        this.tryPlot(false);
                    }
                }
            });
        }))
    },
    beforeUnmount () {
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
                setTimeout(() => {
                    this.imageUpToDate = false;
                    this.tryPlot(true);
                    this.retries -= 1;
                }, 1000);
            }
        },
        showParasiticsView() {
            this.$stateStore.magneticBuilder.mode.coil = this.$stateStore.MagneticBuilderModes.Advanced;
        },
    }
}
</script>

<template>
    <h5 v-if="masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''" class="text-danger my-2">Select a core first</h5>
    <h5 v-if="missingWires" class="text-danger my-2">Select wires</h5>
    <div v-if="!missingWires && masStore.mas.magnetic.core != null && masStore.mas.magnetic.core.functionalDescription.shape != ''" class="container">
        <div class="card bg-dark border-0 shadow-lg">
            <div class="card-header border-bottom border-secondary px-3 py-2">
                <div class="d-flex align-items-center">
                    <i class="fa-solid fa-circle-notch text-primary me-2"></i>
                    <h6 class="card-title mb-0 text-white">Coil Configuration</h6>
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
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color']"
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
