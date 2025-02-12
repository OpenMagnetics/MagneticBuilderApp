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

        const impedanceOverFrequencyData = [{
            label: 'Impedance',
            data: {
                x: [0, 1],
                y: [0, 1],
            },
            colorLabel: 'info',
            type: 'log', // log or value
            position: 'left',
            unit: 'Ω',
        }]
        const frequencyData = {
            label: 'Frequency',
            colorLabel: 'info',
            type: 'log', // log or value
            unit: 'Hz',
        }
        const forceUpdate = 0;
        const loading = false;
        const recentChange = false;
        const tryingToSend = false;

        const localData = {
            minimumFrequency: 1e3,
            maximumFrequency: 4e6,
        }
        return {
            impedanceOverFrequencyData,
            frequencyData,
            forceUpdate,
            loading,
            recentChange,
            tryingToSend,
            localData,
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
                        this.sweepImpedanceOverFrequency();
                    }
                }
                , 500);
            }
        },
        sweepImpedanceOverFrequency() {
            this.$mkf.ready.then(_ => {
                const curve2DJson = this.$mkf.sweep_impedance_over_frequency(JSON.stringify(this.masStore.mas.magnetic), this.localData.minimumFrequency, this.localData.maximumFrequency, 1000, "Impedance over frequency");
                if (curve2DJson.startsWith("Exception")) {
                    console.error(curve2DJson);
                    this.loading = false;
                    return;
                }
                else {
                    const curve2D = JSON.parse(curve2DJson);
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
                <slot/>
                <Dimension class="col-12 mb-1 text-start"
                    :name="'minimumFrequency'"
                    :unit="'Hz'"
                    :dataTestLabel="dataTestLabel + '-MinimumFrequency'"
                    :min="0"
                    :justifyContent="true"
                    :defaultValue="1"
                    :allowNegative="false"
                    :allowZero="false"
                    :modelValue="localData"
                    @update="sweepImpedanceOverFrequency"
                    :labelBgColor="$settingsStore.labelBgColor"
                    :valueBgColor="$settingsStore.valueBgColor"
                    :textColor="$settingsStore.textColor"
                />
                <Dimension class="col-12 mb-1 text-start"
                    :name="'maximumFrequency'"
                    :unit="'Hz'"
                    :dataTestLabel="dataTestLabel + '-MaximumFrequency'"
                    :min="0"
                    :justifyContent="true"
                    :defaultValue="1"
                    :allowNegative="false"
                    :allowZero="false"
                    :modelValue="localData"
                    @update="sweepImpedanceOverFrequency"
                    :labelBgColor="$settingsStore.labelBgColor"
                    :valueBgColor="$settingsStore.valueBgColor"
                    :textColor="$settingsStore.textColor"
                />
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
                />
            </div>
        </div>
    </div>
</template>