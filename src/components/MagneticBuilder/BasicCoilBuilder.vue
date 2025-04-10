<script setup>
import Magnetic2DVisualizer from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import BasicCoilSelector from './BasicCoilSelector.vue'
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
        return {
            coilFits,
            mas,
            imageUpToDate,
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
                console.log("mas updated");
                console.log(this.$settingsStore.magneticBuilderSettings.autoRedraw);

                if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
                    this.mas = deepCopy(this.masStore.mas);
                    this.imageUpToDate = true;
                }
                else {
                    this.imageUpToDate = false;
                }
            },
          deep: true
        }
    },
    mounted () {
        this.$stateStore.$onAction((action) => {
            if (action.name == "redraw") {
                console.log("redraw");
                this.mas = deepCopy(this.masStore.mas);
                this.imageUpToDate = true;
            }
        })
    },
    methods: {
        swapFieldPlot(newValue) {
            this.$stateStore.magnetic2DVisualizerState.plotMagneticField = newValue == '1';
        },
        swapIncludeFringing(newValue) {
            this.$stateStore.magnetic2DVisualizerState.plotFringingField = newValue == '1';
        },
        fits(coilFits) {
            this.coilFits = coilFits;
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
            class="row mb-3"
            style="height: 50vh;"
            :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <Magnetic2DVisualizer 
                :modelValue="mas"
                :operatingPointIndex="operatingPointIndex"
                :enableZoom="false"
                :enableOptions="enableOptions"
                :enableHideOnFitting="enableSimulation"
                :coilFits="coilFits"
                :showFieldPlotInit="$stateStore.magnetic2DVisualizerState.plotMagneticField"
                :includeFringingInit="$stateStore.magnetic2DVisualizerState.plotFringingField"
                :backgroundColor="$styleStore.magneticBuilder.main.background"
                :buttonStyle="$styleStore.magneticBuilder.coilVisualizerButton"
                @swapFieldPlot="swapFieldPlot"
                @swapIncludeFringing="swapIncludeFringing"
                :loadingGif="$settingsStore.loadingGif"
                />
        </div>
        <h4 v-else class="mb-5" > {{"Coil Description"}} </h4>

        <div class="row mb-2">
            <BasicCoilSelector
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableSubmenu="enableSubmenu"
                :enableAdvise="enableAdvise"
                @fits="fits"
            />
        </div>
    </div>
</template>
