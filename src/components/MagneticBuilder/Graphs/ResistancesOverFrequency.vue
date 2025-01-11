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
        mkf: {
            type: Object,
            required: true,
        }
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

        return {
            resistancesOverFrequencyData,
            frequencyData,
            forceUpdate,
        }
    },
    computed: {
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                this.sweepResistancesOverFrequency();
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.sweepResistancesOverFrequency();
            },
          deep: true
        },
    },
    mounted () {
        this.sweepResistancesOverFrequency();
    },
    methods: {
        sweepResistancesOverFrequency() {
            this.mkf.ready.then(_ => {
                console.warn("curve2DJson")
                const curve2DJson = this.mkf.sweep_resistance_over_frequency(JSON.stringify(this.masStore.mas.magnetic), 1000, 4000000, 1000, 0, 25, "Resistance over frequency")
                console.warn(curve2DJson)
                // const curve2DJson = this.mkf.sweep_impedance_over_frequency(JSON.stringify(this.masStore.mas.magnetic), 1000, 4000000, 1000, "Impedance over frequency");
                if (curve2DJson.startsWith("Exception")) {
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
                }

            }).catch(error => {
                console.error(error);
                this.errorMessage = "Material is missing complex permeability, please choose another";
            });
        },
    }
}
</script>

<template>
    <LineVisualizer 
        :data="resistancesOverFrequencyData"
        :xAxisOptions="frequencyData"
        :title="'Resistances over Frequency'"
        :forceUpdate="forceUpdate"
    />
</template>