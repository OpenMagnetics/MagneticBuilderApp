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

        const resistancesOverFrequencyData = [{
            label: 'Resistance',
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
        const recentChange = false;
        const tryingToSend = false;
        const loading = false;
        const localData = {
            selectedWinding: this.masStore.mas.magnetic.coil.functionalDescription[0].name,
        }

        return {
            resistancesOverFrequencyData,
            frequencyData,
            forceUpdate,
            localData,
            loading,
            recentChange,
            tryingToSend,
        }
    },
    computed: {
        windingNames() {
            const windingNames = [];
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((elem) => {
                windingNames.push(elem.name);
            })

            return windingNames;
        }
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
        setTimeout(() => {this.sweepResistancesOverFrequency(); }, 10);
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
                        this.sweepResistancesOverFrequency();
                    }
                }
                , 500);
            }
        },
        updatedNumberWindings() {
            this.loading = true;
            setTimeout(() => {this.sweepResistancesOverFrequency(); }, 10);
        },
        sweepResistancesOverFrequency() {
            this.frequencyData.type = this.$stateStore.graphParameters.xAxisMode == "linear"? "value" : this.$stateStore.graphParameters.xAxisMode;
            this.resistancesOverFrequencyData[0].type = this.$stateStore.graphParameters.yAxisMode == "linear"? "value" : this.$stateStore.graphParameters.yAxisMode;
            this.$mkf.ready.then(_ => {
                var windingIndex = 0;
                this.masStore.mas.magnetic.coil.functionalDescription.forEach((elem, index) => {
                    if (elem.name == this.localData.selectedWinding) {
                        windingIndex = index;
                    }
                })

                const curve2DJson = this.$mkf.sweep_winding_resistance_over_frequency(JSON.stringify(this.masStore.mas.magnetic), this.$stateStore.graphParameters.minimumFrequency, this.$stateStore.graphParameters.maximumFrequency, this.$stateStore.graphParameters.numberPoints, windingIndex, 25, this.$stateStore.graphParameters.xAxisMode, "Resistance over frequency")
                if (curve2DJson.startsWith("Exception")) {
                    this.loading = false;
                    console.error(curve2DJson);
                    return;
                }
                else {
                    const curve2D = JSON.parse(curve2DJson);
                    this.resistancesOverFrequencyData[0].data = {
                        x: curve2D.xPoints,
                        y: curve2D.yPoints,
                    };
                    this.resistancesOverFrequencyData[0].xMaximum =Math.max(...curve2D.xPoints);
                    this.resistancesOverFrequencyData[0].xMinimum =Math.min(...curve2D.xPoints);
                    this.resistancesOverFrequencyData[0].yMaximum =Math.max(...curve2D.yPoints);
                    this.resistancesOverFrequencyData[0].yMinimum =Math.min(...curve2D.yPoints);
                    this.forceUpdate += 1;
                    this.loading = false;
                }

            }).catch(error => {
                console.error(error);
                this.loading = false;
                this.resistancesOverFrequencyData[0].data = {
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
                <div class="row ">
                    <ElementFromList class="border-bottom py-2 text-start"
                        :name="'selectedWinding'"
                        :dataTestLabel="dataTestLabel + '-NumberWindings'"
                        :options="windingNames"
                        :titleSameRow="true"
                        v-model="localData"
                        @update="updatedNumberWindings"
                        :labelWidthProportionClass="'col-7'"
                        :selectStyleClass="'col-5'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"

                    />
                </div>
            </div>
            <div class="col-9">
                <img :data-cy="dataTestLabel + '-ResistancesOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
                <LineVisualizer 
                    v-show="!loading"
                    :data="resistancesOverFrequencyData"
                    :xAxisOptions="frequencyData"
                    :title="'Resistances over Frequency'"
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