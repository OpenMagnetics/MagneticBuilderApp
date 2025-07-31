<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { toTitleCase, checkAndFixMas, deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import SectionSelector from './SectionSelector.vue'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        data: {
            type: Object,
            default: 0,
        },
        showInsulationOptions: {
            type: Boolean,
            default: false,
        },
        masStore: {
            type: Object,
            required: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const forceUpdate = 0;
        const blockingRebounds = false;
        const selectedSectionIndex = 0;
        const topOrLeftMarginErrorMessage = "";
        const bottomOrRightMarginErrorMessage = "";

        return {
            forceUpdate,
            blockingRebounds,
            selectedSectionIndex,
            topOrLeftMarginErrorMessage,
            bottomOrRightMarginErrorMessage,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    "text-align": "start",
                },
            }
        },
        topOrLeftMarginTooltip() {
            if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == 'contiguous') {
                return tooltipsMagneticBuilder.leftMargin;
            }
            else {
                return tooltipsMagneticBuilder.topMargin;
            }
        },
        bottomOrRightMarginTooltip() {
            if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == 'contiguous') {
                return tooltipsMagneticBuilder.rightMargin;
            }
            else {
                return tooltipsMagneticBuilder.bottomMargin;
            }
        },
    },
    watch: {
    },
    mounted () {
    },
    methods: {
        interlayerThicknessUpdated(value) {
            if (!this.blockingRebounds) {
                this.$emit('marginUpdated');
            }
        },
        intersectionThicknessUpdated(value) {
            if (!this.blockingRebounds) {
                this.$emit('marginUpdated');
            }
        },
        topOrInnerMarginUpdated(sectionIndex) {
            if (!this.blockingRebounds) {
                this.$mkf.ready.then(_ => {
                    const isMarginHorizontal = this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == "contiguous";
                    const fits = this.$mkf.check_if_fits(JSON.stringify(this.masStore.mas.magnetic.coil.bobbin), this.data.dataPerSection[sectionIndex].topOrLeftMargin, isMarginHorizontal);

                    if (fits) {
                        this.$emit('marginUpdated', sectionIndex);
                        this.topOrLeftMarginErrorMessage = "";
                    }
                    else{
                        this.topOrLeftMarginErrorMessage = "Margin is larger than winding window";
                    }
                });
            }
        },
        bottomOrOuterMarginUpdated(sectionIndex) {
            if (!this.blockingRebounds) {
                this.$mkf.ready.then(_ => {
                    const isMarginHorizontal = this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == "contiguous";
                    const fits = this.$mkf.check_if_fits(JSON.stringify(this.masStore.mas.magnetic.coil.bobbin), this.data.dataPerSection[sectionIndex].bottomOrRightMargin, isMarginHorizontal);

                    if (fits) {
                        this.$emit('marginUpdated', sectionIndex);
                        this.bottomOrRightMarginErrorMessage = "";
                    }
                    else{
                        this.bottomOrRightMarginErrorMessage = "Margin is larger than winding window";
                    }
                });
            }
        },
        sectionIndexChanged(sectionIndex) {
            this.selectedSectionIndex = sectionIndex;
            this.forceUpdate += 1;
            this.blockingRebounds = true;
            setTimeout(() => this.blockingRebounds = false, 10);
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row ms-1" v-tooltip="styleTooltip">
            <Dimension 
                v-if="showInsulationOptions"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :name="'interlayerThickness'"
                :replaceTitle="'Inter-layer ins. thickness'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-InterlayerThickness'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1e-3"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="interlayerThicknessUpdated"
            />
            <Dimension 
                v-if="showInsulationOptions"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :name="'intersectionThickness'"
                :replaceTitle="'Inter-section ins. thickness'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-IntersectionThickness'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="intersectionThicknessUpdated"
            />
            <SectionSelector
                v-show="showInsulationOptions" 
                :sectionIndex="selectedSectionIndex"
                :masStore="masStore"
                @sectionIndexChanged="sectionIndexChanged"
            />

            <Dimension 
                v-tooltip="topOrLeftMarginTooltip"
                v-if="showInsulationOptions"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :name="'topOrLeftMargin'"
                :replaceTitle="'Top Margin'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-TopOrLeftMargin'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data.dataPerSection[selectedSectionIndex]"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="topOrInnerMarginUpdated(selectedSectionIndex)"
            />
            <label :data-cy="dataTestLabel + '-TopOrLeftMarginErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{topOrLeftMarginErrorMessage}}</label>

            <Dimension
                v-tooltip="bottomOrRightMarginTooltip"
                v-if="showInsulationOptions"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :name="'bottomOrRightMargin'"
                :replaceTitle="'Bottom Margin'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-BottomOrRightMargin'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data.dataPerSection[selectedSectionIndex]"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="bottomOrOuterMarginUpdated(selectedSectionIndex)"
            />
            <label :data-cy="dataTestLabel + '-BottomOrRightMarginErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{bottomOrRightMarginErrorMessage}}</label>
        </div>
    </div>
</template>
