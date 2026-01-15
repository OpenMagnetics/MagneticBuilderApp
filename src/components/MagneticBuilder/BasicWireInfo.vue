<script setup>
import { removeTrailingZeroes, deepCopy, checkAndFixMas, isMobile } from '/WebSharedComponents/assets/js/utils.js'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import { wireMaterialDefault } from '/WebSharedComponents/assets/js/defaults.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import { useTaskQueueStore } from '../../stores/taskQueue'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        wire: {
            type: [String, Object],
            required: true,
        },
        windingIndex: {
            type: Number,
            default: 0,
        },
        masStore: {
            type: Object,
            required: true,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const dcResistancePerMeter = 0;
        const skinAcResistancePerMeter = 0;
        const skinAcFactor = 0;
        const dcLossesPerMeter = 0;
        const skinAcLossesPerMeter = 0;
        const outerDimensions = 0;
        const effectiveCurrentDensity = 0;
        const effectiveSkinDepth = 0;
        const turnsRatio = 1;
        const compliesWithTurnsRatio = true;
        const recentChange = false;
        const tryingToSend = false;
        const dataUptoDate = false;
        const subscriptions = [];

        return {
            taskQueueStore,
            dcResistancePerMeter,
            skinAcResistancePerMeter,
            skinAcFactor,
            dcLossesPerMeter,
            skinAcLossesPerMeter,
            outerDimensions,
            effectiveCurrentDensity,
            effectiveSkinDepth,
            turnsRatio,
            compliesWithTurnsRatio,
            recentChange,
            tryingToSend,
            dataUptoDate,
            subscriptions,
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
                    "text-align": "start",
                },
            }
        },
        tooMuchCurrentDensity() {
            return this.effectiveCurrentDensity > 12;
        },
        tooMuchSkinAcFactor() {
            return this.skinAcFactor > 2;
        },
        fitsOuterDimensionsWidth() {
            if (this.masStore.mas.magnetic.coil.bobbin != "Dummy") {
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].width != null) {
                    if (this.outerDimensions[0] < this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].width) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].radialHeight != null) {
                    if (this.outerDimensions[0] < this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].radialHeight / 2) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }
            return true;
        },
        fitsOuterDimensionsHeight() {
            if (this.masStore.mas.magnetic.coil.bobbin != "Dummy") {
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].height != null) {
                    if (this.outerDimensions[0] < this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].height) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].radialHeight != null) {
                    if (this.outerDimensions[0] < this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].radialHeight / 2) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }
            return true;
        },
    },
    watch: {
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.recentChange = true;
                this.tryToSimulate();
            },
          deep: true
        },
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.calculateWireData();
            },
          deep: true
        },
    },
    mounted () {

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "masCheckedAndFixed") {
                    if (args[0]) {
                        this.masStore.mas = args[1];
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "wireDataCalculated") {
                    if (args[0]) {
                        const data = args[1];

                        this.turnsRatio = data.turnsRatio;
                        this.dcResistancePerMeter = data.dcResistancePerMeter;
                        this.skinAcResistancePerMeter = data.skinAcResistancePerMeter;
                        this.skinAcFactor = data.skinAcFactor;
                        this.dcLossesPerMeter = data.dcLossesPerMeter;
                        this.skinAcLossesPerMeter = data.skinAcLossesPerMeter;
                        this.outerDimensions = data.outerDimensions;
                        this.effectiveCurrentDensity = data.effectiveCurrentDensity;
                        this.effectiveSkinDepth = data.effectiveSkinDepth;

                        this.computeIfCompliesWithTurnsRatio();
                        this.dataUptoDate = true;
                    }
                    else {
                        console.error(args[1])
                    }
                }
            });
        }))
        this.calculateWireData();
        this.taskQueueStore.checkAndFixMas(this.masStore.mas);
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        tryToSimulate() {
            if (!this.tryingToSend) {
                this.recentChange = false;
                this.dataUptoDate = false;
                this.tryingToSend = true;
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToSend = false;
                        this.tryToSimulate();
                    }
                    else {
                        this.calculateWireData();
                        this.tryingToSend = false;
                    }
                }
                , this.$settingsStore.waitingTimeAfterChange);
            }
        },
        computeIfCompliesWithTurnsRatio() {
            if (this.windingIndex > 0) {
                this.taskQueueStore.checkRequirement(this.masStore.mas.inputs.designRequirements.turnsRatios[this.windingIndex - 1], this.turnsRatio).response((check) => {
                    this.compliesWithTurnsRatio = check;
                })
            }
            else {
                this.compliesWithTurnsRatio = true;
            }
        },
        calculateWireData() {
            if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" &&
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy" &&
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != null) {

                this.taskQueueStore.calculateWireData(this.masStore.mas.magnetic.coil, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex], this.windingIndex)
            }
        },
    }
}
</script>

<template>
    <div class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div
            class="row"
            v-tooltip="styleTooltip"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveCurrentDensity"
                class="col-12 ps-4 pe-4"
                :name="'Eff. Current Density'"
                :unit="'A/mm²'"
                :dataTestLabel="dataTestLabel + '-Jeff'"
                :numberDecimals="2"
                :value="effectiveCurrentDensity"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="tooMuchCurrentDensity? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveSkinDepth"
                class="col-12 ps-4 pe-4"
                :name="'Eff. Skin Depth'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-EffectiveSkinDepth'"
                :numberDecimals="2"
                :value="effectiveSkinDepth"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.wireWidth"
                class="col-12 ps-4 pe-4"
                :name="'Outer Width'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-OuterWidth'"
                :numberDecimals="2"
                :value="outerDimensions[0]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="fitsOuterDimensionsWidth? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.wireHeight"
                class="col-12 ps-4 pe-4"
                :name="'Outer Height'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-OuterHeight'"
                :numberDecimals="2"
                :value="outerDimensions[1]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="fitsOuterDimensionsHeight? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.turnsRatio"
                class="col-12 ps-4 pe-4"
                v-if="windingIndex > 0"
                :name="'Turns Ratio'"
                :unit="null"
                :dataTestLabel="dataTestLabel + '-TurnsRatio'"
                :numberDecimals="2"
                :value="turnsRatio"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="compliesWithTurnsRatio? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />


        </div>
    </div>
</template>