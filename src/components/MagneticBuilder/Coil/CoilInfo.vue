<script setup>
import { removeTrailingZeroes, deepCopy, isMobile } from '/WebSharedComponents/assets/js/utils.js'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import WindingSelector from '../Common/WindingSelector.vue'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
import { useModelSettingsStore } from '../../../stores/modelSettings'
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
        enableAutoSimulation: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const modelSettingsStore = useModelSettingsStore();
        const outputsData = {};
        const selectedWindingIndex = 0;
        const loading = false;
        const recentChange = false;
        const tryingToSend = false;
        const lastSimulatedInputs = "";
        const lastSimulatedMagnetics = "";
        const lastSimulatedModels = "";
        const dataUptoDate = false;
        const subscriptions = [];

        return {
            taskQueueStore,
            modelSettingsStore,
            outputsData,
            selectedWindingIndex,
            recentChange,
            tryingToSend,
            loading,
            lastSimulatedInputs,
            lastSimulatedMagnetics,
            lastSimulatedModels,
            dataUptoDate,
            subscriptions,
        }
    },
    computed: {
    },
    watch: {
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.updateFields(this.masStore.mas.outputs);
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
        // Reset simulation cache when component is mounted to ensure fresh simulation
        // This handles the case when returning from operating points or other views
        this.lastSimulatedInputs = "";
        this.lastSimulatedMagnetics = "";
        this.lastSimulatedModels = "";

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            // Mark as outdated immediately when wind starts
            if (name == "wind" || name == "windPlanar") {
                this.dataUptoDate = false;
            }
            after(() => {
                if (name == "wound" || name == "planarWound" || name == "coreShapeProcessed" || name == "coreMaterialProcessed" || name == "coreProcessed") {
                    if (args[0]) {
                        this.dataUptoDate = false;
                        if (this.enableAutoSimulation) {
                            this.simulate();
                        }
                    }
                    else {
                        console.error(args[1])
                        this.dataUptoDate = false;
                    }
                }
                // When builder is ready with an existing design, run simulation
                if (name == "magneticBuilderReady") {
                    if (this.masStore.mas.magnetic?.coil?.turnsDescription != null && this.enableAutoSimulation) {
                        this.loading = true;
                        this.dataUptoDate = false;
                        this.simulate();
                    }
                }
            });
        }))

        // Listen for global resimulate action from stateStore
        this.subscriptions.push(this.$stateStore.$onAction(({name, after}) => {
            after(() => {
                if (name == "resimulate") {
                    this.loading = true;
                    this.simulate();
                }
            });
        }))

        // Wait for modelSettings to be initialized before starting simulation
        this.waitForModelSettingsAndSimulate();
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        waitForModelSettingsAndSimulate() {
            // Wait for modelSettings to be initialized AND have valid models before calculating
            if (this.modelSettingsStore.isInitialized &&
                Object.keys(this.modelSettingsStore.availableMagneticFieldStrengthModels).length > 0) {
                if (this.enableAutoSimulation) {
                    this.loading = true;
                    this.recentChange = true;
                    this.tryToSimulate();
                } else {
                    this.loading = false;
                    this.dataUptoDate = false;
                }
            } else {
                // Check again in 100ms
                setTimeout(() => this.waitForModelSettingsAndSimulate(), 100);
            }
        },
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
                        if (this.enableAutoSimulation) {
                            this.simulate();
                            this.loading = true;
                        } else {
                            this.loading = false;
                        }
                        this.tryingToSend = false;
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
            for (let windingIndex = 0; windingIndex < this.masStore.mas.magnetic.coil.functionalDescription.length; windingIndex++) {
                const proximityLosses = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[windingIndex].proximityEffectLosses.lossesPerHarmonic.reduce((a, c) => {return a + c}, 0);
                this.outputsData.proximityLossesPerWinding.push(proximityLosses);
                const skinLosses = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[windingIndex].skinEffectLosses.lossesPerHarmonic.reduce((a, c) => {return a + c}, 0);
                const ohmicLosses = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[windingIndex].ohmicLosses.losses;
                this.outputsData.proximityLosses += proximityLosses;
                this.outputsData.ohmicLosses += ohmicLosses;
                this.outputsData.skinLosses += skinLosses;
                this.outputsData.acLosses += skinLosses + proximityLosses;
                this.outputsData.ohmicLossesPerWinding.push(ohmicLosses);
                this.outputsData.skinLossesPerWinding.push(skinLosses);
                this.outputsData.windingLossesPerWinding.push(proximityLosses + skinLosses + ohmicLosses);
                this.outputsData.dcResistancePerWinding.push(outputs[this.operatingPointIndex].windingLosses.dcResistancePerWinding[windingIndex]);
            }

            if (outputs[this.operatingPointIndex].inductance.leakageInductance?.leakageInductancePerWinding) {
                for (let windingIndex = 0; windingIndex < this.masStore.mas.magnetic.coil.functionalDescription.length - 1; windingIndex++) {
                    const leakageInductance = outputs[this.operatingPointIndex].inductance.leakageInductance.leakageInductancePerWinding[windingIndex].nominal;
                    this.outputsData.leakageInductancePerWinding.push(leakageInductance);
                }
            }
            for (let windingIndex = 0; windingIndex < this.masStore.mas.magnetic.coil.functionalDescription.length; windingIndex++) {
                this.outputsData.effectiveResistancePerWinding.push(this.outputsData.windingLossesPerWinding[windingIndex] / Math.pow(this.masStore.mas.inputs.operatingPoints[this.operatingPointIndex].excitationsPerWinding[windingIndex].current.processed.rms, 2));
            }
            // this.outputsData.proximityLossesPerWinding = outputs[this.operatingPointIndex].windingLosses.windingLossesPerWinding[];
            this.outputsData.windingLosses = outputs[this.operatingPointIndex].windingLosses.windingLosses;
            this.outputsData.totalLosses = outputs[this.operatingPointIndex].windingLosses.windingLosses + outputs[this.operatingPointIndex].coreLosses.coreLosses;
        },
        simulate() {
            
            if (this.masStore.mas.magnetic.coil['turnsDescription'] == null) {
                // turnsDescription not available yet, stop loading state
                this.loading = false;
                this.dataUptoDate = false;
                return;
            }
            
            if (this.masStore.mas.magnetic.coil['turnsDescription'] != null) {

                // Check if there are pending simulation models from the state store
                const pendingModels = this.$stateStore.pendingSimulationModels;
                
                // Use pending models if available, otherwise fall back to store values
                const magneticFieldStrength = pendingModels?.magneticFieldStrengthModel || this.modelSettingsStore.magneticFieldStrengthModel;
                const magneticFieldStrengthFringingEffect = pendingModels?.magneticFieldStrengthFringingEffectModel || this.modelSettingsStore.magneticFieldStrengthFringingEffectModel;
                
                const modelsData = {
                    coreLosses: this.$userStore.selectedModels['coreLosses'] || Defaults.coreLossesModelDefault,
                    coreTemperature: this.$userStore.selectedModels['coreTemperature'] || Defaults.coreTemperatureModelDefault,
                    gapReluctance: this.$userStore.selectedModels['gapReluctance'] || Defaults.reluctanceModelDefault,
                    windingSkinEffectLosses: pendingModels?.windingSkinEffectLossesModel || this.modelSettingsStore.windingSkinEffectLossesModel,
                    windingProximityEffectLosses: pendingModels?.windingProximityEffectLossesModel || this.modelSettingsStore.windingProximityEffectLossesModel,
                    magneticFieldStrength: magneticFieldStrength,
                    magneticFieldStrengthFringingEffect: magneticFieldStrengthFringingEffect
                };
                
                // Clear pending models after using them
                if (pendingModels) {
                    this.$stateStore.pendingSimulationModels = null;
                }


                const inputsString = JSON.stringify(this.masStore.mas.inputs);
                const magneticsString = JSON.stringify(this.masStore.mas.magnetic);
                const modelsString = JSON.stringify(modelsData);


                if (this.masStore.mas.magnetic.coil.turnsDescription != null && (inputsString != this.lastSimulatedInputs || magneticsString != this.lastSimulatedMagnetics || modelsString != this.lastSimulatedModels)) {

                    this.taskQueueStore.simulate(this.masStore.mas, modelsData).then((mas) => {

                        this.lastSimulatedInputs = inputsString;
                        this.lastSimulatedMagnetics = magneticsString;
                        this.lastSimulatedModels = modelsString;

                        this.updateFields(mas.outputs);
                        this.masStore.mas.outputs = deepCopy(mas.outputs);
                        this.loading = false;
                        this.dataUptoDate = true;
                    })
                    .catch(error => {
                        console.error('[CoilInfo] Simulation error:', error);
                        this.loading = false;
                    });
                }
                else {
                    this.dataUptoDate = true;
                    this.loading = false;
                }
            
            }
        },
        windingIndexChanged(windingIndex) {
            this.selectedWindingIndex = windingIndex;
        },
    }
}
</script>

