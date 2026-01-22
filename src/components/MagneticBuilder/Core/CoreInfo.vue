<script setup>
import { removeTrailingZeroes, deepCopy, isMobile} from '/WebSharedComponents/assets/js/utils.js'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
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
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const coreTemperatureDependantParametersData = {};
        const coreEffectiveParameters = {};
        const coreLossesData = {};
        const magnetizingInductance = 0;
        const magnetizingInductanceCheck = false;
        const recentChange = false;
        const tryingToSend = false;
        const dataUptoDate = false;
        const subscriptions = [];

        return {
            taskQueueStore,
            coreTemperatureDependantParametersData,
            coreEffectiveParameters,
            coreLossesData,
            magnetizingInductance,
            magnetizingInductanceCheck,
            recentChange,
            tryingToSend,
            dataUptoDate,
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
                    "text-align": "start",
                },
            }
        },
        closeOrOverSaturation() {
            return (this.coreLossesData.magneticFluxDensityPeak / this.coreTemperatureDependantParametersData.magneticFluxDensitySaturation) > 0.85;
        },
    },
    watch: {
    },
    mounted () {
        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "processCore") {
                    this.dataUptoDate = false;
                }
                if (name == "calculateCoreLosses") {
                    this.dataUptoDate = false;
                }
                if (name == "coreProcessed") {
                    if (args[0]) {
                        const core = args[1];
                        this.coreEffectiveParameters = core.processedDescription.effectiveParameters;
                        this.dataUptoDate = false;
                        this.calculateCoreLosses();
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "numberTurnsUpdated") {
                    if (args[0]) {
                        this.dataUptoDate = false;
                        this.calculateCoreLosses();
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreMaterialChanged") {
                    if (args[0]) {
                        this.dataUptoDate = false;
                        this.calculateCoreLosses();
                    }
                    else {
                        console.error(args[1])
                    }
                }
            });
        }))

    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        calculateCoreLosses() {
            const modelsData = {
                coreLosses: this.$userStore.selectedModels['coreLosses'] || Defaults.coreLossesModelDefault,
                coreTemperature: this.$userStore.selectedModels['coreTemperature'] || Defaults.coreTemperatureModelDefault,
                gapReluctance: this.$userStore.selectedModels['gapReluctance'] || Defaults.reluctanceModelDefault
            };
            if (this.masStore.mas.magnetic.core['functionalDescription']['shape'] != "" && this.masStore.mas.magnetic.core['functionalDescription']['material'] != "") {
                this.taskQueueStore.calculateCoreLosses(this.masStore.mas.magnetic, this.masStore.mas.inputs, this.operatingPointIndex, modelsData).then((data) => {
                    this.coreTemperatureDependantParametersData = data.coreTemperatureDependantParametersData;
                    this.magnetizingInductance = data.magnetizingInductance;
                    this.coreLossesData = data.coreLossesData;
                    this.magnetizingInductanceCheck = data.magnetizingInductanceCheck;
                    this.dataUptoDate = true;
                })
                .catch(error => {
                    console.error(error);
                });
            }
        },
    }
}
</script>

