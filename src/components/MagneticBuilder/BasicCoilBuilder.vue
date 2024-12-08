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
        isIsolatedApp: {
            type: Boolean,
            default: false,
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
            this.$userStore.magnetic2DVisualizerPlotMagneticField = newValue;
        },
        swapIncludeFringing(newValue) {
            this.$userStore.magnetic2DVisualizerPlotFringingField = newValue;
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
                :enableZoom="false"
                :enableOptions="true"
                :enableHideOnFitting="true"
                :coilFits="coilFits"
                :showFieldPlotInit="Boolean($userStore.magnetic2DVisualizerPlotMagneticField)"
                :includeFringingInit="Boolean($userStore.magnetic2DVisualizerPlotFringingField)"
                @swapFieldPlot="swapFieldPlot"
                @swapIncludeFringing="swapIncludeFringing"
                />
        </div>
        <h4 v-else class="mb-5" > {{"Coil Description"}} </h4>

        <div class="row mb-2" v-show="masStore.mas.magnetic.coil.sectionsDescription != null">
            <BasicCoilSelector
                :masStore="masStore"
                :isIsolatedApp="isIsolatedApp"
                @fits="fits"
            />
        </div>
    </div>
</template>
