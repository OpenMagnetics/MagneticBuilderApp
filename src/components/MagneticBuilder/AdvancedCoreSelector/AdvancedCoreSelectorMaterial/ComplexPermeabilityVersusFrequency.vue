<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import PropertyTool from '/WebSharedComponents/Common/PropertyTool.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'

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
            yAxisReplaceLabel: ['Real', 'Imag.'],
            xAxisMode: 'log',
            yAxisMode: 'linear',
            xAxisUnit: 'Hz',
            yAxisUnit: null,
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
        const enableEditing = true;

        return {
            indexes,
            configuration,
            localData,
            enableEditing,
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
                this.localData = [[], []];
                if (typeof(this.data) == "object") {
                    // Real part
                    if (this.data != null && this.data.real != null) {
                        const stringVector = [];
                        this.data.real.forEach((elem) => {
                            stringVector.push(JSON.stringify(elem));
                        })
                        var handle = this.$mkf.get_only_frequency_dependent_indexes(JSON.stringify(stringVector));

                        this.indexes = [];
                        for (var i = 0; i < handle.size(); i++) {
                            const aux = handle.get(i);
                            if (this.data.real[aux].frequency != null) {
                                this.indexes.push(aux);
                            }
                        }

                        this.indexes.forEach((elem) => {
                            this.localData[0].push(this.data.real[elem]);
                        })
                    }
                    // Imaginary part
                    if (this.data != null && this.data.imaginary != null) {
                        const stringVector = [];
                        this.data.imaginary.forEach((elem) => {
                            stringVector.push(JSON.stringify(elem));
                        })
                        var handle = this.$mkf.get_only_frequency_dependent_indexes(JSON.stringify(stringVector));

                        this.indexes = [];
                        for (var i = 0; i < handle.size(); i++) {
                            const aux = handle.get(i);
                            if (this.data.imaginary[aux].frequency != null) {
                                this.indexes.push(aux);
                            }
                        }

                        this.indexes.forEach((elem) => {
                            this.localData[1].push(this.data.imaginary[elem]);
                        })
                    }
                }
                console.log(this.localData)
            })
        },
        onRemovePoint(seriesIndex, index) {
            if (seriesIndex == 0) {
                this.data.real.splice(this.indexes[index], 1);
            }
            else {
                this.data.imaginary.splice(this.indexes[index], 1);
            }
            this.assignLocalData();
        },
        onAddPoint(seriesIndex, index) {
            if (seriesIndex == 0) {
                if (this.localData.length > 0) {
                    const newElement = deepCopy(this.data.real[this.indexes[index]])
                    this.data.real.splice(this.indexes[index] + 1, 0, newElement)
                }
                else {
                    const aux = {};
                    aux[this.configuration.xAxisLabel] = 0;
                    aux[this.configuration.yAxisLabel] = 0;
                    this.data.real.push(aux);
                }
            }
            else {
                if (this.localData.length > 0) {
                    const newElement = deepCopy(this.data.imaginary[this.indexes[index]])
                    this.data.imaginary.splice(this.indexes[index] + 1, 0, newElement)
                }
                else {
                    const aux = {};
                    aux[this.configuration.xAxisLabel] = 0;
                    aux[this.configuration.yAxisLabel] = 0;
                    this.data.imaginary.push(aux);
                }
            }
            this.assignLocalData();
        },
        onDimensionUpdate(event, seriesIndex, index) {
            if (seriesIndex == 0) {
                this.data.real[this.indexes[index]][event.dimension] = event.value;
            }
            else {
                this.data.imaginary[this.indexes[index]][event.dimension] = event.value;
            }
        },
    }
}
</script>

<template>
    <PropertyTool
        v-if="data != null && data.real != null"
        :dataTestLabel="dataTestLabel + '-PropertyTool'"
        :title="'Complex Permeability vs Frequency'"
        :properties="localData"
        :propertiesConfiguration="configuration"
        :chartStyle="'height: 30vh'"
        :enableEditing="enableEditing"
        :smoothLine="true"
        @onRemovePoint="onRemovePoint"
        @onAddPoint="onAddPoint"
        @onDimensionUpdate="onDimensionUpdate"
    />
</template>
