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
        mkf: {
            type: Object,
            required: true,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        const magneticBuilderSettingsStore = useMagneticBuilderSettingsStore();

        return {
            magneticBuilderSettingsStore,
            historyStore,
        }
    },
    computed: {
    },
    watch: { 
    },
    mounted () {
        if (this.masStore.mas.magnetic.manufacturerInfo == null) {
            this.masStore.mas.magnetic.manufacturerInfo = {};
            this.masStore.mas.magnetic.manufacturerInfo.name = "OpenMagnetics";
            this.masStore.mas.magnetic.manufacturerInfo.reference = "My custom magnetic";
        }

        this.historyStore.addToHistory(this.masStore.mas);
        this.historyStore.blockAdditions();
        this.historyStore.$onAction((action) => {
            if (action.name == "addToHistory") {
                this.$emit("canContinue", this.isMagneticBuilt());
                if (this.isMagneticBuilt() && !this.isIsolatedApp) {
                    this.insertIntermediateMas();
                }
            }
        })

    },
    methods: {
        insertIntermediateMas() {
            const url = import.meta.env.VITE_API_ENDPOINT + '/insert_intermediate_mas'

            console.log("Inserting Mas")
            this.$axios.post(url, this.masStore.mas)
            .then(response => {
                console.log("response.data")
                console.log(response.data)
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
    <div class="container">
        <div class="row">
            <div :class="isMobile()? 'col-12' : enableCoil? 'col-4' : 'col-6'">
                <BasicCoreBuilder 
                    :masStore="masStore"
                    :useVisualizers="useVisualizers && magneticBuilderSettingsStore.visualizersEnabled"
                    :simulationEnabled="magneticBuilderSettingsStore.simulationEnabled"
                    :submenuEnabled="magneticBuilderSettingsStore.submenuEnabled"
                    :adviseEnabled="isIsolatedApp"
                    :mkf="mkf"
                />
            </div>
            <div :class="isMobile()? 'col-12' : enableCoil? 'col-4' : 'col-6'">
                <BasicWireBuilder 
                    :masStore="masStore"
                    :useVisualizers="useVisualizers && magneticBuilderSettingsStore.visualizersEnabled"
                    :simulationEnabled="magneticBuilderSettingsStore.simulationEnabled"
                    :submenuEnabled="magneticBuilderSettingsStore.submenuEnabled"
                    :adviseEnabled="isIsolatedApp"
                    :isIsolatedApp="isIsolatedApp"
                    :mkf="mkf"
                />
            </div>
            <div v-if="enableCoil" :class="isMobile()? 'col-12' : 'col-4'">
                <BasicCoilBuilder 
                    :masStore="masStore"
                    :useVisualizers="useVisualizers && magneticBuilderSettingsStore.visualizersEnabled"
                    :simulationEnabled="magneticBuilderSettingsStore.simulationEnabled"
                    :submenuEnabled="magneticBuilderSettingsStore.submenuEnabled"
                    :adviseEnabled="isIsolatedApp"
                    :mkf="mkf"
                />
            </div>
        </div>
        <div v-if="magneticBuilderSettingsStore.graphsEnabled" class="row">
                <GraphInfo 
                    :masStore="masStore"
                    :mkf="mkf"
                />
        </div>
    </div>
</template>
