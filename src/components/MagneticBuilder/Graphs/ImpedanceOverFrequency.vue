<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'

import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'
import LineVisualizer from '/WebSharedComponents/Common/LineVisualizer.vue'
import { useTaskQueueStore } from '../../../stores/taskQueue'
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

        const impedanceOverFrequencyData = [{
            label: 'Impedance',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: '#b18aea',
            type: 'log', // log or value
            position: 'left',
            unit: 'Ω',
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
        const tryingToSweep = false;
        const errorMessage = "";
        const subscriptions = [];

        return {
            taskQueueStore,
            impedanceOverFrequencyData,
            frequencyData,
            forceUpdate,
            loading,
            recentChange,
            tryingToSweep,
            errorMessage,
            subscriptions,
        }
    },
    computed: {
        impedancePoints() {
            const points = [];
            if (this.masStore.mas.inputs.designRequirements.minimumImpedance != null) {
                this.masStore.mas.inputs.designRequirements.minimumImpedance.forEach((elem) => {
                    points.push({
                        data: {
                            x: elem.frequency,
                            y: elem.impedance.magnitude
                        },
                        unit: 'Ω',
                        colorLabel: 'danger',

                    });
                })
            }
            return points;
        }
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
                        this.sweepImpedanceOverFrequency();
                    }
                }
                , 500);
            }
        },
        sweepImpedanceOverFrequency() {
            this.frequencyData.type = this.$stateStore.graphParameters.xAxisMode == "linear"? "value" : this.$stateStore.graphParameters.xAxisMode;
            this.impedanceOverFrequencyData[0].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.taskQueueStore.sweepImpedanceOverFrequency(this.masStore.mas.magnetic, this.$stateStore.graphParameters.minimumFrequency, this.$stateStore.graphParameters.maximumFrequency, this.$stateStore.graphParameters.numberPoints, this.$stateStore.graphParameters.xAxisMode, "Impedance over frequency").then((curve2D) => {
                this.impedanceOverFrequencyData[0].data = {
                    x: curve2D.xPoints,
                    y: curve2D.yPoints,
                };
                this.impedanceOverFrequencyData[0].xMaximum =Math.max(...curve2D.xPoints);
                this.impedanceOverFrequencyData[0].xMinimum =Math.min(...curve2D.xPoints);
                this.impedanceOverFrequencyData[0].yMaximum =Math.max(...curve2D.yPoints);
                this.impedanceOverFrequencyData[0].yMinimum =Math.min(...curve2D.yPoints);
                this.forceUpdate += 1;
                this.errorMessage = "";
                this.loading = false;
            })
            .catch(error => {
                console.error(error);
                this.loading = false;
                this.errorMessage = "Error calculating impedance";
                this.impedanceOverFrequencyData[0].data = {
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

                <img :data-cy="dataTestLabel + '-ResistancesOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: auto; height: 60%;;" :src="$settingsStore.loadingGif">
                <label v-if="errorMessage != ''" :data-cy="dataTestLabel + '-BottomOrRightMarginErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{errorMessage}}</label>
                <LineVisualizer 
                    v-else
                    v-show="!loading"
                    :data="impedanceOverFrequencyData"
                    :points="impedancePoints"
                    :xAxisOptions="frequencyData"
                    :title="'Impedance over Frequency'"
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