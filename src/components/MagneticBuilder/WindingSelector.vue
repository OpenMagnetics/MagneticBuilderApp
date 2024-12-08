<script setup>
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>
export default {
    props: {
        coil: {
            type: Object,
            required: true,
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        const selectedWindingIndex = 0;
        return {
            selectedWindingIndex,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    width: '200px',
                    'transition-delay': '1s',
                    "text-align": "start",
                },
            }
        },
    },
    watch: { 
    },
    mounted () {
    },
    methods: {
        getWindingLabel(key) {
            const refKey = 'select-winding-' + key;
            var clientWidth;

            try {
                Object.entries(this.$refs).forEach((value) => {
                    if (value[0] == refKey) {
                        clientWidth = value[1][0].clientWidth;
                    }
                })
            }
            catch (error) {
                setTimeout(() => this.getWindingLabel(key), 100);
            }

            if (clientWidth > 134) {
                return 'Winding ' + key;
            }
            else if (clientWidth > 114) {
                return 'Wind ' + key;
            }
            else {
                return 'W' + key;
            }
        },
        windingIndexChanged(windingIndex) {
            this.selectedWindingIndex = windingIndex;
            this.$emit("windingIndexChanged", windingIndex);
        },
        isWireMissing(windingIndex) {
            var isMissingWires = false;
            if (this.coil.functionalDescription[windingIndex].wire == "Dummy" || this.coil.functionalDescription[windingIndex].wire == "" || this.coil.functionalDescription[windingIndex].wire == null) {
                isMissingWires = true;
            }
            else {
                if (this.coil.functionalDescription[windingIndex].wire.type == null) {
                    isMissingWires = true;
                }
            }
            return isMissingWires;
        },
    }
}
</script>

<template>
    <div v-if="coil.functionalDescription.length > 1" v-tooltip="styleTooltip">
        <div class="accordion row m-0 p-0" id="wireBuilderAccordion bg-dark" v-tooltip="tooltipsMagneticBuilder.windingSelector">
            <div :class="'col-lg-' + Number(12 / coil.functionalDescription.length)" class="accordion-item border-0 m-0 p-0 bg-dark" v-for="value, key in coil.functionalDescription">
                <h2 class="accordion-header" :id="'wireBuilderAccordionHeading-' + key">
                    <button
                        :class="selectedWindingIndex == key? 'text-success' : isWireMissing(key)? 'text-danger collapsed' : 'text-white collapsed'"
                        class="fs-6 accordion-button bg-light p-2"
                        :ref="'select-winding-' + (key + 1)"
                        type="button"
                        data-bs-toggle="collapse"
                        aria-expanded="false"
                        :aria-controls="'wireBuilderAccordioncollapse_' + key"
                        @click="windingIndexChanged(key)">
                        {{getWindingLabel(key + 1)}}
                    </button>
                </h2>
            </div>
        </div>
    </div>

</template>
