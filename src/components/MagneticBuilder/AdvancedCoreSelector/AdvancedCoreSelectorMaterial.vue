<script setup>
import InitialPermeabilityVersusTemperature from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusTemperature.vue'
import InitialPermeabilityVersusTemperatureEquationBased from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusTemperatureEquationBased.vue'
import InitialPermeabilityVersusFrequency from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusFrequency.vue'
import InitialPermeabilityVersusFrequencyEquationBased from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusFrequencyEquationBased.vue'
import InitialPermeabilityVersusMagneticFieldDcBias from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusMagneticFieldDcBias.vue'
import InitialPermeabilityVersusMagneticFieldDcBiasEquationBased from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusMagneticFieldDcBiasEquationBased.vue'
import ComplexPermeabilityVersusFrequency from './AdvancedCoreSelectorMaterial/ComplexPermeabilityVersusFrequency.vue'
import CoercivityVersusTemperature from './AdvancedCoreSelectorMaterial/CoercivityVersusTemperature.vue'
import RemanenceVersusTemperature from './AdvancedCoreSelectorMaterial/RemanenceVersusTemperature.vue'
import SaturationVersusTemperature from './AdvancedCoreSelectorMaterial/SaturationVersusTemperature.vue'
import ResistivityVersusTemperature from './AdvancedCoreSelectorMaterial/ResistivityVersusTemperature.vue'
import BhCyclePerTemperature from './AdvancedCoreSelectorMaterial/BhCyclePerTemperature.vue'
import VolumetricLossesPerTemperature from './AdvancedCoreSelectorMaterial/VolumetricLossesPerTemperature.vue'
import LossFactorVersusFrequency from './AdvancedCoreSelectorMaterial/LossFactorVersusFrequency.vue'
import VolumetricLossesPerTemperatureEquationBased from './AdvancedCoreSelectorMaterial/VolumetricLossesPerTemperatureEquationBased.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import Text from '/WebSharedComponents/DataInput/Text.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import DimensionWithTolerance from '/WebSharedComponents/DataInput/DimensionWithTolerance.vue'
import { MaterialEnum, MaterialComposition } from '/WebSharedComponents/assets/ts/MAS.ts'
import ContextMenu from '../ContextMenu.vue'
import { useMagneticBuilderSettingsStore } from '../../../stores/magneticBuilderSettings'
import { useTaskQueueStore } from '../../../stores/taskQueue'
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
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const magneticBuilderSettingsStore = useMagneticBuilderSettingsStore();
        const subscriptions = []
        return {
            taskQueueStore,
            magneticBuilderSettingsStore,
            subscriptions,
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "coreMaterialProcessed") {
                    if (args[0]) {
                        const coreMaterial = args[1];
                        this.core.functionalDescription.material = coreMaterial;
                        this.loadAdvancedMaterialData();

                    }
                    else {
                        console.error(args[1]);
                    }
                }
                if (name == "complexPermeabilityGotten") {
                    if (args[0]) {
                        const complexPermeability = args[1];
                        this.core.functionalDescription.material.permeability.complex = complexPermeability;
                    }
                    else {
                        console.error(args[1]);
                    }
                }
            });
        }))
        if (typeof(this.core.functionalDescription.material) == "string") {
            this.loadMaterialData();
        }
        else {
            this.loadAdvancedMaterialData();
        }
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    computed: {
        materialEnumInversed() {
            const materialEnumInversed = {};
            Object.keys(MaterialEnum).forEach((key) => {
                materialEnumInversed[MaterialEnum[key]] = key;  
            })
            return materialEnumInversed;
        },
        materialCompositionInversed() {
            const materialCompositionInversed = {};
            Object.keys(MaterialComposition).forEach((key) => {
                materialCompositionInversed[MaterialComposition[key]] = key;  
            })
            return materialCompositionInversed;
        },
        isInitialPermeabilityEquationBased() {
            if (this.core.functionalDescription.material.permeability == null) {
                return false
            }
            if (!Array.isArray(this.core.functionalDescription.material.permeability.initial)) {
                if (this.core.functionalDescription.material.permeability.initial.modifiers == null) {
                    return false;
                }
                if (this.core.functionalDescription.material.permeability.initial.modifiers.default == null) {
                    return false;
                }
                if (this.core.functionalDescription.material.permeability.initial.modifiers.default.method == null) {
                    return false;
                }

                return true;

            }
            else {
                return false;
            }
        },
        isCoreLossesEquationBased() {
            if (this.core.functionalDescription.material.volumetricLosses == null) {
                return false;
            }
            var isCoreLossesEquationBased = false; 
            this.core.functionalDescription.material.volumetricLosses.default.forEach((method) => {
                if (!Array.isArray(method)) {
                    if (method.method == "magnetics" || method.method == "micrometals") {
                        isCoreLossesEquationBased = true;
                    }
                }
            }) 
            return isCoreLossesEquationBased;
        },
        isCoreLossesLossFactorBased() {
            if (this.core.functionalDescription.material.volumetricLosses == null) {
                return false;
            }
            var isCoreLossesLossFactorBased = false; 
            this.core.functionalDescription.material.volumetricLosses.default.forEach((method) => {
                if (!Array.isArray(method)) {
                    if (method.method == "lossFactor") {
                        isCoreLossesLossFactorBased = true;
                    }
                }
            }) 
            return isCoreLossesLossFactorBased;
        },
    },
    methods: {
        loadAdvancedMaterialData() {
            const url = import.meta.env.VITE_API_ENDPOINT + '/read_advanced_core_material_by_name'
            const data = {
                "name": this.core.functionalDescription.material.name
            }
            this.$axios.post(url, data)
            .then(response => {

                if (response.data.bhCycle != null && response.data.bhCycle.length > 0) {
                    this.core.functionalDescription.material.bhCycle = response.data.bhCycle;
                }
                if (response.data.volumetricLosses != null) {
                    Object.keys(response.data.volumetricLosses).forEach((key) => {
                        response.data.volumetricLosses[key].forEach((method) => {
                            this.core.functionalDescription.material.volumetricLosses[key].push(method)
                        })
                    })
                }
                if (response.data.permeability != null && response.data.permeability.amplitude != null) {
                    this.core.functionalDescription.material.permeability.amplitude = response.data.permeability.amplitude;
                }

                if (this.core.functionalDescription.material.permeability.complex == null) {
                    this.loadMaterialComplexPermeabilityData();
                }
            })
            .catch(error => {
                console.error(error);
            });
        },
        loadMaterialData() {
            this.taskQueueStore.processCoreMaterial(this.core.functionalDescription.material);
        },
        loadMaterialComplexPermeabilityData() {
            this.taskQueueStore.getComplexPermeability(this.core.functionalDescription.material);
            this.$mkf.ready.then(_ => {
                const materialJson = this.$mkf.calculate_complex_permeability(JSON.stringify(this.core.functionalDescription.material));
                if (materialJson.startsWith("Exception")) {
                    console.error(materialJson);
                    return;
                }
                else {
                    this.core.functionalDescription.material.permeability.complex = JSON.parse(materialJson);
                }
            })
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-12 container">
                <div class ="row">
                    <h2 
                        class="col-4 mb-3 text-center"
                        >
                        {{'Core Material Cust.'}}
                    </h2>
                    <div
                        v-if="magneticBuilderSettingsStore.enableContextMenu"
                        class="col-8 border mt-2" style="height: fit-content" :style="$styleStore.contextMenu.main">
                        <ContextMenu
                            v-if="magneticBuilderSettingsStore.enableContextMenu"
                            :dataTestLabel="dataTestLabel + '-ContextMenu'"
                        />
                    </div>
                </div>
            </div>
            <div class="col-sm-12 col-md-4">
                <div>
                    <Text
                        v-if="core.functionalDescription.material.name != null"
                        class="col-11 offset-1 mb-1 text-start"
                        :name="'name'"
                        v-model="core.functionalDescription.material"
                        :defaultValue="'Material name'"
                        :dataTestLabel="dataTestLabel + '-MaterialName'"
                        :canBeEmpty="false"
                        :labelWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <Text
                        v-if="core.functionalDescription.material.family != null"
                        class="col-11 offset-1 mb-1 text-start"
                        :name="'family'"
                        v-model="core.functionalDescription.material"
                        :defaultValue="'Material Family'"
                        :dataTestLabel="dataTestLabel + '-MaterialFamily'"
                        :canBeEmpty="false"
                        :labelWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <Text
                        v-if="core.functionalDescription.material.manufacturerInfo != null && core.functionalDescription.material.manufacturerInfo.name != null"
                        class="col-11 offset-1 mb-1 text-start"
                        :name="'name'"
                        :replaceTitle="'Manufacturer'"
                        v-model="core.functionalDescription.material.manufacturerInfo"
                        :defaultValue="'Manufacturer name'"
                        :dataTestLabel="dataTestLabel + '-MaterialName'"
                        :canBeEmpty="false"
                        :labelWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <Dimension
                        v-if="core.functionalDescription.material.curieTemperature != null"
                        :name="'curieTemperature'"
                        :unit="'°C'"
                        class="col-11 offset-1 ms-3 ps-1 mb-1 text-start"
                        :dataTestLabel="dataTestLabel + '-CurieTemperature'"
                        :justifyContent="true"
                        :allowNegative="true"
                        :allowZero="true"
                        :min="1"
                        :max="1000"
                        :modelValue="core.functionalDescription.material"
                        :labelWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <Dimension
                        v-if="core.functionalDescription.material.density != null"
                        :name="'density'"
                        :unit="'g/m³'"
                        class="col-11 offset-1 ms-3 ps-1 mb-1 text-start"
                        :dataTestLabel="dataTestLabel + '-Density'"
                        :justifyContent="true"
                        :allowNegative="true"
                        :allowZero="true"
                        :min="1"
                        :max="1000"
                        :modelValue="core.functionalDescription.material"
                        :labelWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueWidthProportionClass="'col-sm-12 col-md-6'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <ElementFromList
                        v-if="core.functionalDescription.material.material != null"
                        class="col-10 offset-1 ms-3 ps-1 mb-1 text-start"
                        :dataTestLabel="dataTestLabel + '-Material'"
                        :name="'material'"
                        :titleSameRow="true"
                        :justifyContent="true"
                        v-model="core.functionalDescription.material"
                        :options="materialEnumInversed"
                        :labelWidthProportionClass="'col-sm-12 col-md-5'"
                        :valueWidthProportionClass="'col-sm-12 col-md-7'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <ElementFromList
                        v-if="core.functionalDescription.material.materialComposition != null"
                        class="col-10 offset-1 ms-3 ps-1 mb-1 text-start"
                        :dataTestLabel="dataTestLabel + '-MaterialComposition'"
                        :name="'materialComposition'"
                        :replaceTitle="'Material Comp.'"
                        :titleSameRow="true"
                        :justifyContent="true"
                        v-model="core.functionalDescription.material"
                        :options="materialCompositionInversed"
                        :labelWidthProportionClass="'col-sm-12 col-md-5'"
                        :valueWidthProportionClass="'col-sm-12 col-md-7'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <DimensionWithTolerance class="border-bottom py-2 ps-2"
                        v-if="core.functionalDescription.material.heatCapacity != null"
                        :name="'heatCapacity'"
                        unit="J/Kg/K"
                        :dataTestLabel="dataTestLabel + '-HeatCapacity'"
                        :defaultField="'nominal'"
                        :min="1"
                        :max="1000000"
                        v-model="core.functionalDescription.material.heatCapacity"
                        :severalRows="true"
                        :unitExtraStyleClass="'py-1 ps-1 mt-1'"
                        :addButtonStyle="$styleStore.magneticBuilder.requirementButton"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :titleFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <DimensionWithTolerance class="border-bottom py-2 ps-2"
                        v-if="core.functionalDescription.material.heatConductivity != null"
                        :name="'heatConductivity'"
                        unit="W/m/K"
                        :dataTestLabel="dataTestLabel + '-HeatConductivity'"
                        :defaultField="'nominal'"
                        :min="1"
                        :max="1000"
                        v-model="core.functionalDescription.material.heatConductivity"
                        :severalRows="true"
                        :unitExtraStyleClass="'py-1 ps-1 mt-1'"
                        :addButtonStyle="$styleStore.magneticBuilder.requirementButton"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :titleFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                    />
                    <div class="col-12">
                        <ResistivityVersusTemperature
                            v-if="core.functionalDescription.material.resistivity != null"
                            :dataTestLabel="dataTestLabel + '-ResistivityVersusTemperature'"
                            :data="core.functionalDescription.material.resistivity"
                        />
                    </div>
                    <div class="col-12">
                        <SaturationVersusTemperature
                            v-if="core.functionalDescription.material.saturation != null"
                            :dataTestLabel="dataTestLabel + '-SaturationVersusTemperature'"
                            :data="core.functionalDescription.material.saturation"
                        />
                    </div>
                    <div class="col-12">
                        <CoercivityVersusTemperature
                            v-if="core.functionalDescription.material.coercivity != null"
                            :dataTestLabel="dataTestLabel + '-CoercivityVersusTemperature'"
                            :data="core.functionalDescription.material.coercivity"
                        />
                    </div>
                    <div class="col-12">
                        <RemanenceVersusTemperature
                            v-if="core.functionalDescription.material.remanence != null"
                            :dataTestLabel="dataTestLabel + '-RemanenceVersusTemperature'"
                            :data="core.functionalDescription.material.remanence"
                        />
                    </div> -->
                </div>
            </div>
            <div class="col-sm-12 col-md-4">
                <InitialPermeabilityVersusTemperature
                    v-if="core.functionalDescription.material.permeability != null && !isInitialPermeabilityEquationBased"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusTemperature'"
                    :data="core.functionalDescription.material.permeability.initial"
                    :chartStyle="'height: 19vh'"
                />
                <InitialPermeabilityVersusTemperatureEquationBased
                    v-if="core.functionalDescription.material.permeability != null && isInitialPermeabilityEquationBased"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusTemperature'"
                    :data="core.functionalDescription.material.permeability.initial"
                    :chartStyle="'height: 19vh'"
                />
                <InitialPermeabilityVersusFrequency
                    v-if="core.functionalDescription.material.permeability != null && !isInitialPermeabilityEquationBased"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusFrequency'"
                    :data="core.functionalDescription.material.permeability.initial"
                    :chartStyle="'height: 19vh'"
                />
                <InitialPermeabilityVersusFrequencyEquationBased
                    v-if="core.functionalDescription.material.permeability != null && isInitialPermeabilityEquationBased"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusFrequency'"
                    :data="core.functionalDescription.material.permeability.initial"
                    :chartStyle="'height: 19vh'"
                />
                <InitialPermeabilityVersusMagneticFieldDcBias
                    v-if="core.functionalDescription.material.permeability != null && !isInitialPermeabilityEquationBased"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusMagneticFieldDcBias'"
                    :data="core.functionalDescription.material.permeability.initial"
                    :chartStyle="'height: 19vh'"
                />
                <InitialPermeabilityVersusMagneticFieldDcBiasEquationBased
                    v-if="core.functionalDescription.material.permeability != null && isInitialPermeabilityEquationBased"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusMagneticFieldDcBias'"
                    :data="core.functionalDescription.material.permeability.initial"
                    :chartStyle="'height: 19vh'"
                />
                <ComplexPermeabilityVersusFrequency
                    v-if="core.functionalDescription.material.permeability != null && core.functionalDescription.material.permeability.complex != null"
                    :dataTestLabel="dataTestLabel + '-ComplexPermeabilityVersusFrequency'"
                    :data="core.functionalDescription.material.permeability.complex"
                    :chartStyle="'height: 19vh'"
                />
            </div>
            <div class="col-sm-12 col-md-4">
                <BhCyclePerTemperature
                    v-if="core.functionalDescription.material.bhCycle != null"
                    :dataTestLabel="dataTestLabel + '-BhCyclePerTemperature'"
                    :data="core.functionalDescription.material.bhCycle"
                />
                <LossFactorVersusFrequency
                    v-if="core.functionalDescription.material.volumetricLosses != null && isCoreLossesLossFactorBased"
                    :dataTestLabel="dataTestLabel + '-LossFactorVersusFrequency'"
                    :data="core.functionalDescription.material.volumetricLosses"
                />
                <VolumetricLossesPerTemperature
                    v-if="core.functionalDescription.material.volumetricLosses != null && !isCoreLossesEquationBased"
                    :dataTestLabel="dataTestLabel + '-VolumetricLossesPerTemperature'"
                    :data="core.functionalDescription.material.volumetricLosses"
                />
                <VolumetricLossesPerTemperatureEquationBased
                    v-if="core.functionalDescription.material.volumetricLosses != null && isCoreLossesEquationBased"
                    :dataTestLabel="dataTestLabel + '-VolumetricLossesPerTemperature'"
                    :data="core.functionalDescription.material.volumetricLosses"
                />
            </div>
        </div>
    </div>
</template>