<template>
    <h5 v-if="masStore.mas.magnetic.core['functionalDescription']['material'] == null" class="text-danger my-2">Select core material</h5>

    <img :data-cy="dataTestLabel + '-BasicCoilInfo-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">

    <div v-else-if="advancedMode" class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2" :style="$styleStore.magneticBuilder.main">
        <div
            class="row ps-2"
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
    <div v-else class="container-flex mt-2 mb-3 pb-3 border-bottom border-top pt-2" :style="$styleStore.magneticBuilder.main">
        <div
            class="row"
            :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.windingLosses"
                v-if="outputsData.windingLosses != null"
                class="col-12 text-start ps-4 pe-4"
                :name="'Winding losses'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-WindingLosses'"
                :numberDecimals="2"
                :value="outputsData.windingLosses"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.totalLosses"
                v-if="outputsData.totalLosses != null"
                class="col-12 text-start ps-4 pe-4"
                :name="'Total losses'"
                :unit="'W'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-TotalLosses'"
                :numberDecimals="2"
                :value="outputsData.totalLosses"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <div
                v-if="masStore.mas.magnetic.coil.functionalDescription.length > 2 && !$stateStore.hasCurrentApplicationMirroredWindings()"
                class="col-12 mt-3 mb-2 p-0">
                <WindingSelector
                    :dataTestLabel="`${dataTestLabel}-WindingSelector`"
                    :masStore="masStore"
                    :coil="masStore.mas.magnetic.coil"
                    @windingIndexChanged="windingIndexChanged"
                />
            </div>
            <DimensionReadOnly 
                v-tooltip="tooltipsMagneticBuilder.leakageInductanceReflectedToPrimary"
                v-if="outputsData.leakageInductancePerWinding != null && masStore.mas.magnetic.coil.functionalDescription.length > 1"
                class="col-12 text-start ps-4 pe-4"
                :name="'Leakage Inductance'"
                :unit="'H'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-LeakageInductancePerWinding'"
                :numberDecimals="2"
                :value="outputsData.leakageInductancePerWinding[selectedWindingIndex == 0? 1 : selectedWindingIndex]"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-7'"
                :valueWidthProportionClass="'col-5'"
                :inputStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

        </div>
    </div>
</template>