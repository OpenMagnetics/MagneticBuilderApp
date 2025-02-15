<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import ImpedanceOverFrequency from './Graphs/ImpedanceOverFrequency.vue'
import ResistancesOverFrequency from './Graphs/ResistancesOverFrequency.vue'
import WindingResistancesOverFrequency from './Graphs/WindingResistancesOverFrequency.vue'
import WindingLossesOverFrequency from './Graphs/WindingLossesOverFrequency.vue'
import CoreLossesOverFrequency from './Graphs/CoreLossesOverFrequency.vue'
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
        const localData = {
            graph: 'impedanceOverFrequency',
        }

        const availableGraphs = {
            'impedanceOverFrequency': 'Impedance Over Frequency',
            'resistancesOverFrequency': 'Total Resistance Over Frequency',
            'windingResistancesOverFrequency': 'Resistances Per Winding Over Frequency',
            'coreLossesOverFrequency': 'Core Losses Over Frequency',
            'windingLossesOverFrequency': 'Winding Losses Over Frequency',
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
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
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
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
                />

            </ResistancesOverFrequency> 
            <WindingResistancesOverFrequency 
                v-if="errorMessage == '' && localData.graph == 'windingResistancesOverFrequency'" 
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
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
                />

            </WindingResistancesOverFrequency> 
            <WindingLossesOverFrequency 
                v-if="errorMessage == '' && localData.graph == 'windingLossesOverFrequency'" 
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
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
                />

            </WindingLossesOverFrequency>
            <CoreLossesOverFrequency 
                v-if="errorMessage == '' && localData.graph == 'coreLossesOverFrequency'" 
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
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
                />

            </CoreLossesOverFrequency> 
            <label v-else :data-cy="dataTestLabel + '-ErrorMEssage'" class="text-danger m-0 col-12 " style="font-size: 0.9em"> {{errorMessage}}</label>


        </div>
    </div>
</template>