<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import EquationPropertyTool from '/WebSharedComponents/Common/EquationPropertyTool.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import Text from '/WebSharedComponents/DataInput/Text.vue'
import { useTaskQueueStore } from '../../../../stores/taskQueue'

</script>

<script>
export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        data: {
            type: Object,
            required: true,
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const indexes = [];
        const configuration = {
                xAxisLabel: 'temperature',
                yAxisLabel: 'value',
                xAxisReplaceLabel: 'Temp.',
                yAxisReplaceLabel: ['Perm.'],
                xAxisMode: 'linear',
                yAxisMode: 'linear',
                xAxisUnit: '°C',
                xAxisEquationParameter: 'T',
                yAxisUnit: null,
                xAxisAllowNegative: true,
                yAxisAllowNegative: false,
                xAxisDefaultValue: 25,
                yAxisDefaultValue: 1,
                xAxisNumberDecimals: 1,
                yAxisNumberDecimals: 0,
                xAxisMin: -100,
                yAxisMin: 1,
                xAxisMax: 300,
                yAxisMax: 1e12,
                xAxisNumberPoints: 20,
        }

        const equation = "";

        return {
            taskQueueStore,
            indexes,
            configuration,
            equation,
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.assignLocalData();
    },
    methods: {
        assignLocalData() {
            console.log(this.data)
            if (this.data.modifiers != null && this.data.modifiers.default.temperatureFactor != null) {
                this.coefficients = this.data.modifiers.default.temperatureFactor;
                this.taskQueueStore.getInitialPermeabilityEquations(this.data).then((handle) => {
                    this.equation = handle.get("temperatureFactor");
                })
            }

        },
        onCoefficientUpdate(event, seriesIndex, index) {
            // this.data[this.indexes[index]][event.dimension] = event.value;
        },
    }
}
</script>

<template>
    <EquationPropertyTool
        v-if="data != null && data.modifiers != null && data.modifiers.default != null && data.modifiers.default.temperatureFactor != null"
        :dataTestLabel="dataTestLabel + '-EquationPropertyTool'"
        :title="'Init. Permeability vs Temperature'"
        :equations="[equation]"
        :baseValues="[data.value]"
        :coefficients="[data.modifiers.default.temperatureFactor]"
        :propertiesConfiguration="configuration"
        :chartStyle="'height: 30vh'"
        :smoothLine="true"
        @onCoefficientUpdate="onCoefficientUpdate"
        :addElementButtonColor="$styleStore.magneticBuilder.addElementButtonColor"
        :removeElementButtonColor="$styleStore.magneticBuilder.removeElementButtonColor"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputTextColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
        :activeButton="$styleStore.magneticBuilder.activeButton"
        :inactiveButton="$styleStore.magneticBuilder.button"
        :visualizerBgColor="$styleStore.magneticBuilder.main['background-color']"
        :visualizerLineColor="$styleStore.magneticBuilder.main.color"
        :visualizerTextColor="$styleStore.magneticBuilder.main.color"
    />
</template>
