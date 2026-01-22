<script setup>
import { combinedStyle } from '/WebSharedComponents/assets/js/utils.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
</script>

<script>
export default {
    emits: ["windingIndexChanged"],
    props: {
        coil: {
            type: Object,
            required: true,
        },
        masStore: {
            type: Object,
            required: true,
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const selectedWindingIndex = 0;
        const subscriptions = [];
        return {
            taskQueueStore,
            selectedWindingIndex,
            subscriptions,
        }
    },
    computed: {
        styleTooltip() {
            const relative_placement = 'top';
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
        this.subscriptions.push(this.masStore.$onAction((action) => {
            if (action.name == "updatedTurnsRatios") {
                this.selectedWindingIndex = Math.min(this.selectedWindingIndex, this.masStore.mas.inputs.designRequirements.turnsRatios.length);
                this.$emit("windingIndexChanged", this.selectedWindingIndex);
                this.taskQueueStore.windingIndexChanged(true);
            }
        }));
    },
    beforeUnmount() {
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    },
    methods: {
        getWindingLabel(key) {
            const refKey = 'select-winding-' + key;
            let clientWidth;

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
            let isMissingWires = false;
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
            <div :class="'col-lg-' + Number(12 / coil.functionalDescription.length)" class="accordion-item border-0 m-0 p-0 bg-dark" v-for="value, key in coil.functionalDescription" :key="key">
                <h2 class="accordion-header" :id="'wireBuilderAccordionHeading-' + key">
                    <button
                        :style="combinedStyle([selectedWindingIndex == key? $styleStore.magneticBuilder.inputSelectedTextColor : isWireMissing(key)? $styleStore.magneticBuilder.inputErrorTextColor : $styleStore.magneticBuilder.inputTextColor, $styleStore.magneticBuilder.inputFontSize, $styleStore.magneticBuilder.inputValueBgColor])"

                        :class="selectedWindingIndex == key? 'collapsed' : ''"
                        class="accordion-button p-2"
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
