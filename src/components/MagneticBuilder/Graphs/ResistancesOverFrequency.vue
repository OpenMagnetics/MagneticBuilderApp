<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
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
        loadingGif: {
            type: String,
            default: "/images/loading.gif",
        },
    },
    data() {

        const resistancesOverFrequencyData = [{
            label: 'Resistance',
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
        const localData = {
            selectedWinding: this.masStore.mas.magnetic.coil.functionalDescription[0].name
        }

        return {
            resistancesOverFrequencyData,
            frequencyData,
            forceUpdate,
            localData,
            loading,
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
                setTimeout(() => {this.sweepResistancesOverFrequency(); }, 10);
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.loading = true;
                setTimeout(() => {this.sweepResistancesOverFrequency(); }, 10);
            },
          deep: true
        },
    },
    mounted () {
        this.loading = true;
        setTimeout(() => {this.sweepResistancesOverFrequency(); }, 10);
    },
    methods: {
        updatedNumberElements() {
            this.loading = true;
            setTimeout(() => {this.sweepResistancesOverFrequency(); }, 10);
        },
        sweepResistancesOverFrequency() {
            this.$mkf.ready.then(_ => {
                var windingIndex = 0;
                this.masStore.mas.magnetic.coil.functionalDescription.forEach((elem, index) => {
                    if (elem.name == this.localData.selectedWinding) {
                        windingIndex = index;
                    }
                })

                const curve2DJson = this.$mkf.sweep_resistance_over_frequency(JSON.stringify(this.masStore.mas.magnetic), 1000, 4000000, 1000, windingIndex, 25, "Resistance over frequency")
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
                    this.errorMessage = "";
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
                <div class="row">
                    <ElementFromList class="border-bottom py-2"
                        :name="'selectedWinding'"
                        :dataTestLabel="dataTestLabel + '-NumberWindings'"
                        :options="windingNames"
                        :titleSameRow="true"
                        v-model="localData"
                        @update="updatedNumberElements"
                    />

                </div>
            </div>
            <div class="col-9">
                <img :data-cy="dataTestLabel + '-ResistancesOverFrequency-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="loadingGif">
                <LineVisualizer 
                    v-show="!loading"
                    :data="resistancesOverFrequencyData"
                    :xAxisOptions="frequencyData"
                    :title="'Resistances over Frequency'"
                    :forceUpdate="forceUpdate"
                />
            </div>
        </div>
    </div>
</template>