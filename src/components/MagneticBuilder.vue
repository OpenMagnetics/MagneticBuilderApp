<script setup>
import { useHistoryStore } from '/src/stores/history'
import BasicCoreBuilder from './MagneticBuilder/BasicCoreBuilder.vue'
import BasicWireBuilder from './MagneticBuilder/BasicWireBuilder.vue'
import BasicCoilBuilder from './MagneticBuilder/BasicCoilBuilder.vue'
import { isMobile } from '/WebSharedComponents/assets/js/utils.js'
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
    },
    data() {
        const historyStore = useHistoryStore();
        return {
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
            <div :class="isMobile()? 'col-12' : 'col-4'">
                <BasicCoreBuilder 
                    :masStore="masStore"
                    :useVisualizers="true"
                    :isIsolatedApp="isIsolatedApp"
                />
            </div>
            <div :class="isMobile()? 'col-12' : 'col-4'">
                <BasicWireBuilder 
                    :masStore="masStore"
                    :useVisualizers="true"
                    :isIsolatedApp="isIsolatedApp"
                />
            </div>
            <div :class="isMobile()? 'col-12' : 'col-4'">
                <BasicCoilBuilder 
                    :masStore="masStore"
                    :useVisualizers="true"
                    :isIsolatedApp="isIsolatedApp"
                />
            </div>
        </div>
    </div>
</template>
