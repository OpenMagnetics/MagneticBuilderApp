<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import LineVisualizer from '/WebSharedComponents/Common/LineVisualizer.vue'
import { useTaskQueueStore } from '../../../stores/taskQueue'
import { defaultOperatingConditions } from '/WebSharedComponents/assets/js/defaults.js'
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
        const taskQueueStore = useTaskQueueStore();

        const magnetizingInductanceOverDcBiasData = [{
            label: 'MagnetizingInductance',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: '#b18aea',
            type: 'value', // log or value
            position: 'left',
            unit: 'H',
            numberDecimals: 12,
        }]
        const dcBiasData = {
            label: 'DC Bias',
            colorLabel: '#d4d4d4',
            type: 'value', // log or value
            unit: 'A',
        }
        const forceUpdate = 0;
        const recentChange = false;
        const tryingToSweep = false;
        const loading = false;
        const subscriptions = [];

        return {
            taskQueueStore,
            magnetizingInductanceOverDcBiasData,
            dcBiasData,
            forceUpdate,
            loading,
            recentChange,
            tryingToSweep,
            subscriptions,
        }
    },
    computed: {
    },
    watch: {
        '$stateStore.graphParameters': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.tryToSweep(); }, 10);
            },
          deep: true
        },
    },
    mounted () {
        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "wound" || name == "planarWound" || name == "coreShapeProcessed" || name == "coreMaterialProcessed") {
                    if (args[0]) {
                        this.loading = true;
                        this.recentChange = true;
                        setTimeout(() => {this.tryToSweep(); }, 10);
                    }
                    else {
                        console.error(args[1])
                    }
                }
            });
        }))
        this.loading = true;
        this.recentChange = true;
        setTimeout(() => {this.tryToSweep(); }, 10);
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        tryToSweep() {
            if (!this.tryingToSweep) {
                this.recentChange = false;
                this.tryingToSweep = true;
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToSweep = false;
                        this.tryToSweep();
                    }
                    else {
                        this.tryingToSweep = false;
                        this.sweepMagnetizingInductanceOverDcBias();
                    }
                }
                , 500);
            }
        },
        sweepMagnetizingInductanceOverDcBias() {
            var ambientTemperature = defaultOperatingConditions.ambientTemperature;
            this.masStore.mas.inputs.operatingPoints.forEach((operatingPoint) => {
                ambientTemperature = Math.abs(ambientTemperature, operatingPoint.conditions.ambientTemperature);
            })
            if (this.$stateStore.graphParameters.minimumDcBias <= 0) {
                this.$stateStore.graphParameters.xAxisMode = "linear";
            }
            this.dcBiasData.type = this.$stateStore.graphParameters.xAxisMode == "linear"? "value" : this.$stateStore.graphParameters.xAxisMode;
            this.magnetizingInductanceOverDcBiasData[0].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.taskQueueStore.sweepMagnetizingInductanceOverDcBias(this.masStore.mas.magnetic, this.$stateStore.graphParameters.minimumDcBias, this.$stateStore.graphParameters.maximumDcBias, this.$stateStore.graphParameters.numberPoints, ambientTemperature, this.$stateStore.graphParameters.xAxisMode, "Magnetizing Inductance over Dc Bias").then((curve2D) => {
                this.magnetizingInductanceOverDcBiasData[0].data = {
                    x: curve2D.xPoints,
                    y: curve2D.yPoints,
                };
                this.magnetizingInductanceOverDcBiasData[0].xMaximum =Math.max(...curve2D.xPoints);
                this.magnetizingInductanceOverDcBiasData[0].xMinimum =Math.min(...curve2D.xPoints);
                this.magnetizingInductanceOverDcBiasData[0].yMaximum =Math.max(...curve2D.yPoints);
                this.magnetizingInductanceOverDcBiasData[0].yMinimum =Math.min(...curve2D.yPoints);
                this.forceUpdate += 1;
                this.loading = false;
            })
            .catch(error => {
                console.error(error);
                this.loading = false;
                this.magnetizingInductanceOverDcBiasData[0].data = {
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
                <img :data-cy="dataTestLabel + '-MagnetizingInductancesOverDcBias-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
                <LineVisualizer 
                    v-show="!loading"
                    :data="magnetizingInductanceOverDcBiasData"
                    :xAxisOptions="dcBiasData"
                    :title="'Magnetizing Inductance over DC Bias'"
                    :forceUpdate="forceUpdate"
                    :bgColor="$styleStore.magneticBuilder.graphBgColor['background-color']"
                    :lineColor="$styleStore.magneticBuilder.graphLineColor.color"
                    :pointsColor="$styleStore.magneticBuilder.graphPointsColor.color"
                    :textColor="$styleStore.magneticBuilder.inputTextColor.color"
                />
            </div>
        </div>
    </div>
</template>