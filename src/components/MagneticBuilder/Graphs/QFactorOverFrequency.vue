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
    },
    data() {

        const qFactorOverFrequencyData = [{
            label: 'Q Factor',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: '#b18aea',
            type: 'log', // log or value
            position: 'left',
            unit: '',
        }]
        const frequencyData = {
            label: 'Frequency',
            colorLabel: '#d4d4d4',
            type: 'log', // log or value
            unit: 'Hz',
        }
        const forceUpdate = 0;
        const loading = false;
        const recentChange = false;
        const tryingToSend = false;
        const errorMessage = "";

        return {
            qFactorOverFrequencyData,
            frequencyData,
            forceUpdate,
            loading,
            recentChange,
            tryingToSend,
            errorMessage,
        }
    },
    computed: {
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                this.loading = true;
                this.recentChange = true;
                setTimeout(() => {this.tryToSend(); }, 10);
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.loading = true;
                this.recentChange = true;
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
        this.recentChange = true;
        setTimeout(() => {this.tryToSend(); }, 10);
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
                        this.sweepQFactorOverFrequency();
                    }
                }
                , 500);
            }
        },
        sweepQFactorOverFrequency() {
            this.frequencyData.type = this.$stateStore.graphParameters.xAxisMode == "linear"? "value" : this.$stateStore.graphParameters.xAxisMode;
            this.qFactorOverFrequencyData[0].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.$mkf.ready.then(_ => {
                const curve2DJson = this.$mkf.sweep_q_factor_over_frequency(JSON.stringify(this.masStore.mas.magnetic), this.$stateStore.graphParameters.minimumFrequency, this.$stateStore.graphParameters.maximumFrequency, this.$stateStore.graphParameters.numberPoints, this.$stateStore.graphParameters.xAxisMode, "Q Factor over frequency");
                if (curve2DJson.startsWith("Exception")) {
                    console.error(curve2DJson);
                    this.loading = false;
                    return;
                }
                else {
                    const curve2D = JSON.parse(curve2DJson);
                    this.qFactorOverFrequencyData[0].data = {
                        x: curve2D.xPoints,
                        y: curve2D.yPoints,
                    };
                    this.qFactorOverFrequencyData[0].xMaximum =Math.max(...curve2D.xPoints);
                    this.qFactorOverFrequencyData[0].xMinimum =Math.min(...curve2D.xPoints);
                    this.qFactorOverFrequencyData[0].yMaximum =Math.max(...curve2D.yPoints);
                    this.qFactorOverFrequencyData[0].yMinimum =Math.min(...curve2D.yPoints);
                    this.forceUpdate += 1;
                    this.errorMessage = "";
                    this.loading = false;
                }

            }).catch(error => {
                console.error(error);
                this.errorMessage = "Material is missing complex permeability, please choose another";
                this.loading = false;
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

                <img :data-cy="dataTestLabel + '-QFactorOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: auto; height: 60%;;" :src="$settingsStore.loadingGif">
                <label v-if="errorMessage != ''" :data-cy="dataTestLabel + '-BottomOrRightMarginErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{errorMessage}}</label>
                <LineVisualizer 
                    v-else
                    v-show="!loading"
                    :data="qFactorOverFrequencyData"
                    :xAxisOptions="frequencyData"
                    :title="'Q Factor over Frequency'"
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