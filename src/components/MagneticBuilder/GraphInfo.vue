<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import ImpedanceOverFrequency from './Graphs/ImpedanceOverFrequency.vue'
import ResistancesOverFrequency from './Graphs/ResistancesOverFrequency.vue'
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
        }
    },
    data() {
        const errorMessage = "";
        const localData = {
            graph: 'impedanceOverFrequency'
        }

        const availableGraphs = {
            'impedanceOverFrequency': 'Impedance Over Frequency',
            'resistancesOverFrequency': 'Resistances Over Frequency',
        }

        return {
            errorMessage,
            localData,
            availableGraphs,
        }
    },
    computed: {
    },
    watch: {
    },
    mounted () {
    },
    methods: {
        graphTypeUpdated() {
        },
    }
}
</script>

<template>
    <div class="container-flex mt-2 mb-3 pb-3 border-top pt-2">
        <div class="row">
            <ImpedanceOverFrequency 
                v-if="errorMessage == '' && localData.graph == 'impedanceOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <ElementFromList
                    class="col-12 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-GraphsSelector'"
                    :name="'graph'"
                    :titleSameRow="true"
                    :justifyContent="true"
                    v-model="localData"
                    :options="availableGraphs"
                    @update="graphTypeUpdated"
                    :labelWidthProportionClass="'col-6'"
                    :selectStyleClass="'col-6'"
                    :labelBgColor="$settingsStore.labelBgColor"
                    :valueBgColor="$settingsStore.valueBgColor"
                    :textColor="$settingsStore.textColor"
                />
            </ImpedanceOverFrequency> 
            <ResistancesOverFrequency 
                v-if="errorMessage == '' && localData.graph == 'resistancesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <ElementFromList
                    class="col-12 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-GraphsSelector'"
                    :name="'graph'"
                    :titleSameRow="true"
                    :justifyContent="true"
                    v-model="localData"
                    :options="availableGraphs"
                    @update="graphTypeUpdated"
                    :labelWidthProportionClass="'col-6'"
                    :selectStyleClass="'col-6'"
                    :labelBgColor="$settingsStore.labelBgColor"
                    :valueBgColor="$settingsStore.valueBgColor"
                    :textColor="$settingsStore.textColor"
                />
            </ResistancesOverFrequency> 
            <label v-else :data-cy="dataTestLabel + '-ErrorMEssage'" class="text-danger m-0 col-12 " style="font-size: 0.9em"> {{errorMessage}}</label>


        </div>
    </div>
</template>