<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import PropertyTool from '/WebSharedComponents/Common/PropertyTool.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
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
        frequencyRanges: {
            type: Object,
            default: [[0, 150000], [150000, 350000], [350000, 40000000]]
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const indexes = [];
        const blockingRebounds = false;
        const configurationPerTemperature = {
            xAxisLabel: 'frequency',
            yAxisLabel: 'value',
            xAxisReplaceLabel: 'freq.',
            yAxisReplaceLabel: [],
            xAxisMode: 'log',
            yAxisMode: 'log',
            xAxisUnit: 'Hz',
            yAxisUnit: 'W/m³',
            xAxisAllowNegative: true,
            yAxisAllowNegative: true,
            xAxisDefaultValue: 10000,
            yAxisDefaultValue: 1,
            xAxisNumberDecimals: 0,
            yAxisNumberDecimals: 2,
            xAxisMin: 1,
            yAxisMin: 0,
            xAxisMax: 15000000,
            yAxisMax: 10000000000,
        }


        const localData = [];
        const volumetricLossesPoints = [];
        const configuration = [];
        const temperatures = [];

        return {
            blockingRebounds,
            indexes,
            configurationPerTemperature,
            localData,
            volumetricLossesPoints,
            configuration,
            temperatures,
        }
    },
    watch: { 
        'data': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds) {
                    this.assignLocalData();
                    this.blockingRebounds = true;
                    setTimeout(() => this.blockingRebounds = false, 10);
                }
            },
          deep: true
        },
    },
    created () {
    },
    mounted () {
        this.assignLocalData();
    },
    methods: {
        assignLocalData() {
            this.$mkf.ready.then(_ => {
                this.localData = [];

                const distictTemperatures = [];
                const distictMagneticFluxDensities = [];
                const distictFrequencies = [];
                this.data.default.forEach((method) => {
                    if (Array.isArray(method)) {
                        this.volumetricLossesPoints = method;
                    }
                })
                this.volumetricLossesPoints.forEach((elem) => {
                    if (!distictTemperatures.includes(elem.temperature)) {
                        distictTemperatures.push(elem.temperature);
                    }
                    if (!distictMagneticFluxDensities.includes(elem.magneticFluxDensity.magneticFluxDensity.processed.peak)) {
                        distictMagneticFluxDensities.push(elem.magneticFluxDensity.magneticFluxDensity.processed.peak);
                    }
                    if (!distictFrequencies.includes(elem.magneticFluxDensity.frequency)) {
                        distictFrequencies.push(elem.magneticFluxDensity.frequency);
                    }
                })

                distictTemperatures.forEach((temperature, temperatureIndex) => {
                    this.localData.push([]);
                    this.indexes.push([]);
                    this.configuration.push(deepCopy(this.configurationPerTemperature))
                    distictMagneticFluxDensities.forEach((magneticFluxDensity, magneticFluxDensityIndex) => {
                        this.localData[this.localData.length - 1].push([]);
                        this.indexes[this.indexes.length - 1].push([]);
                        this.configuration[this.configuration.length - 1].yAxisReplaceLabel.push(String(magneticFluxDensity))
                    })
                })
                this.volumetricLossesPoints.forEach((datum, index) => {
                    distictTemperatures.forEach((temperature, temperatureIndex) => {
                        if (datum.temperature == temperature) {
                            distictMagneticFluxDensities.forEach((magneticFluxDensity, magneticFluxDensityIndex) => {
                                if (datum.magneticFluxDensity.magneticFluxDensity.processed.peak == magneticFluxDensity) {
                                    this.indexes[temperatureIndex][magneticFluxDensityIndex].push(index);
                                    this.localData[temperatureIndex][magneticFluxDensityIndex].push({
                                        frequency: datum.magneticFluxDensity.frequency,
                                        value: datum.value
                                    })
                                }
                            })
                        }
                    })
                })
                this.temperatures = distictTemperatures;
            })
        },
        onRemovePoint(temperatureIndex, seriesIndex, index) {
            this.volumetricLossesPoints.splice(this.indexes[temperatureIndex][seriesIndex][index], 1);
            this.assignLocalData();
        },
        onAddPoint(temperatureIndex, seriesIndex, index) {
            if (this.localData.length > 0) {
                const newElement = deepCopy(this.volumetricLossesPoints[this.indexes[temperatureIndex][seriesIndex][index]])
                this.volumetricLossesPoints.splice(this.indexes[temperatureIndex][seriesIndex][index] + 1, 0, newElement)
            }
            else {
                const aux = {};
                aux[this.configuration[temperatureIndex].xAxisLabel] = 0;
                aux[this.configuration[temperatureIndex].yAxisLabel] = 0;
                this.volumetricLossesPoints.push(aux);
            }
            this.assignLocalData();
        },
        onDimensionUpdate(temperatureIndex, event, seriesIndex, index) {
            this.volumetricLossesPoints[this.indexes[temperatureIndex][seriesIndex][index]].magneticFluxDensity.frequency = event.frequency;
            this.volumetricLossesPoints[this.indexes[temperatureIndex][seriesIndex][index]].value = event.value;
        },
    }
}
</script>

<template>
    <PropertyTool
        v-if="localData.length > 0 && localData[0] != null"
        v-for="temperature, temperatureIndex in temperatures"
        :dataTestLabel="dataTestLabel + '-PropertyTool'"
        :title="`Volumetric Losses at ${temperature} °C`"
        :properties="localData[temperatureIndex]"
        :propertiesConfiguration="configuration[temperatureIndex]"
        :chartStyle="'height: 30vh'"
        :smoothLine="true"
        :chartPaddings="{top: localData[temperatureIndex].length > 0? 30 : 10, left: 75, right: 2, bottom: 30}"
        @onRemovePoint="(event, seriesIndex, index) => onRemovePoint(temperatureIndex, seriesIndex, index)"
        @onAddPoint="(event, seriesIndex, index) => onAddPoint(temperatureIndex, seriesIndex, index)"
        @onDimensionUpdate="(event, seriesIndex, index) => onDimensionUpdate(temperatureIndex, event, seriesIndex, index)"
    />
</template>
