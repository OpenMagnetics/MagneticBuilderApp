<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import { wireMaterialDefault } from '/WebSharedComponents/assets/js/defaults.js'
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
        advancedMode: {
            type: Boolean,
            default: true,
        },
        enableAutoSimulation: {
            type: Boolean,
            default: true,
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
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.calculateWireData();
            },
          deep: true
        },
        'enableAutoSimulation': {
            handler(newValue, oldValue) {
                // When auto-simulation is turned off, mark data as outdated
                // so the user knows they need to manually resimulate
                if (!newValue) {
                    this.dataUptoDate = false;
                }
            },
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
                if (name == "windingIndexChanged") {
                    if (args[0]) {
                        this.computeIfCompliesWithTurnsRatio();
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
                if (name == "newWireCreated") {
                    if (args[0]) {
                        this.dataUptoDate = false;
                        if (this.enableAutoSimulation) {
                            this.calculateWireData();
                        }
                    }
                    else {
                        console.error(args[1])
                    }
                }
            });
        }))

        // Listen for global resimulate action from stateStore
        this.subscriptions.push(this.$stateStore.$onAction(({name, after}) => {
            after(() => {
                if (name == "resimulate") {
                    this.calculateWireData();
                }
            });
        }))

        if (this.enableAutoSimulation) {
            this.calculateWireData();
        }
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
                    this.dataUptoDate = true;
                }
                , this.$settingsStore.waitingTimeAfterChange);
            }
        },
        computeIfCompliesWithTurnsRatio() {
            if (this.windingIndex > 0) {
                this.taskQueueStore.checkRequirement(this.masStore.mas.inputs.designRequirements.turnsRatios[this.windingIndex - 1], this.turnsRatio).then((check) => {
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
    <div v-if="advancedMode" class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div
            class="row ps-2"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.dcResistancePerMeter"
                class="col-6 ps-3 pe-5"
                :name="'R'"
                :subscriptName="'DC'"
                :unit="'Ω/m'"
                :dataTestLabel="dataTestLabel + '-Rdc'"
                :numberDecimals="2"
                :value="dcResistancePerMeter"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.skinResistancePerMeter"
                :class="'border-start'"
                class="col-6 ps-3 pe-5"
                :name="'R'"
                :subscriptName="'sk.AC'"
                :unit="'Ω/m'"
                :dataTestLabel="dataTestLabel + '-Rac'"
                :numberDecimals="2"
                :value="skinAcResistancePerMeter"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.ohmicLossesPerMeter"
                class="col-6 ps-3 pe-5"
                :name="'P'"
                :subscriptName="'DC'"
                :unit="'W/m'"
                :dataTestLabel="dataTestLabel + '-Pdc'"
                :numberDecimals="2"
                :value="dcLossesPerMeter"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.skinLossesPermeter"
                :class="'border-start'"
                class="col-6 ps-3 pe-5"
                :name="'P'"
                :subscriptName="'sk.AC'"
                :unit="'W/m'"
                :dataTestLabel="dataTestLabel + '-Pac'"
                :numberDecimals="2"
                :value="skinAcLossesPerMeter"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveCurrentDensity"
                class="col-6 ps-3 pe-5"
                :name="'J'"
                :subscriptName="'eff'"
                :unit="'A/mm²'"
                :dataTestLabel="dataTestLabel + '-Jeff'"
                :numberDecimals="2"
                :value="effectiveCurrentDensity"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="tooMuchCurrentDensity? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveSkinDepth"
                :class="'border-start'"
                class="col-6 ps-3 pe-5"
                :name="'δ'"
                :subscriptName="'eff'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-EffectiveSkinDepth'"
                :numberDecimals="2"
                :value="effectiveSkinDepth"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.wireWidth"
                class="col-6 ps-3 pe-5"
                :name="'Width'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-OuterWidth'"
                :numberDecimals="2"
                :value="outerDimensions[0]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="fitsOuterDimensionsWidth? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.skinFactor"
                :class="'border-start'"
                class="col-6 ps-3 pe-5"
                :name="'F'"
                :subscriptName="'skin'"
                :unit="null"
                :dataTestLabel="dataTestLabel + '-EffectiveSkinAcFactor'"
                :numberDecimals="2"
                :value="skinAcFactor"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="tooMuchSkinAcFactor? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.wireHeight"
                class="col-6 ps-3 pe-5"
                :name="'Height'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-OuterHeight'"
                :numberDecimals="2"
                :value="outerDimensions[1]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="fitsOuterDimensionsHeight? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.turnsRatio"
                :class="'border-start'"
                class="col-6 ps-3 pe-5"
                v-if="windingIndex > 0"
                :name="'T'"
                :subscriptName="'ratio'"
                :unit="null"
                :dataTestLabel="dataTestLabel + '-TurnsRatio'"
                :numberDecimals="2"
                :value="turnsRatio"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="compliesWithTurnsRatio? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />


        </div>
    </div>
    <div v-else class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div
            class="row"
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