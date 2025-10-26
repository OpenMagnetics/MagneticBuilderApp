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
            if (this.core['functionalDescription']['shape'] != "" && this.core['functionalDescription']['material'] != "") {
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
                    this.coreLossesData = JSON.parse(this.$mkf.calculate_core_losses(JSON.stringify(this.masStore.mas.magnetic.core),
                                                                                JSON.stringify(this.masStore.mas.magnetic.coil),
                                                                                JSON.stringify(this.masStore.mas.inputs),
                                                                                JSON.stringify(modelsData), 
                                                                                this.operatingPointIndex));
                    this.coreTemperatureDependantParametersData = JSON.parse(this.$mkf.get_core_temperature_dependant_parameters(JSON.stringify(this.masStore.mas.magnetic.core), 25));
                    // this.coreTemperatureDependantParametersData = JSON.parse(this.$mkf.get_core_temperature_dependant_parameters(JSON.stringify(this.masStore.mas.magnetic.core), this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].conditions.ambientTemperature));

                    this.coreTemperatureDependantParametersData["saturationProportion"] = this.coreLossesData.magneticFluxDensityPeak / this.coreTemperatureDependantParametersData.magneticFluxDensitySaturation * 100;


                    this.magnetizingInductance = JSON.parse(this.$mkf.calculate_inductance_from_number_turns_and_gapping(JSON.stringify(this.masStore.mas.magnetic.core),
                                                                                                             JSON.stringify(this.masStore.mas.magnetic.coil),
                                                                                                             JSON.stringify(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex]),
                                                                                                             JSON.stringify(modelsData)));

                    this.magnetizingInductanceCheck = this.$mkf.check_requirement(JSON.stringify(this.masStore.mas.inputs.designRequirements.magnetizingInductance), this.magnetizingInductance);
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