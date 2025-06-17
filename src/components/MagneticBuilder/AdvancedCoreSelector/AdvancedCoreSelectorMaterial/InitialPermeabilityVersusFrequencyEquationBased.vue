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
                xAxisLabel: 'frequency',
                yAxisLabel: 'value',
                xAxisReplaceLabel: 'Freq.',
                yAxisReplaceLabel: ['Perm.'],
                xAxisMode: 'log',
                yAxisMode: 'linear',
                xAxisUnit: 'Hz',
                xAxisEquationParameter: 'f',
                yAxisUnit: null,
                xAxisAllowNegative: true,
                yAxisAllowNegative: false,
                xAxisDefaultValue: 25,
                yAxisDefaultValue: 1,
                xAxisNumberDecimals: 1,
                yAxisNumberDecimals: 0,
                xAxisMin: 50,
                yAxisMin: 1,
                xAxisMax: 20e+6,
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
            if (this.data.modifiers != null && this.data.modifiers.default.frequencyFactor != null) {
                this.coefficients = this.data.modifiers.default.frequencyFactor;
                this.$mkf.ready.then(_ => {
                    const handle = this.$mkf.get_initial_permeability_equations(JSON.stringify(this.data));

                    this.equation = handle.get("frequencyFactor");
                })
            }

        },
    }
}
</script>

<template>
    <EquationPropertyTool
        v-if="data != null && data.modifiers != null && data.modifiers.default != null && data.modifiers.default.frequencyFactor != null"
        :dataTestLabel="dataTestLabel + '-EquationPropertyTool'"
        :title="'Init. Permeability vs Frequency'"
        :equations="[equation]"
        :baseValues="[data.value]"
        :coefficients="[data.modifiers.default.frequencyFactor]"
        :propertiesConfiguration="configuration"
        :chartStyle="'height: 30vh'"
        :smoothLine="true"
    />
</template>
