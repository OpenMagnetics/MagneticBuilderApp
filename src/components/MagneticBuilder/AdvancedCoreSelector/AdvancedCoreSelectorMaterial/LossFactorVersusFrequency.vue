<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import PropertyTool from '/WebSharedComponents/Common/PropertyTool.vue'
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
            yAxisReplaceLabel: ['Loss factor'],
            xAxisMode: 'log',
            yAxisMode: 'log',
            xAxisUnit: 'Hz',
            yAxisUnit: '',
            xAxisAllowNegative: true,
            yAxisAllowNegative: false,
            xAxisDefaultValue: 10000,
            yAxisDefaultValue: 1,
            xAxisNumberDecimals: 0,
            yAxisNumberDecimals: 0,
            xAxisMin: 0,
            yAxisMin: 1,
            xAxisMax: 1e12,
            yAxisMax: 1e12,
        }

        const localData = [];
        const methodIndex = 0;

        return {
            indexes,
            configuration,
            localData,
            methodIndex,
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
            this.data.default.forEach((method, methodIndex) => {
                if (!Array.isArray(method)) {
                    if (method.method == "lossFactor") {
                        this.methodIndex = methodIndex;
                        this.indexes = [];
                        method.factors.forEach((factor, index) => {
                            if (factor.frequency != null) {
                                this.indexes.push(index);
                            }
                        })

                        this.localData = [];
                        this.indexes.forEach((elem) => {
                            this.localData.push(method.factors[elem]);
                        })

                    }
                }
            }) 
        },
        onRemovePoint(seriesIndex, index) {
            this.data.default[this.methodIndex].factors.splice(this.indexes[index], 1);
            this.assignLocalData();
        },
        onAddPoint(seriesIndex, index) {
            if (this.localData.length > 0) {
                const newElement = deepCopy(this.data.default[this.methodIndex].factors[this.indexes[index]])
                this.data.default[this.methodIndex].factors.splice(this.indexes[index] + 1, 0, newElement)
            }
            else {
                const aux = {};
                aux[this.configuration.xAxisLabel] = 0;
                aux[this.configuration.yAxisLabel] = 0;
                this.data.default[this.methodIndex].factors.push(aux);
            }
            this.assignLocalData();
        },
        onDimensionUpdate(event, seriesIndex, index) {
            this.data.default[this.methodIndex].factors[this.indexes[index]][event.dimension] = event.value;
        },
    }
}
</script>

<template>
    <PropertyTool
        v-if="data != null"
        :dataTestLabel="dataTestLabel + '-PropertyTool'"
        :title="'Init. Permeability vs Frequency'"
        :properties="[localData]"
        :propertiesConfiguration="configuration"
        :chartStyle="'height: 30vh'"
        :chartPaddings="{top: 30, left: 55, right: 2, bottom: 30}"
        :smoothLine="true"
        @onRemovePoint="onRemovePoint"
        @onAddPoint="onAddPoint"
        @onDimensionUpdate="onDimensionUpdate"
    />
</template>
