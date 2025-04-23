<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'

</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        gap: {
            type: Object,
            required: true,
        },
        readOnly: {
            type: Boolean,
            default: true,
        },
        forceUpdate: {
            type: Number,
            default: 0,
        },
        enableRemoveButton: {
            type: Boolean,
            default: false,
        }
    },
    data() {
        const errorMessage = "";
        const reluctanceData = {};
        const tooMuchFringingFactor = false;

        return {
            errorMessage,
            reluctanceData,
            tooMuchFringingFactor,
        }
    },
    watch: { 
        'gap': {
            handler(newValue, oldValue) {
                this.calculateGapReluctance();
            },
          deep: true
        },

    },
    created () {
    },
    mounted () {
        this.calculateGapReluctance();
    },
    methods: {
        calculateGapReluctance() {
            this.$mkf.ready.then(_ => {
                var result = this.$mkf.calculate_gap_reluctance(JSON.stringify(this.gap), this.$userStore.selectedModels['gapReluctance']);
                if (result.startsWith("Exception")) {
                    console.error(result);
                }
                else {
                    this.reluctanceData = JSON.parse(result);
                    this.tooMuchFringingFactor = this.reluctanceData.fringingFactor > 1.25;
                }
            })
        }
    },
    computed: {
    }
}
</script>

<template>
    <div class="container border rounded-4 px-4 py-2">
        <DimensionReadOnly 
            v-if="readOnly && gap != null && gap.length != null"
            class="col-12 px-0 mx-0 my-2"
            :replaceTitle="'Length'"
            :name="'length'"
            :unit="'m'"
            :dataTestLabel="dataTestLabel + '-Length'"
            :numberDecimals="2"
            :value="gap.length"
            :useTitleCase="false"
            :disableShortenLabels="true"
            :labelWidthProportionClass="'col-6'"
            :valueWidthProportionClass="'col-6'"
            :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelBgColor="{'background': 'transparent'}"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="tooMuchFringingFactor? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
        />
        <Dimension 
            v-if="!readOnly && gap != null && gap.length != null"
            :name="'length'"
            :unit="'m'"
            class="col-12 mb-1 text-start"
            :dataTestLabel="dataTestLabel + '-Length'"
            :justifyContent="true"
            :allowNegative="false"
            :allowZero="true"
            :min="0.000001"
            :max="1"
            :modelValue="gap"
            :forceUpdate="forceUpdate"
            :labelWidthProportionClass="'col-sm-12 col-md-4'"
            :valueWidthProportionClass="'col-sm-12 col-md-8'"
            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelBgColor="{'background': 'transparent'}"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="$styleStore.magneticBuilder.inputTextColor"
            @update="$emit('gapLengthChanged', $event)"
        />
        <Dimension 
            v-if="!readOnly && gap != null && gap.coordinates != null"
            :name="'1'"
            :replaceTitle="'Height'"
            :unit="'m'"
            class="col-12 mb-1 text-start"
            :dataTestLabel="dataTestLabel + '-Length'"
            :justifyContent="true"
            :allowNegative="true"
            :allowZero="true"
            :min="0.000001"
            :max="1"
            :modelValue="gap.coordinates"
            :forceUpdate="forceUpdate"
            :labelWidthProportionClass="'col-sm-12 col-md-4'"
            :valueWidthProportionClass="'col-sm-12 col-md-8'"
            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelBgColor="{'background': 'transparent'}"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="$styleStore.magneticBuilder.inputTextColor"
            @update="$emit('gapHeightChanged', $event)"
        />
        <DimensionReadOnly 
            v-if="!readOnly && reluctanceData.fringingFactor != null"
            class="col-12 px-0 mx-0"
            :replaceTitle="'Fringing factor'"
            :name="'fringingFactor'"
            :unit="'%'"
            :power="1"
            :visualScale="100"
            :dataTestLabel="dataTestLabel + '-FringingFactor'"
            :numberDecimals="2"
            :value="reluctanceData.fringingFactor"
            :useTitleCase="false"
            :disableShortenLabels="true"
            :labelWidthProportionClass="'col-7'"
            :valueWidthProportionClass="'col-5'"
            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelBgColor="{'background': 'transparent'}"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="tooMuchFringingFactor? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
        />
        <button
            v-if="enableRemoveButton"
            :style="$styleStore.magneticBuilder.removeButton"
            :data-cy="dataTestLabel + 'add-gap-button'"
            class="btn col-12 py-0"
            @click="$emit('removeGap')"

        >
            {{'Remove gap'}}
        </button>
        <slot/>
    </div>
</template>
