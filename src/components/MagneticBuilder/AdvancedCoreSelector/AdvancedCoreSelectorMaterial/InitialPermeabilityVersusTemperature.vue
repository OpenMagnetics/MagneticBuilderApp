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
        equationBased: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const indexes = [];
        const configuration = {
                xAxisLabel: 'temperature',
                yAxisLabel: 'value',
                xAxisReplaceLabel: 'Temp.',
                yAxisReplaceLabel: ['Perm.'],
                xAxisMode: 'linear',
                yAxisMode: 'linear',
                xAxisUnit: '°C',
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
        }

        const localData = [];

        return {
            indexes,
            configuration,
            localData,
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
            this.$mkf.ready.then(_ => {
                if (typeof(this.data) == "object") {
                    const stringVector = [];
                    this.data.forEach((elem) => {
                        stringVector.push(JSON.stringify(elem));
                    })
                    var handle = this.$mkf.get_only_temperature_dependent_indexes(JSON.stringify(stringVector));

                    this.indexes = [];
                    for (var i = 0; i < handle.size(); i++) {
                        const aux = handle.get(i);
                        this.indexes.push(aux);
                    }

                    this.localData = [];
                    this.indexes.forEach((elem) => {
                        this.localData.push(this.data[elem]);
                    })
                }
            })
        },
        onRemovePoint(seriesIndex, index) {
            this.data.splice(this.indexes[index], 1);
            this.assignLocalData();
        },
        onAddPoint(seriesIndex, index) {
            if (this.localData.length > 0) {
                const newElement = deepCopy(this.data[this.indexes[index]])
                this.data.splice(this.indexes[index] + 1, 0, newElement)
            }
            else {
                const aux = {};
                aux[this.configuration.xAxisLabel] = 0;
                aux[this.configuration.yAxisLabel] = 0;
                this.data.push(aux);
            }
            this.assignLocalData();
        },
        onDimensionUpdate(event, seriesIndex, index) {
            this.data[this.indexes[index]][event.dimension] = event.value;
        },
    }
}
</script>

<template>
    <PropertyTool
        v-if="data != null"
        :dataTestLabel="dataTestLabel + '-PropertyTool'"
        :title="'Init. Permeability vs Temperature'"
        :properties="[localData]"
        :propertiesConfiguration="configuration"
        :chartStyle="'height: 30vh'"
        :smoothLine="true"
        @onRemovePoint="onRemovePoint"
        @onAddPoint="onAddPoint"
        @onDimensionUpdate="onDimensionUpdate"
    />
</template>
