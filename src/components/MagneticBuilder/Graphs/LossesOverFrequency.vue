<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import LineVisualizer from '/WebSharedComponents/Common/LineVisualizer.vue'
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

        const lossesOverFrequencyData = [{
            label: 'Core Losses',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: 'info',
            type: 'log', // log or value
            position: 'left',
            unit: 'W',
        },
        {
            label: 'Winding Losses',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: 'success',
            type: 'log', // log or value
            position: 'right',
            unit: 'W',
        }]
        const frequencyData = {
            label: 'Frequency',
            colorLabel: 'info',
            type: 'log', // log or value
            unit: 'Hz',
        }
        const forceUpdate = 0;
        const recentChange = false;
        const tryingToSend = false;
        const loading = false;

        return {
            lossesOverFrequencyData,
            frequencyData,
            forceUpdate,
            loading,
            recentChange,
            tryingToSend,
        }
    },
    computed: {
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.tryToSend(); }, 10);
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.tryToSend(); }, 10);
            },
          deep: true
        },
        '$stateStore.graphParameters': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.tryToSend(); }, 10);
            },
          deep: true
        },
    },
    mounted () {
        this.loading = true;
        setTimeout(() => {this.sweepLossesOverFrequency(); }, 10);
    },
    methods: {
        tryToSend() {
            if (!this.tryingToSend) {
                this.recentChange = false;
                this.tryingToSend = true;
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToSend = false;
                        this.tryToSend();
                    }
                    else {
                        this.tryingToSend = false;
                        this.sweepLossesOverFrequency();
                    }
                }
                , 500);
            }
        },
        sweepLossesOverFrequency() {
            this.frequencyData.type = this.$stateStore.graphParameters.xAxisMode == "linear"? "value" : this.$stateStore.graphParameters.xAxisMode;
            this.lossesOverFrequencyData[0].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.lossesOverFrequencyData[1].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.$mkf.ready.then(_ => {
                {
                    const curve2DJson = this.$mkf.sweep_core_losses_over_frequency(JSON.stringify(this.masStore.mas.magnetic), JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex]), this.$stateStore.graphParameters.minimumFrequency, this.$stateStore.graphParameters.maximumFrequency, this.$stateStore.graphParameters.numberPoints, 25, this.$stateStore.graphParameters.xAxisMode, "Core Losses over frequency")
                    if (curve2DJson.startsWith("Exception")) {
                        this.loading = false;
                        console.error(curve2DJson);
                        return;
                    }
                    else {
                        const curve2D = JSON.parse(curve2DJson);
                        this.lossesOverFrequencyData[0].data = {
                            x: curve2D.xPoints,
                            y: curve2D.yPoints,
                        };
                        this.lossesOverFrequencyData[0].xMaximum = Math.max(...curve2D.xPoints);
                        this.lossesOverFrequencyData[0].xMinimum = Math.min(...curve2D.xPoints);
                        this.lossesOverFrequencyData[0].yMaximum = Math.max(...curve2D.yPoints);
                        this.lossesOverFrequencyData[0].yMinimum = Math.min(...curve2D.yPoints);
                        this.forceUpdate += 1;
                        this.loading = false;
                    }
                }
                {
                    const curve2DJson = this.$mkf.sweep_winding_losses_over_frequency(JSON.stringify(this.masStore.mas.magnetic), JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex]), this.$stateStore.graphParameters.minimumFrequency, this.$stateStore.graphParameters.maximumFrequency, this.$stateStore.graphParameters.numberPoints, 25, this.$stateStore.graphParameters.xAxisMode, "Winding Losses over frequency")
                    if (curve2DJson.startsWith("Exception")) {
                        this.loading = false;
                        console.error(curve2DJson);
                        return;
                    }
                    else {
                        const curve2D = JSON.parse(curve2DJson);
                        this.lossesOverFrequencyData[1].data = {
                            x: curve2D.xPoints,
                            y: curve2D.yPoints,
                        };
                        this.lossesOverFrequencyData[1].xMaximum = Math.max(...curve2D.xPoints);
                        this.lossesOverFrequencyData[1].xMinimum = Math.min(...curve2D.xPoints);
                        this.lossesOverFrequencyData[1].yMaximum = Math.max(...curve2D.yPoints);
                        this.lossesOverFrequencyData[1].yMinimum = Math.min(...curve2D.yPoints);
                        this.forceUpdate += 1;
                        this.loading = false;
                    }
                }

            }).catch(error => {
                console.error(error);
                this.loading = false;
                this.lossesOverFrequencyData[0].data = {
                    x: [],
                    y: [],
                };
                this.forceUpdate += 1;
            });
        },
    }
}
</script>

<template>
    <div>
        <div class="row">
            <div class="col-3">
                <div class="row">
                    <slot/>
                </div>
            </div>
            <div class="col-9">
                <img :data-cy="dataTestLabel + '-CoreLossesOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
                <LineVisualizer 
                    v-show="!loading"
                    :data="lossesOverFrequencyData"
                    :xAxisOptions="frequencyData"
                    :title="'Core Losses over Frequency'"
                    :forceUpdate="forceUpdate"
                    :bgColor="$styleStore.magneticBuilder.graphBgColor.background"
                    :lineColor="$styleStore.magneticBuilder.graphLineColor.color"
                    :pointsColor="$styleStore.magneticBuilder.graphPointsColor.color"
                    :textColor="$styleStore.magneticBuilder.inputTextColor.color"
                />
            </div>
        </div>
    </div>
</template>