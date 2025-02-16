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

        const windingLossesOverFrequencyData = [{
            label: 'Losses',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: 'info',
            type: 'log', // log or value
            position: 'left',
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
            windingLossesOverFrequencyData,
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
        setTimeout(() => {this.sweepWindingLossesOverFrequency(); }, 10);
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
                        this.sweepWindingLossesOverFrequency();
                    }
                }
                , 500);
            }
        },
        sweepWindingLossesOverFrequency() {
            this.frequencyData.type = this.$stateStore.graphParameters.xAxisMode == "linear"? "value" : this.$stateStore.graphParameters.xAxisMode;
            this.windingLossesOverFrequencyData[0].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.$mkf.ready.then(_ => {
                const curve2DJson = this.$mkf.sweep_winding_losses_over_frequency(JSON.stringify(this.masStore.mas.magnetic), JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex]), this.$stateStore.graphParameters.minimumFrequency, this.$stateStore.graphParameters.maximumFrequency, this.$stateStore.graphParameters.numberPoints, 25, this.$stateStore.graphParameters.xAxisMode, "Winding Losses over frequency")
                if (curve2DJson.startsWith("Exception")) {
                    this.loading = false;
                    console.error(curve2DJson);
                    return;
                }
                else {
                    const curve2D = JSON.parse(curve2DJson);
                    this.windingLossesOverFrequencyData[0].data = {
                        x: curve2D.xPoints,
                        y: curve2D.yPoints,
                    };
                    this.windingLossesOverFrequencyData[0].xMaximum =Math.max(...curve2D.xPoints);
                    this.windingLossesOverFrequencyData[0].xMinimum =Math.min(...curve2D.xPoints);
                    this.windingLossesOverFrequencyData[0].yMaximum =Math.max(...curve2D.yPoints);
                    this.windingLossesOverFrequencyData[0].yMinimum =Math.min(...curve2D.yPoints);
                    this.forceUpdate += 1;
                    this.loading = false;
                }

            }).catch(error => {
                console.error(error);
                this.loading = false;
                this.windingLossesOverFrequencyData[0].data = {
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
                <img :data-cy="dataTestLabel + '-WindingLossesOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
                <LineVisualizer 
                    v-show="!loading"
                    :data="windingLossesOverFrequencyData"
                    :xAxisOptions="frequencyData"
                    :title="'Winding Losses over Frequency'"
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