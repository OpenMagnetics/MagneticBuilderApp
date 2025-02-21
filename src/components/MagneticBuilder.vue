<script setup>
import { useHistoryStore } from '../stores/history'
import BasicCoreBuilder from './MagneticBuilder/BasicCoreBuilder.vue'
import BasicWireBuilder from './MagneticBuilder/BasicWireBuilder.vue'
import BasicCoilBuilder from './MagneticBuilder/BasicCoilBuilder.vue'
import GraphInfo from './MagneticBuilder/GraphInfo.vue'
import { isMobile } from '/WebSharedComponents/assets/js/utils.js'
import { useMagneticBuilderSettingsStore } from '../stores/magneticBuilderSettings'

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
        enableGraphs: {
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
        const historyStore = useHistoryStore();
        const magneticBuilderSettingsStore = useMagneticBuilderSettingsStore();
        const magneticBuilt = false;

        return {
            magneticBuilderSettingsStore,
            magneticBuilt,
            historyStore,
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
        enableSubmenu() {
            if (this.isIsolatedApp) {
                return true;
            }
            else {
                return this.magneticBuilderSettingsStore.enableSubmenu;
            }
            
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
        this.historyStore.addToHistory(this.masStore.mas);
        this.historyStore.blockAdditions();
        this.historyStore.$onAction((action) => {
            if (action.name == "addToHistory") {
                this.magneticBuilt = this.isMagneticBuilt();
                this.$emit("canContinue", this.magneticBuilt);
                if (this.magneticBuilt && !this.isIsolatedApp) {
                    this.insertIntermediateMas();
                }
            }
        })

    },
    methods: {
        insertIntermediateMas() {
            const url = import.meta.env.VITE_API_ENDPOINT + '/insert_intermediate_mas'

            this.$axios.post(url, this.masStore.mas)
            .then(response => {
            })
            .catch(error => {
                console.error("Error inserting")
                console.error(error)
            });
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
    }
}
</script>

<template>
    <div class="container" :style="$styleStore.magneticBuilder.main">
        <div class="row">
            <div :class="isMobile()? 'col-12' : enableCoil? 'col-4' : 'offset-1 col-4'">
                <BasicCoreBuilder 
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :useVisualizers="useVisualizers && enableVisualizers"
                    :enableSimulation="enableSimulationComputed"
                    :enableSubmenu="enableSubmenu"
                    :enableAdvise="enableAdvisers && !isIsolatedApp"
                    :operatingPointIndex="operatingPointIndex"
                />
            </div>
            <div :class="isMobile()? 'col-12' : enableCoil? 'col-4' : 'offset-1 col-4'">
                <BasicWireBuilder 
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :useVisualizers="useVisualizers && enableVisualizers"
                    :enableSimulation="enableSimulationComputed"
                    :enableSubmenu="enableSubmenu"
                    :enableAdvise="enableAdvisers && !isIsolatedApp"
                    :isIsolatedApp="isIsolatedApp"
                    :operatingPointIndex="operatingPointIndex"
                />
            </div>
            <div v-if="enableCoil" :class="isMobile()? 'col-12' : 'col-4'">
                <BasicCoilBuilder 
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :useVisualizers="useVisualizers && enableVisualizers"
                    :enableSimulation="enableSimulationComputed"
                    :enableOptions="enableCoilOptions"
                    :enableSubmenu="enableSubmenu"
                    :enableAdvise="enableAdvisers && !isIsolatedApp"
                    :operatingPointIndex="operatingPointIndex"
                />
            </div> 
            <div v-else class="col-2"/>
        </div>
        <div v-if="enableGraphs && magneticBuilderSettingsStore.enableGraphs" class="row w-100">
            <h5 v-if="!magneticBuilt" class="text-danger my-2">Select the magnetic first</h5>
            <GraphInfo 
                v-else
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
            />
        </div>
    </div>
</template>
