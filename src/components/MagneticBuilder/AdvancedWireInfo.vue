<script setup>
import { removeTrailingZeroes, deepCopy, checkAndFixMas, isMobile } from '/WebSharedComponents/assets/js/utils.js'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import { wireMaterialDefault } from '/WebSharedComponents/assets/js/defaults.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
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

        return {
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
        this.calculateWireData();
        checkAndFixMas(this.masStore.mas, this.$mkf).then(response => {
            this.masStore.mas = response;
        })
        .catch(error => {
            console.error(error.data)
        });
    },
    methods: {
        tryToSimulate() {
            if (!this.tryingToSend) {
                this.recentChange = false;
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
            this.$mkf.ready.then(_ => {
                if (this.windingIndex > 0) {
                    this.turnsRatioCheck = this.$mkf.check_requirement(JSON.stringify(this.masStore.mas.inputs.designRequirements.turnsRatios[this.windingIndex - 1]), this.turnsRatio);
                    if (this.turnsRatioCheck) {
                        this.compliesWithTurnsRatio = true;
                    }
                    else {
                        this.compliesWithTurnsRatio = false;
                    }
                }
                else {
                    this.compliesWithTurnsRatio = true;
                }
            })
        },
        calculateWireData() {
            if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" &&
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy" &&
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != null) {
                this.$mkf.ready.then(_ => {
                    console.log("Wire simulation")
                    const wireString = JSON.stringify(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
                    const currentString = JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding[this.windingIndex].current);
                    var wireMaterial = wireMaterialDefault;
                    if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire.material != null) {
                        wireMaterial = this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire.material;
                    }

                    this.turnsRatio = this.masStore.mas.magnetic.coil.functionalDescription[0].numberTurns / this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].numberTurns;

                    this.dcResistancePerMeter = this.$mkf.calculate_dc_resistance_per_meter(wireString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);

                    this.skinAcResistancePerMeter = this.$mkf.calculate_skin_ac_resistance_per_meter(wireString, currentString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);

                    this.skinAcFactor = this.$mkf.calculate_skin_ac_factor(wireString, currentString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);

                    this.dcLossesPerMeter = this.$mkf.calculate_dc_losses_per_meter(wireString, currentString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);

                    this.skinAcLossesPerMeter = this.$mkf.calculate_skin_ac_losses_per_meter(wireString, currentString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);

                    const outerDimensionsHandle = this.$mkf.get_outer_dimensions(wireString);
                    this.outerDimensions = [outerDimensionsHandle.get(0), outerDimensionsHandle.get(1)];

                    this.effectiveCurrentDensity = this.$mkf.calculate_effective_current_density(wireString, currentString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature) / 1000000 / this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].numberParallels;

                    this.effectiveSkinDepth = this.$mkf.calculate_effective_skin_depth(wireMaterial, currentString, this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);

                    this.computeIfCompliesWithTurnsRatio();
                }).catch(error => {
                    console.error(error);
                });
            }
        },
    }
}
</script>

<template>
    <div class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div class="row" v-tooltip="styleTooltip">
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.dcResistancePerMeter"
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 ps-3 pe-4"
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
</template>