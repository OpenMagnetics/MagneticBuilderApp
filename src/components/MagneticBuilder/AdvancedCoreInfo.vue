<script setup>
import { removeTrailingZeroes, deepCopy, isMobile} from '/WebSharedComponents/assets/js/utils.js'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        core: {
            type: Object,
            required: true,
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
        const coreTemperatureDependantParametersData = {};
        const coreLossesData = {};
        const magnetizingInductance = 0;
        const magnetizingInductanceCheck = false;
        const recentChange = false;
        const tryingToSend = false;
        const dataUptoDate = false;

        return {
            coreTemperatureDependantParametersData,
            coreLossesData,
            magnetizingInductance,
            magnetizingInductanceCheck,
            recentChange,
            tryingToSend,
            dataUptoDate,
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
        closeOrOverSaturation() {
            return (this.coreLossesData.magneticFluxDensityPeak / this.coreTemperatureDependantParametersData.magneticFluxDensitySaturation) > 0.85;
        },
    },
    watch: {
        'core': {
            handler(newValue, oldValue) {
                this.recentChange = true;
                this.tryToSimulate();
            },
          deep: true
        },
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.calculateCoreEffectiveParameters();
                this.calculateCoreLosses();
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                this.recentChange = true;
                this.tryToSimulate();
            },
          deep: true
        },
    },
    mounted () {
        this.calculateCoreEffectiveParameters();
        this.calculateCoreLosses();
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
                        this.calculateCoreEffectiveParameters();
                        this.calculateCoreLosses();
                        this.tryingToSend = false;
                        this.dataUptoDate = true;
                    }
                }
                , this.$settingsStore.waitingTimeAfterChange);
            }
        },
        calculateCoreEffectiveParameters() {
            if (this.core['functionalDescription']['shape'] != "") {
                if (this.core['processedDescription'] == null) {
                    this.$mkf.ready.then(_ => {

                        const aux = deepCopy(this.core);
                        aux['geometricalDescription'] = null;
                        aux['processedDescription'] = null;
                        if (typeof(aux['functionalDescription']['shape']) == "string") {
                            const result = this.$mkf.get_shape_data(aux['functionalDescription']['shape']);

                            if (result.startsWith("Exception")) {
                                console.error(result);
                                return;
                            }
                            else {
                                aux['functionalDescription']['shape'] = JSON.parse(result);
                            }

                        }
                        if (aux['functionalDescription']['shape']['family'] == "t") {
                            aux['functionalDescription']['type'] = "toroidal";
                            aux['functionalDescription']['gapping'] = [];
                        }
                        else {
                            aux['functionalDescription']['type'] = "two-piece set";
                        }

                        if (aux['functionalDescription']['shape']['familySubtype'] != "null" && aux['functionalDescription']['shape']['familySubtype'] != null) {
                            aux['functionalDescription']['shape']['familySubtype'] = String(aux['functionalDescription']['shape']['familySubtype']);
                        }
                        const coreJson = this.$mkf.calculate_core_data(JSON.stringify(aux), false);
                        if (coreJson.startsWith("Exception")) {
                            console.error(coreJson);
                            return;
                        }
                        else {
                            this.masStore.mas.magnetic.core = JSON.parse(coreJson);
                        }

                    }).catch(error => {
                        console.error(error);
                    });
                }
            }
        },
        calculateCoreLosses() {
            if (this.core['functionalDescription']['shape'] != "" && this.core['functionalDescription']['material'] != "") {
                this.$mkf.ready.then(_ => {
                    if (!('gapReluctance' in this.$userStore.selectedModels)) {
                        this.$userStore.selectedModels['gapReluctance'] = Defaults.reluctanceModelDefault
                    }
                    if (!('coreLosses' in this.$userStore.selectedModels)) {
                        this.$userStore.selectedModels['coreLosses'] = Defaults.coreLossesModelDefault
                    }
                    if (!('coreTemperature' in this.$userStore.selectedModels)) {
                        this.$userStore.selectedModels['coreTemperature'] = Defaults.coreTemperatureModelDefault
                    }
                    const modelsData = {coreLosses: this.$userStore.selectedModels['coreLosses'].toUpperCase(),
                                  coreTemperature: this.$userStore.selectedModels['coreTemperature'].toUpperCase(),
                                  gapReluctance: this.$userStore.selectedModels['gapReluctance'].toUpperCase().replace(" ", "_")};

                    {
                        const result = this.$mkf.get_core_temperature_dependant_parameters(JSON.stringify(this.masStore.mas.magnetic.core), this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature);
                        if (result.startsWith("Exception")) {
                            console.error(result);
                        }
                        else {
                            this.coreTemperatureDependantParametersData = JSON.parse(result);
                        }
                    }

                    {
                        const result = this.$mkf.calculate_inductance_from_number_turns_and_gapping(JSON.stringify(this.masStore.mas.magnetic.core), JSON.stringify(this.masStore.mas.magnetic.coil), JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex]), JSON.stringify(modelsData));
                        if (result == -1) {
                            console.error(result);
                        }
                        else {
                            this.magnetizingInductance = JSON.parse(result);
                        }
                    }

                    this.magnetizingInductanceCheck = this.$mkf.check_requirement(JSON.stringify(this.masStore.mas.inputs.designRequirements.magnetizingInductance), this.magnetizingInductance);
                    {
                        const result = this.$mkf.calculate_core_losses(JSON.stringify(this.masStore.mas.magnetic.core),
                                                                                    JSON.stringify(this.masStore.mas.magnetic.coil),
                                                                                    JSON.stringify(this.masStore.mas.inputs),
                                                                                    JSON.stringify(modelsData), 
                                                                                    this.operatingPointIndex);
                        if (result.startsWith("Exception")) {
                            console.error(result);
                        }
                        else {
                            this.coreLossesData = JSON.parse(result);
                        }
                    }
                }).catch(error => {
                    console.error("Error calculating core losses");
                    console.error(error);
                });
            }
        },
    }
}
</script>

<template>
    <div class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
        <div
            v-if="core.processedDescription != null"
            class="row"
            v-tooltip="styleTooltip"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveLength"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
                :name="'L'"
                :subscriptName="'eff'"
                :unit="'m'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-EffectiveLength'"
                :numberDecimals="2"
                :value="core.processedDescription.effectiveParameters.effectiveLength"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
                :name="'A'"
                :subscriptName="'eff'"
                :unit="'m²'"
                :power="2"
                :dataTestLabel="dataTestLabel + '-EffectiveArea'"
                :numberDecimals="1"
                :value="core.processedDescription.effectiveParameters.effectiveArea"
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
                class="col-xl-6 col-lg-12 pe-4 ps-3"
                :name="'V'"
                :subscriptName="'eff'"
                :unit="'m³'"
                :power="3"
                :dataTestLabel="dataTestLabel + '-EffectiveVolume'"
                :numberDecimals="1"
                :value="core.processedDescription.effectiveParameters.effectiveVolume"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
                :name="'A'"
                :subscriptName="'min'"
                :unit="'m²'"
                :power="2"
                :dataTestLabel="dataTestLabel + '-MinimumArea'"
                :numberDecimals="1"
                :value="core.processedDescription.effectiveParameters.minimumArea"
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
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
                :class="isMobile()? '' : 'border-start'"
                class="col-xl-6 col-lg-12 pe-4 ps-3"
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
</template>