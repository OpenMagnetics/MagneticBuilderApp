<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import ImpedanceOverFrequency from './Graphs/ImpedanceOverFrequency.vue'
import ResistancesOverFrequency from './Graphs/ResistancesOverFrequency.vue'
import WindingResistancesOverFrequency from './Graphs/WindingResistancesOverFrequency.vue'
import WindingLossesOverFrequency from './Graphs/WindingLossesOverFrequency.vue'
import LossesOverFrequency from './Graphs/LossesOverFrequency.vue'
import CoreLossesOverFrequency from './Graphs/CoreLossesOverFrequency.vue'
import GraphCommonParameters from './Graphs/GraphCommonParameters.vue'
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
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const errorMessage = "";

        return {
            errorMessage,
        }
    },
    computed: {
    },
    watch: {
    },
    mounted () {
    },
    methods: {
    }
}
</script>

<template>
    <div class="container-flex mt-2 mb-3 pb-3 border-top pt-2">
        <div class="row">
            <ImpedanceOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.type == 'impedanceOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />
            </ImpedanceOverFrequency> 
            <ResistancesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.type == 'resistancesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </ResistancesOverFrequency> 
            <WindingResistancesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.type == 'windingResistancesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </WindingResistancesOverFrequency> 
            <WindingLossesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.type == 'windingLossesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </WindingLossesOverFrequency>
            <CoreLossesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.type == 'coreLossesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </CoreLossesOverFrequency> 
            <LossesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.type == 'lossesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </LossesOverFrequency> 
            <label v-else :data-cy="dataTestLabel + '-ErrorMEssage'" class="text-danger m-0 col-12 " style="font-size: 0.9em"> {{errorMessage}}</label>


        </div>
    </div>
</template>