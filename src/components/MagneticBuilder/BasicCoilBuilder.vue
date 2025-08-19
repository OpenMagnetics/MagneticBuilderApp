<script setup>
import Magnetic2DVisualizer from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import BasicCoilSelector from './BasicCoilSelector.vue'
import PlanarCoilSelector from './PlanarCoilSelector.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
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
        const coilFits = true;
        const mas = {};
        const imageUpToDate = false;
        const coilHash = "";
        const inputsHash = "";
        const retries = 0;

        return {
            coilFits,
            mas,
            imageUpToDate,
            coilHash,
            retries,
            inputsHash,
        }
    },
    computed: {
        missingWires() {
            var isMissingWires = false;
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
        'masStore.mas': {
            handler(newValue, oldValue) {
                const newCoilHash = JSON.stringify(newValue.magnetic.coil);
                var newInputsHash = "";
                if (newValue.inputs.operatingPoints.length > 0) {
                    newInputsHash = JSON.stringify(newValue.inputs.operatingPoints[0].excitationsPerWinding[0].voltage) + JSON.stringify(newValue.inputs.operatingPoints[0].excitationsPerWinding[0].current);
                }
                if (newCoilHash != this.coilHash || newInputsHash != this.inputsHash) {
                    this.coilHash = newCoilHash;
                    this.inputsHash = newInputsHash;
                    if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
                        this.mas = deepCopy(this.masStore.mas);
                        this.imageUpToDate = true;
                    }
                    else {
                        this.imageUpToDate = false;
                    }
                }
            },
          deep: true
        }
    },
    mounted () {
        this.masStore.$onAction((action) => {
            if (action.name == "updatedTurnsRatios") {
                this.retries = 1;
                this.imageUpToDate = false;
                this.tryPlot(false);
            }
        })

        this.$stateStore.$onAction((action) => {
            if (action.name == "redraw") {
                this.retries = 1;
                this.imageUpToDate = false;
                this.tryPlot(false);
            }
        })
    },
    methods: {
        tryPlot(force) {
            const newCoilHash = JSON.stringify(this.masStore.mas.magnetic.coil);
            var newInputsHash = "";
            if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                newInputsHash = JSON.stringify(this.masStore.mas.inputs.operatingPoints[0].excitationsPerWinding[0].voltage) + JSON.stringify(this.masStore.mas.inputs.operatingPoints[0].excitationsPerWinding[0].current);
            }
            if (force || !this.imageUpToDate || newCoilHash != this.coilHash || newInputsHash != this.inputsHash) {
                this.coilHash = newCoilHash;
                this.inputsHash = newInputsHash;
                this.mas = null;
                this.mas = deepCopy(this.masStore.mas);
                this.imageUpToDate = true;
            }
        },
        swapFieldPlot(newValue) {
            this.$stateStore.magnetic2DVisualizerState.plotMagneticField = newValue == '1';
        },
        swapIncludeFringing(newValue) {
            this.$stateStore.magnetic2DVisualizerState.plotFringingField = newValue == '1';
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
    }
}
</script>

<template>
    <h5 v-if="masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''" class="text-danger my-2">Select a core first</h5>
    <h5 v-if="missingWires" class="text-danger my-2">Select wires</h5>
    <div v-if="!missingWires && masStore.mas.magnetic.core != null && masStore.mas.magnetic.core.functionalDescription.shape != ''" class="container">
        <div
            v-if="useVisualizers && mas.magnetic != null && mas.magnetic.core != null && mas.magnetic.core.functionalDescription.shape != ''"
            class="row"
            :class="enableOptions? 'mb-3' : ''"
            :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;' + ((masStore.mas.inputs.designRequirements.wiringTechnology == null || masStore.mas.inputs.designRequirements.wiringTechnology == 'Wound')? 'height: 50vh;' : 'height: 40vh;')"
        >
            <Magnetic2DVisualizer 
                :modelValue="mas"
                :operatingPointIndex="operatingPointIndex"
                :enableZoom="false"
                :enableOptions="enableOptions"
                :enableHideOnFitting="enableSimulation"
                :coilFits="true"
                :showFieldPlotInit="$stateStore.magnetic2DVisualizerState.plotMagneticField"
                :includeFringingInit="$stateStore.magnetic2DVisualizerState.plotFringingField"
                :backgroundColor="$styleStore.magneticBuilder.main.background"
                :buttonStyle="$styleStore.magneticBuilder.coilVisualizerButton"
                @swapFieldPlot="swapFieldPlot"
                @swapIncludeFringing="swapIncludeFringing"
                @errorInImage="errorInImage"
                :loadingGif="$settingsStore.loadingGif"
                />
        </div>
        <h4 v-else class="mb-5" > {{"Coil Description"}} </h4>

        <div class="row mb-2">
            <BasicCoilSelector
                v-if="(masStore.mas.inputs.designRequirements.wiringTechnology == null || masStore.mas.inputs.designRequirements.wiringTechnology == 'Wound')"
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableSubmenu="enableSubmenu"
                @fits="fits"
            />
            <PlanarCoilSelector
                v-else
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableSubmenu="enableSubmenu"
                @fits="fits"
            />
        </div>
    </div>
</template>
