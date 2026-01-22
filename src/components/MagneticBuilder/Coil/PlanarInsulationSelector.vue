<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { toTitleCase, checkAndFixMas, deepCopy, range } from '/WebSharedComponents/assets/js/utils.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
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
        const forceUpdate = 0;
        return {
            forceUpdate
        }
    },
    computed: {
        styleTooltip() {
            const relative_placement = 'top';
            return {
                theme: {
                    placement: relative_placement,
                    'transition-delay': '1s',
                    width: '300px',
                    "text-align": "start",
                },
            }
        },
    },
    watch: {
        'data': {
            handler(newValue, oldValue) {
                this.forceUpdate += 1;
            }
        }
    },
    methods: {}
}
</script>

<template>
    <div class="container p-0" v-tooltip="styleTooltip">
        <Dimension class="col-12 text-start"
            v-tooltip="tooltipsMagneticBuilder.coreToLayerDistance"
            v-if="!loading"
            :disabled="readOnly"
            :name="'coreToLayerDistance'"
            :unit="'m'"
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
