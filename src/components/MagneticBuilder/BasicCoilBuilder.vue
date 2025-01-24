<script setup>
import Magnetic2DVisualizer from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import BasicCoilSelector from './BasicCoilSelector.vue'
</script>

<script>
export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        loadingGif: {
            type: String,
            default: "/images/loading.gif",
        },
        masStore: {
            type: Object,
            required: true,
        },
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        simulationEnabled: {
            type: Boolean,
            default: true,
        },
        submenuEnabled: {
            type: Boolean,
            default: true,
        },
        adviseEnabled: {
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
        return {
            coilFits,
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
    },
    mounted () {
    },
    methods: {
        swapFieldPlot(newValue) {
            this.$userStore.magnetic2DVisualizerState.plotMagneticField = newValue == '1';
        },
        swapIncludeFringing(newValue) {
            this.$userStore.magnetic2DVisualizerState.plotFringingField = newValue == '1';
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
        <div v-if="useVisualizers" class="row mb-3" style="height: 50vh">
            <Magnetic2DVisualizer 
                :modelValue="masStore.mas"
                :operatingPointIndex="operatingPointIndex"
                :enableZoom="false"
                :enableOptions="simulationEnabled"
                :enableHideOnFitting="simulationEnabled"
                :coilFits="coilFits"
                :showFieldPlotInit="$userStore.magnetic2DVisualizerState.plotMagneticField"
                :includeFringingInit="$userStore.magnetic2DVisualizerState.plotFringingField"
                :backgroundColor="$settingsStore.labelBgColor"
                @swapFieldPlot="swapFieldPlot"
                @swapIncludeFringing="swapIncludeFringing"
                />
        </div>
        <h4 v-else class="mb-5" > {{"Coil Description"}} </h4>

        <div class="row mb-2" v-show="masStore.mas.magnetic.coil.sectionsDescription != null">
            <BasicCoilSelector
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :simulationEnabled="simulationEnabled"
                :submenuEnabled="submenuEnabled"
                :adviseEnabled="adviseEnabled"
                @fits="fits"
            />
        </div>
    </div>
</template>
