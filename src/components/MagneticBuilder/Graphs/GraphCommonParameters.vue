<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'

</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        const availableGraphs = {
            'impedanceOverFrequency': 'Impedance Over Frequency',
            'resistancesOverFrequency': 'Total Resistance Over Frequency',
            'windingResistancesOverFrequency': 'Resistances Per Winding Over Frequency',
            'coreLossesOverFrequency': 'Core Losses Over Frequency',
            'windingLossesOverFrequency': 'Winding Losses Over Frequency',
            'lossesOverFrequency': 'Total Losses Over Frequency',
        }
        const availableModes = {
            'log': 'Log',
            'linear': 'Linear',
        }

        return {
            availableGraphs,
            availableModes,
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
    <ElementFromList
        class="col-12 mb-1 text-start"
        :dataTestLabel="dataTestLabel + '-GraphsSelector'"
        :name="'graph'"
        :titleSameRow="true"
        :justifyContent="true"
        v-model="$stateStore.graphParameters"
        :options="availableGraphs"
        :labelWidthProportionClass="'col-6'"
        :selectStyleClass="'col-6'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <ElementFromList
        class="col-12 mb-1 text-start"
        :dataTestLabel="dataTestLabel + '-GraphsSelector'"
        :name="'xAxisMode'"
        :titleSameRow="true"
        :justifyContent="true"
        v-model="$stateStore.graphParameters"
        :options="availableModes"
        :labelWidthProportionClass="'col-6'"
        :selectStyleClass="'col-6'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <ElementFromList
        class="col-12 mb-1 text-start"
        :dataTestLabel="dataTestLabel + '-GraphsSelector'"
        :name="'yAxisMode'"
        :titleSameRow="true"
        :justifyContent="true"
        v-model="$stateStore.graphParameters"
        :options="availableModes"
        :labelWidthProportionClass="'col-6'"
        :selectStyleClass="'col-6'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="col-12 mb-1 text-start"
        :name="'minimumFrequency'"
        :unit="'Hz'"
        :dataTestLabel="dataTestLabel + '-MinimumFrequency'"
        :min="0"
        :justifyContent="true"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="false"
        :modelValue="$stateStore.graphParameters"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="col-12 mb-1 text-start"
        :name="'maximumFrequency'"
        :unit="'Hz'"
        :dataTestLabel="dataTestLabel + '-MaximumFrequency'"
        :min="0"
        :justifyContent="true"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="false"
        :modelValue="$stateStore.graphParameters"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="col-12 mb-1 text-start"
        :name="'numberPoints'"
        :replaceTitle="'No. Points'"
        :unit="null"
        :dataTestLabel="dataTestLabel + '-NumberPoints'"
        :min="0"
        :justifyContent="true"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="false"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-6'"
        :valueWidthProportionClass="'col-6'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
</template>