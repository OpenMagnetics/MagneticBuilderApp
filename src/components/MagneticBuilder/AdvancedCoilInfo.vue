<script setup>
import { removeTrailingZeroes, deepCopy, isMobile } from '/WebSharedComponents/assets/js/utils.js'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import WindingSelector from './WindingSelector.vue'
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
        const outputsData = {};
        const selectedWindingIndex = 0;
        const loading = false;
        const recentChange = false;
        const tryingToSend = false;
        const lastSimulatedInputs = "";
        const lastSimulatedMagnetics = "";
        const lastSimulatedModels = "";
        const dataUptoDate = false;

        return {
            outputsData,
            selectedWindingIndex,
            recentChange,
            tryingToSend,
            loading,
            lastSimulatedInputs,
            lastSimulatedMagnetics,
            lastSimulatedModels,
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
                this.updateFields(this.masStore.mas.outputs);
            },
          deep: true
        },
        'masStore.mas.magnetic.coil.turnsDescription': {
            handler(newValue, oldValue) {
                if (newValue != null) {
                    this.recentChange = true;
                    this.tryToSimulate();
                }
            },
          deep: false
        },
    },
    mounted () {
        this.loading = true;
        this.recentChange = true;
        this.tryToSimulate();
    },
    methods: {
        tryToSimulate() {
            if (!this.tryingToSend) {
                this.recentChange = false
                this.dataUptoDate = false
                this.tryingToSend = true
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToSend = false
                        this.tryToSimulate()
                    }
                    else {
                        this.simulate();
                        this.tryingToSend = false;
                        this.loading = true;
                    }
                }
                , this.$settingsStore.waitingTimeAfterChange);
            }
        },
        updateFields(outputs) {
            this.outputsData.proximityLosses = 0;
            this.outputsData.ohmicLosses = 0;
            this.outputsData.acLosses = 0;
            this.outputsData.skinLosses = 0;
            this.outputsData.dcResistancePerWinding = [];
            this.outputsData.effectiveResistancePerWinding = [];
            this.outputsData.proximityLossesPerWinding = [];
            this.outputsData.ohmicLossesPerWinding = [];
            this.outputsData.skinLossesPerWinding = [];
            this.outputsData.windingLossesPerWinding = [];
            this.outputsData.leakageInductancePerWinding = [0];
            for (var windingIndex = 0; windingIndex < this.masStore.mas.magnetic.coil.functionalDescription.length; windingIndex++) {
                var proximityLosses = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[windingIndex].proximityEffectLosses.lossesPerHarmonic.reduce((a, c) => {return a + c}, 0);
                this.outputsData.proximityLossesPerWinding.push(proximityLosses);
                var skinLosses = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[windingIndex].skinEffectLosses.lossesPerHarmonic.reduce((a, c) => {return a + c}, 0);
                var ohmicLosses = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[windingIndex].ohmicLosses.losses;
                this.outputsData.proximityLosses += proximityLosses;
                this.outputsData.ohmicLosses += ohmicLosses;
                this.outputsData.skinLosses += skinLosses;
                this.outputsData.acLosses += skinLosses + proximityLosses;
                this.outputsData.ohmicLossesPerWinding.push(ohmicLosses);
                this.outputsData.skinLossesPerWinding.push(skinLosses);
                this.outputsData.windingLossesPerWinding.push(proximityLosses + skinLosses + ohmicLosses);
                this.outputsData.dcResistancePerWinding.push(outputs[this.operatingPointIndex].windingLosses.dcResistancePerWinding[windingIndex]);
            }

            for (var windingIndex = 0; windingIndex < this.masStore.mas.magnetic.coil.functionalDescription.length - 1; windingIndex++) {
                var leakageInductance = outputs[this.operatingPointIndex].leakageInductance.leakageInductancePerWinding[windingIndex].nominal;
                this.outputsData.leakageInductancePerWinding.push(leakageInductance);
            }
            for (var windingIndex = 0; windingIndex < this.masStore.mas.magnetic.coil.functionalDescription.length; windingIndex++) {
                this.outputsData.effectiveResistancePerWinding.push(this.outputsData.windingLossesPerWinding[windingIndex] / Math.pow(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding[windingIndex].current.processed.rms, 2));
            }
            // this.outputsData.proximityLossesPerWinding = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[];
            this.outputsData.windingLosses = outputs[this.operatingPointIndex].windingLosses.windingLosses;
            this.outputsData.totalLosses = outputs[this.operatingPointIndex].windingLosses.windingLosses + outputs[this.operatingPointIndex].coreLosses.coreLosses;
        },
        simulate() {
            if (this.core['functionalDescription']['shape'] != "" && this.core['functionalDescription']['material'] != "") {
                this.$mkf.ready.then(_ => {
                    console.log("Coil simulation")

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

                    if (this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding[0].current == null ||
                        this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding[0].current.processed == null ||
                        this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding[0].current.processed.rms == null) {
                        for (var operatingPointIndex = 0; operatingPointIndex < this.masStore.mas.inputs.operatingPoints.length; operatingPointIndex++) {
                            for (var windingIndex = 0; windingIndex < this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding.length; windingIndex++) {
                                const harmonics = JSON.parse(this.$mkf.calculate_harmonics(JSON.stringify(this.masStore.mas.inputs.operatingPoints[operatingPointIndex].excitationsPerWinding[windingIndex].current.waveform), this.masStore.mas.inputs.operatingPoints[operatingPointIndex].excitationsPerWinding[windingIndex].frequency));
                                const processed = JSON.parse(this.$mkf.calculate_processed_data(JSON.stringify(harmonics), JSON.stringify(this.masStore.mas.inputs.operatingPoints[operatingPointIndex].excitationsPerWinding[windingIndex].current.waveform)));
                                this.masStore.mas.inputs.operatingPoints[operatingPointIndex].excitationsPerWinding[windingIndex].harmonics = harmonics;
                                this.masStore.mas.inputs.operatingPoints[operatingPointIndex].excitationsPerWinding[windingIndex].processed = processed;
                            }
                        }
                    }

                    const inputsString = JSON.stringify(this.masStore.mas.inputs);
                    const magneticsString = JSON.stringify(this.masStore.mas.magnetic);
                    const modelsString = JSON.stringify(modelsData);

                    if (inputsString != this.lastSimulatedInputs || magneticsString != this.lastSimulatedMagnetics || modelsString != this.lastSimulatedModels) {
                        const result = this.$mkf.simulate(inputsString,
                                                      magneticsString,
                                                      modelsString);

                        this.lastSimulatedInputs = inputsString;
                        this.lastSimulatedMagnetics = magneticsString;
                        this.lastSimulatedModels = modelsString;

                        if (result.startsWith("Exception")) {
                            this.loading = false;
                            console.error(result);
                            return;
                        }
                        else {
                            const mas = JSON.parse(result);
                            this.updateFields(mas.outputs);
                            this.masStore.mas.outputs = deepCopy(mas.outputs);
                            this.loading = false;
                            this.dataUptoDate = true;
                        }
                    }
                    else {
                        this.loading = false;
                        this.dataUptoDate = true;
                    }
                })
            }
        },
        windingIndexChanged(windingIndex) {
            this.selectedWindingIndex = windingIndex;
        },
    }
}
</script>