<template>
    <div v-if="advancedMode" class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div
            v-if="coreEffectiveParameters.effectiveLength != null"
            class="row ps-2"
            v-tooltip="styleTooltip"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveLength"
                class="col-6 pe-4 ps-3"
                :name="'L'"
                :subscriptName="'eff'"
                :unit="'m'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-EffectiveLength'"
                :numberDecimals="2"
                :value="coreEffectiveParameters.effectiveLength"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveArea"
                :class="'border-start'"
                class="col-6 pe-4 ps-3"
                :name="'A'"
                :subscriptName="'eff'"
                :unit="'m²'"
                :power="2"
                :dataTestLabel="dataTestLabel + '-EffectiveArea'"
                :numberDecimals="1"
                :value="coreEffectiveParameters.effectiveArea"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveVolume"
                class="col-6 pe-4 ps-3"
                :name="'V'"
                :subscriptName="'eff'"
                :unit="'m³'"
                :power="3"
                :dataTestLabel="dataTestLabel + '-EffectiveVolume'"
                :numberDecimals="1"
                :value="coreEffectiveParameters.effectiveVolume"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.minimumArea"
                :class="'border-start'"
                class="col-6 pe-4 ps-3"
                :name="'A'"
                :subscriptName="'min'"
                :unit="'m²'"
                :power="2"
                :dataTestLabel="dataTestLabel + '-MinimumArea'"
                :numberDecimals="1"
                :value="coreEffectiveParameters.minimumArea"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.initialPermeability"
                class="col-6 pe-4 ps-3"
                :name="'μ'"
                :subscriptName="'ini'"
                :unit="null"
                :power="1"
                :dataTestLabel="dataTestLabel + '-InitialPermeability'"
                :numberDecimals="0"
                :value="coreTemperatureDependantParametersData.initialPermeability"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectivePermeability"
                :class="'border-start'"
                class="col-6 pe-4 ps-3"
                :name="'μ'"
                :subscriptName="'eff'"
                :unit="null"
                :power="1"
                :dataTestLabel="dataTestLabel + '-EffectivePermeability'"
                :numberDecimals="0"
                :value="coreTemperatureDependantParametersData.effectivePermeability"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.permeance"
                class="col-6 pe-4 ps-3"
                :name="'A'"
                :subscriptName="'L'"
                :unit="'H/tu²'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-Permeance'"
                :numberDecimals="0"
                :value="coreTemperatureDependantParametersData.permeance"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.saturatingMagneticFluxDensity"
                :class="'border-start'"
                class="col-6 pe-4 ps-3"
                :name="'B'"
                :subscriptName="'sat'"
                :unit="'T'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-MagneticFluxDensitySaturation'"
                :numberDecimals="3"
                :value="coreTemperatureDependantParametersData.magneticFluxDensitySaturation"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.magneticFluxDensityPeak"
                class="col-6 pe-4 ps-3"
                :name="'B'"
                :subscriptName="'peak'"
                :unit="'T'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-MagneticFluxDensityPeak'"
                :numberDecimals="3"
                :value="coreLossesData.magneticFluxDensityPeak"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="closeOrOverSaturation? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.magneticFluxDensityAcPeak"
                :class="'border-start'"
                class="col-6 pe-4 ps-3"
                :name="'B'"
                :subscriptName="'ACpeak'"
                :unit="'T'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-MagneticFluxDensityAcPeak'"
                :numberDecimals="3"
                :value="coreLossesData.magneticFluxDensityAcPeak"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="closeOrOverSaturation? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.magnetizingInductance"
                class="col-6 pe-4 ps-3"
                :name="'L'"
                :unit="'H'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-MagnetizingInductance'"
                :numberDecimals="2"
                :value="magnetizingInductance"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="magnetizingInductanceCheck? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.coreLosses"
                :class="'border-start'"
                class="col-6 pe-4 ps-3"
                :name="'P'"
                :subscriptName="'core'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-CoreLosses'"
                :numberDecimals="2"
                :value="coreLossesData.coreLosses"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-3'"
                :valueWidthProportionClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

        </div>
    </div>
    <div v-else class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div
            v-if="coreEffectiveParameters.effectiveLength != null"
            class="row"
            v-tooltip="styleTooltip"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.magnetizingInductance"
                class="col-12 pe-4 ps-4"
                :name="'L'"
                :replaceTitle="'Magnetizing Inductance'"
                :unit="'H'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-MagnetizingInductance'"
                :numberDecimals="2"
                :value="magnetizingInductance"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="magnetizingInductanceCheck? $styleStore.magneticBuilder.inputTextColor : $styleStore.magneticBuilder.inputLabelDangerBgColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.coreLosses"
                class="col-12 pe-4 ps-4"
                :replaceTitle="'Core Losses'"
                :name="'P'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-CoreLosses'"
                :numberDecimals="2"
                :value="coreLossesData.coreLosses"
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
                v-tooltip="tooltipsMagneticBuilder.saturationProportion"
                class="col-12 pe-4 ps-4"
                :name="'Saturation Proportion'"
                :unit="'%'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-SaturationProportion'"
                :numberDecimals="2"
                :value="coreTemperatureDependantParametersData.saturationProportion"
                :useTitleCase="false"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="closeOrOverSaturation? $styleStore.magneticBuilder.inputLabelDangerBgColor : $styleStore.magneticBuilder.inputTextColor"
            />

        </div>
    </div>
</template>