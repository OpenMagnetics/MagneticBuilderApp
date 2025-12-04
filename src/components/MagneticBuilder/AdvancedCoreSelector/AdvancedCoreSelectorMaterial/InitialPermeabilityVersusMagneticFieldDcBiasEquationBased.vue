<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import EquationPropertyTool from '/WebSharedComponents/Common/EquationPropertyTool.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import Text from '/WebSharedComponents/DataInput/Text.vue'

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
        const indexes = [];
        const configuration = {
                xAxisLabel: 'magneticFieldDcBias',
                yAxisLabel: 'value',
                xAxisReplaceLabel: 'H DC bias.',
                yAxisReplaceLabel: ['Perm.'],
                xAxisMode: 'linear',
                yAxisMode: 'linear',
                xAxisUnit: 'A/m',
                xAxisEquationParameter: 'H',
                yAxisUnit: null,
                xAxisAllowNegative: true,
                yAxisAllowNegative: false,
                xAxisDefaultValue: 25,
                yAxisDefaultValue: 1,
                xAxisNumberDecimals: 0,
                yAxisNumberDecimals: 0,
                xAxisMin: 0,
                yAxisMin: 1,
                xAxisMax: 10000,
                yAxisMax: 1e12,
                xAxisNumberPoints: 20,
        }

        const equation = "";

        return {
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
            if (this.data.modifiers != null && this.data.modifiers.default.magneticFieldDcBiasFactor != null) {
                this.coefficients = this.data.modifiers.default.magneticFieldDcBiasFactor;

                this.configuration["additionalScope"] = {"mu_ini": 60};
                this.$mkf.ready.then(_ => {
                    const handle = this.$mkf.get_initial_permeability_equations(JSON.stringify(this.data));

                    this.equation = handle.get("magneticFieldDcBiasFactor");
                })
            }

        },
    }
}
</script>

<template>
    <EquationPropertyTool
        v-if="data != null && data.modifiers != null && data.modifiers.default != null && data.modifiers.default.magneticFieldDcBiasFactor != null"
        :dataTestLabel="dataTestLabel + '-EquationPropertyTool'"
        :title="'Init. Permeability vs H DC bias'"
        :equations="[equation]"
        :baseValues="[data.value]"
        :coefficients="[data.modifiers.default.magneticFieldDcBiasFactor]"
        :propertiesConfiguration="configuration"
        :chartStyle="'height: 30vh'"
        :smoothLine="true"
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
