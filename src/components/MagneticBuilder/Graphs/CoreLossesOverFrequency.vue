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

        const coreLossesOverFrequencyData = [{
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
        const loading = false;
        const localData = {
            minimumFrequency: 1e3,
            maximumFrequency: 4e6,
            numberPoints: 200,
        }

        return {
            coreLossesOverFrequencyData,
            frequencyData,
            forceUpdate,
            localData,
            loading,
        }
    },
    computed: {
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.sweepCoreLossesOverFrequency(); }, 10);
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.sweepCoreLossesOverFrequency(); }, 10);
            },
          deep: true
        },
    },
    mounted () {
        this.loading = true;
        setTimeout(() => {this.sweepCoreLossesOverFrequency(); }, 10);
    },
    methods: {
        updatedNumberElements() {
            this.loading = true;
            setTimeout(() => {this.sweepCoreLossesOverFrequency(); }, 10);
        },
        sweepCoreLossesOverFrequency() {
            this.$mkf.ready.then(_ => {
                const curve2DJson = this.$mkf.sweep_core_losses_over_frequency(JSON.stringify(this.masStore.mas.magnetic), JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex]), this.localData.minimumFrequency, this.localData.maximumFrequency, this.localData.numberPoints, 25, "Core Losses over frequency")
                if (curve2DJson.startsWith("Exception")) {
                    this.loading = false;
                    console.error(curve2DJson);
                    return;
                }
                else {
                    const curve2D = JSON.parse(curve2DJson);
                    this.coreLossesOverFrequencyData[0].data = {
                        x: curve2D.xPoints,
                        y: curve2D.yPoints,
                    };
                    this.coreLossesOverFrequencyData[0].xMaximum =Math.max(...curve2D.xPoints);
                    this.coreLossesOverFrequencyData[0].xMinimum =Math.min(...curve2D.xPoints);
                    this.coreLossesOverFrequencyData[0].yMaximum =Math.max(...curve2D.yPoints);
                    this.coreLossesOverFrequencyData[0].yMinimum =Math.min(...curve2D.yPoints);
                    this.forceUpdate += 1;
                    this.loading = false;
                }

            }).catch(error => {
                console.error(error);
                this.loading = false;
                this.coreLossesOverFrequencyData[0].data = {
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
                <div class="row">
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
                        @update="sweepCoreLossesOverFrequency"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
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
                        @update="sweepCoreLossesOverFrequency"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <Dimension class="col-12 mb-1 text-start"
                        :name="'numberPoints'"
                        :replaceTitle="'No. Points'"
                        :unit="null"
                        :dataTestLabel="dataTestLabel + '-NumberPoints'"
                        :min="0"
                        :justifyContent="true"
                        :defaultValue="1"
                        :allowNegative="false"
                        :allowZero="false"
                        :modelValue="localData"
                        :labelWidthProportionClass="'col-6'"
                        :valueWidthProportionClass="'col-6'"
                        @update="sweepCoreLossesOverFrequency"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />

                </div>
            </div>
            <div class="col-9">
                <img :data-cy="dataTestLabel + '-CoreLossesOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
                <LineVisualizer 
                    v-show="!loading"
                    :data="coreLossesOverFrequencyData"
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