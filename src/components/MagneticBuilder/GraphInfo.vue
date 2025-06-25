<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import ImpedanceOverFrequency from './Graphs/ImpedanceOverFrequency.vue'
import QFactorOverFrequency from './Graphs/QFactorOverFrequency.vue'
import ResistancesOverFrequency from './Graphs/ResistancesOverFrequency.vue'
import WindingResistancesOverFrequency from './Graphs/WindingResistancesOverFrequency.vue'
import WindingLossesOverFrequency from './Graphs/WindingLossesOverFrequency.vue'
import LossesOverFrequency from './Graphs/LossesOverFrequency.vue'
import CoreLossesOverFrequency from './Graphs/CoreLossesOverFrequency.vue'
import GraphCommonParameters from './Graphs/GraphCommonParameters.vue'
import MagnetizingInductanceOverFrequency from './Graphs/MagnetizingInductanceOverFrequency.vue'
import MagnetizingInductanceOverTemperature from './Graphs/MagnetizingInductanceOverTemperature.vue'
import MagnetizingInductanceOverDcBias from './Graphs/MagnetizingInductanceOverDcBias.vue'
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
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'impedanceOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />
            </ImpedanceOverFrequency>
            <QFactorOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'qFactorOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />
            </QFactorOverFrequency> 
            <MagnetizingInductanceOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'magnetizingInductanceOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </MagnetizingInductanceOverFrequency> 
            <MagnetizingInductanceOverTemperature 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'magnetizingInductanceOverTemperature'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                    :frequencyDependent="false"
                    :temperatureDependent="true"
                />

            </MagnetizingInductanceOverTemperature> 

            <MagnetizingInductanceOverDcBias 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'magnetizingInductanceOverDcBias'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                    :frequencyDependent="false"
                    :dcBiasDependent="true"
                />

            </MagnetizingInductanceOverDcBias> 

            <ResistancesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'resistancesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </ResistancesOverFrequency> 
            <WindingResistancesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'windingResistancesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </WindingResistancesOverFrequency> 
            <WindingLossesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'windingLossesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </WindingLossesOverFrequency>
            <CoreLossesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'coreLossesOverFrequency'" 
                :dataTestLabel="dataTestLabel"
                :masStore="masStore"
            >
                <GraphCommonParameters
                    :dataTestLabel="dataTestLabel + '-GraphCommonParameters'"
                />

            </CoreLossesOverFrequency> 
            <LossesOverFrequency 
                v-if="errorMessage == '' && $stateStore.graphParameters.graph == 'lossesOverFrequency'" 
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