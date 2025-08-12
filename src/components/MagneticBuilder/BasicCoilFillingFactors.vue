<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
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
        masStore: {
            type: Object,
            required: true,
        },
        data: {
            type: Object,
            default: 0,
        },
    },
    data() {
        return {
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'left'
            return {
                theme: {
                    placement: relative_placement,
                    "text-align": "start",
                },
            }
        },
        contiguousLabel() {
            try {
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].shape == "rectangular") {
                    return "height";
                }
                else {
                    return "angle";
                }

            }
            catch (e) {
                return "height"
            }
        },
        overlappingLabel() {
            try {
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].shape == "rectangular") {
                    return "width";
                }
                else {
                    return "radial";
                }

            }
            catch (e) {
                return "width"
            }
        }
    },
    watch: {
        showAlignmentOptions(newValue, oldValue) {
            this.forceUpdate += 1;
            this.blockingRebounds = true;
            setTimeout(() => this.blockingRebounds = false, 10);
        },
    },
    mounted () {
    },
    methods: {}
}
</script>

<template>
    <div class="container p-0">
        <div class="row text-start"  ref="coilSelectorContainer" v-tooltip="styleTooltip">
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.areaFillingFactor"
                class="col-6 pe-4 ps-4 mt-1"
                :name="'Fill. F'"
                :subscriptName="'area'"
                :unit="'%'"
                :power="1"
                :visualScale="100"
                :dataTestLabel="dataTestLabel + '-FillingFactor'"
                :numberDecimals="2"
                :value="data.fillingFactors.areaFillingFactor"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-6'"
                :valueWidthProportionClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="data.fillingFactors.areaFillingFactor < 0.8? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />  
            <DimensionReadOnly 
                v-if="data.sectionsOrientation == 'contiguous'" 
                v-tooltip="tooltipsMagneticBuilder.contiguousFillingFactor"
                class="col-6 pe-4 ps-4 mt-1"
                :name="'Fill. F'"
                :subscriptName="contiguousLabel"
                :unit="'%'"
                :power="1"
                :visualScale="100"
                :dataTestLabel="dataTestLabel + '-FillingFactor'"
                :numberDecimals="2"
                :value="data.fillingFactors.contiguousFillingFactor"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="data.fillingFactors.contiguousFillingFactor < 0.8? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />  
            <DimensionReadOnly 
                v-if="data.sectionsOrientation == 'overlapping'" 
                v-tooltip="tooltipsMagneticBuilder.overlappingFillingFactor"
                class="col-6 pe-4 ps-4 mt-1"
                :name="'Fill. F'"
                :subscriptName="overlappingLabel"
                :unit="'%'"
                :power="1"
                :visualScale="100"
                :dataTestLabel="dataTestLabel + '-FillingFactor'"
                :numberDecimals="2"
                :value="data.fillingFactors.overlappingFillingFactor"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="data.fillingFactors.overlappingFillingFactor < 0.8? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />        
        </div>
    </div>
</template>
