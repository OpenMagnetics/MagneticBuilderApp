<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { toTitleCase, checkAndFixMas, deepCopy, range } from '/WebSharedComponents/assets/js/utils.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        loading: {
            type: Boolean,
            default: false,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        data: {
            type: Object,
            required: true,
        }
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const forceUpdate = 0;
        const subscriptions = [];
        return {
            taskQueueStore,
            forceUpdate,
            subscriptions
        }
    },
    computed: {
    },
    mounted() {
        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "newWireCreated") {
                    if (args[0]) {
                        console.log('[PlanarInsulationSelector] newWireCreated triggered, updating forceUpdate');
                        this.forceUpdate += 1;
                    }
                }
            });
        }));
    },
    beforeUnmount() {
        this.subscriptions.forEach((subscription) => {subscription();});
    }
}
</script>

<template>
    <div class="container p-0">
        <Dimension class="col-12 text-start"
            v-tooltip="tooltipsMagneticBuilder.coreToLayerDistance"
            v-if="!loading"
            :disabled="readOnly"
            :name="'coreToLayerDistance'"
            :unit="'m'"
            :defaultZeroUnit="0.001"
            :dataTestLabel="dataTestLabel + '-CoreToLayerDistance'"
            :numberDecimals="6"
            :min="1e-6"
            :max="1"
            :allowNegative="false"
            :allowZero="true"
            :modelValue="data"
            :forceUpdate="forceUpdate"
            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="$styleStore.magneticBuilder.inputTextColor"
            @update="$emit('update')"
        />
        <Dimension class="col-12 text-start"
            v-tooltip="tooltipsMagneticBuilder.borderToWireDistance"
            v-if="!loading"
            :disabled="readOnly"
            :name="'borderToWireDistance'"
            :unit="'m'"
            :defaultZeroUnit="0.001"
            :dataTestLabel="dataTestLabel + '-BorderToWireDistance'"
            :numberDecimals="6"
            :min="1e-6"
            :max="1"
            :allowNegative="false"
            :allowZero="true"
            :modelValue="data"
            :forceUpdate="forceUpdate"
            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="$styleStore.magneticBuilder.inputTextColor"
            @update="$emit('update')"
        />
        <h5 class="text-center" > {{'Insulation layer thickness'}} </h5>
        <div v-for="(value, key) in data.insulationThicknessPerLayer" :key="key" class="row text-start">
            <Dimension
                :name="key"
                :replaceTitle="`Ins. ${key}`"
                :unit="'m'"
                :defaultZeroUnit="0.001"
                :dataTestLabel="dataTestLabel + `-InsulationBetweenLayers-${key}`"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :forceUpdate="forceUpdate"
                :modelValue="data.insulationThicknessPerLayer"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="$emit('update')"
            />    
        </div>
        <h5 class="text-center" > {{'Turn clearance per winding'}} </h5>
        <div v-for="(value, key) in data.clearancePerWinding" :key="key" class="row text-start">
            <Dimension
                :name="key"
                :replaceTitle="`Winding ${Number(key) + 1}`"
                :unit="'m'"
                :defaultZeroUnit="0.001"
                :dataTestLabel="dataTestLabel + `-ClearancePerWinding-${key}`"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :forceUpdate="forceUpdate"
                :modelValue="data.clearancePerWinding"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="$emit('update')"
            />    
        </div>
    </div>
</template>