<template>
    <h5 v-if="core['functionalDescription']['material'] == null" class="text-danger my-2">Select core material</h5>

    <img :data-cy="dataTestLabel + '-BasicCoilInfo-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">

    <div v-else class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2" :style="$styleStore.magneticBuilder.main">
        <div
            class="row ps-2"
            v-tooltip="styleTooltip"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.windingLosses"
                v-if="outputsData.windingLosses != null"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'winding'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-WindingLosses'"
                :numberDecimals="2"
                :value="outputsData.windingLosses"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.totalLosses"
                v-if="outputsData.totalLosses != null"
                :class="'border-start'"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'total'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-TotalLosses'"
                :numberDecimals="2"
                :value="outputsData.totalLosses"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.ohmicLosses"
                v-if="outputsData.ohmicLosses != null"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'DC'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-OhmicLosses'"
                :numberDecimals="2"
                :value="outputsData.ohmicLosses"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.acLosses"
                v-if="outputsData.acLosses != null"
                :class="'border-start'"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'AC'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-AcLosses'"
                :numberDecimals="2"
                :value="outputsData.acLosses"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <div class="col-12 mt-3 mb-2 p-0">
                <WindingSelector
                    :masStore="masStore"
                    :dataTestLabel="`${dataTestLabel}-WindingSelector`"
                    :coil="masStore.mas.magnetic.coil"
                    @windingIndexChanged="windingIndexChanged"
                />
            </div>
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.ohmicLossesPerWinding"
                v-if="outputsData.ohmicLossesPerWinding != null"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'DC'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-OhmicLossesPerWinding'"
                :numberDecimals="2"
                :value="outputsData.ohmicLossesPerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.skinLossesPerWinding"
                v-if="outputsData.skinLossesPerWinding != null"
                :class="'border-start'"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'skin'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-SkinLossesPerWinding'"
                :numberDecimals="2"
                :value="outputsData.skinLossesPerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.proximityLossesPerWinding"
                v-if="outputsData.proximityLossesPerWinding != null"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'prox.'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-ProximityLossesPerWinding'"
                :numberDecimals="2"
                :value="outputsData.proximityLossesPerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.windingLossesPerWinding"
                v-if="outputsData.windingLossesPerWinding != null"
                :class="'border-start'"
                class="col-6 text-start ps-3"
                :name="'P'"
                :subscriptName="'winding'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-WindingLossesPerWinding'"
                :numberDecimals="2"
                :value="outputsData.windingLossesPerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.dcResistancePerWinding"
                v-if="outputsData.dcResistancePerWinding != null"
                class="col-6 text-start ps-3"
                :name="'R'"
                :subscriptName="'DC'"
                :unit="'Ω'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-DcResistancePerWinding'"
                :numberDecimals="2"
                :value="outputsData.dcResistancePerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.effectiveResistancePerWinding"
                v-if="outputsData.effectiveResistancePerWinding != null"
                :class="'border-start'"
                class="col-6 text-start ps-3"
                :name="'R'"
                :subscriptName="'eff'"
                :unit="'Ω'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-EffectiveResistancePerWinding'"
                :numberDecimals="2"
                :value="outputsData.effectiveResistancePerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.leakageInductanceReflectedToPrimary"
                v-if="outputsData.leakageInductancePerWinding != null && selectedWindingIndex > 0"
                class="col-6 text-start ps-3"
                :name="'L'"
                :subscriptName="'lk'"
                :unit="'H'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-LeakageInductancePerWinding'"
                :numberDecimals="2"
                :value="outputsData.leakageInductancePerWinding[selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

        </div>
    </div>
</template>