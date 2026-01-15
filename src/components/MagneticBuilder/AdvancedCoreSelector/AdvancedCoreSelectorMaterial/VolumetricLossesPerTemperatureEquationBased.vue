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
        chartStyle: {
            type: String,
            default: 'height: 30vh',
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const indexes = [];
        const configuration = {
                xAxisLabel: 'frequency',
                yAxisLabel: 'value',
                xAxisReplaceLabel: 'Freq.',
                yAxisReplaceLabel: [],
                xAxisMode: 'log',
                yAxisMode: 'log',
                xAxisUnit: 'Hz',
                xAxisEquationParameter: 'f',
                yAxisUnit: 'W/m³',
                seriesEquationParameter: 'B',
                seriesEquationParameterUnit: 'T',
                xAxisAllowNegative: true,
                yAxisAllowNegative: false,
                xAxisDefaultValue: 25,
                yAxisDefaultValue: 1,
                xAxisNumberDecimals: 1,
                yAxisNumberDecimals: 0,
                xAxisMin: 50,
                yAxisMin: 1,
                xAxisMax: 10e+6,
                yAxisMax: 1e12,
                xAxisNumberPoints: 20,
        }

        const bFieldValues = [0.05, 0.1, 0.2, 0.5, 1];
        const coefficients = [];
        const equations = [];
        const baseValues = [];

        return {
            taskQueueStore,
            indexes,
            configuration,
            bFieldValues,
            coefficients,
            equations,
            baseValues,
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
            this.data.default.forEach((method) => {
                if (!Array.isArray(method)) {
                    if (method.method == "magnetics" || method.method == "micrometals") {

                        this.taskQueueStore.getCoreVolumetricLossesEquations(this.data).then((handle) => {
                            const equation = handle.get("volumetricCoreLosses");

                            this.bFieldValues.forEach((bValue) => {
                                this.coefficients.push(deepCopy(method));
                                delete this.coefficients[this.coefficients.length - 1].method;
                                this.equations.push(equation);
                                this.baseValues.push(1);
                                this.configuration.yAxisReplaceLabel.push(String(bValue));
                            })
                        })
                    }
                }
            }) 

        },
    }
}
</script>

<template>
    <EquationPropertyTool
        v-if="data != null && data.default != null && equations.length > 0"
        :dataTestLabel="dataTestLabel + '-EquationPropertyTool'"
        :title="`Volumetric Losses`"
        :equations="equations"
        :baseValues="baseValues"
        :coefficients="coefficients"
        :propertiesConfiguration="configuration"
        :chartStyle="chartStyle"
        :chartPaddings="{top: 30, left: 75, right: 2, bottom: 30}"
        :smoothLine="true"
        :formulaFontSize="20"
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
