<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import CoreGappingSelector from '/WebSharedComponents/Common/CoreGappingSelector.vue'
import BasicCoreSubmenu from './BasicCoreSubmenu.vue'
import { coreAdviserWeights } from '/WebSharedComponents/assets/js/defaults.js'
import AdvancedCoreInfo from './AdvancedCoreInfo.vue'
import BasicCoreInfo from './BasicCoreInfo.vue'
import { useHistoryStore } from '../../stores/history'

import { deepCopy, checkAndFixMas } from '/WebSharedComponents/assets/js/utils.js'
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
        enableSimulation: {
            type: Boolean,
            default: true,
        },
        enableSubmenu: {
            type: Boolean,
            default: true,
        },
        enableAdvise: {
            type: Boolean,
            default: true,
        },
        enableCustomize: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        const coreShapeNames = {}; 
        const coreShapeFamilies = []; 
        const coreMaterialNames = {}; 
        const coreMaterialManufacturers = [];
        const localData = {};
        const onlyManufacturer = null;

        if (this.masStore.coreAdviserWeights == null) {
            this.masStore.coreAdviserWeights = coreAdviserWeights;
        }

        const errorMessage = "";
        const loading = false;
        const forceUpdate = 0;

        return {
            historyStore,
            localData,
            onlyManufacturer,
            coreShapeNames,
            coreShapeFamilies,
            coreMaterialNames,
            coreMaterialManufacturers,
            errorMessage,
            loading,
            forceUpdate,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    width: '100px',
                    'transition-delay': '1s',
                    "text-align": "start",
                },
            }
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.getShapeNames();
        this.getMaterialNames();
        this.assignLocalData(this.masStore.mas.magnetic.core);
        this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.assignLocalData(this.masStore.mas.magnetic.core);
            }
        })
        this.masStore.$onAction((action) => {
            if (action.name == "importedMas") {
                this.assignLocalData(this.masStore.mas.magnetic.core);
            }
        })
    },
    methods: {
        isStackable(shape) {
            var shapeName = shape;
            if (shape == null) {
                shapeName = this.masStore.mas.magnetic.core.functionalDescription.shape;
            }
            if (! (typeof shapeName === 'string' || shapeName instanceof String)) {
                shapeName = shapeName.name;
            }

            if (shapeName.startsWith("E ") || shapeName.startsWith("U ") || shapeName.startsWith("T ")) {
                return true;
            }
            else {
                return false;
            }
        },
        assignLocalData(core) {
            if (typeof(core.functionalDescription.shape) == 'string') {
                if (core.functionalDescription.shape != "") {
                    this.localData["shape"] = deepCopy(core.functionalDescription.shape);
                    this.$mkf.ready.then(_ => {
                        const shapeResult = this.$mkf.get_shape_data(core.functionalDescription.shape);
                        if (shapeResult.startsWith("Exception")) {
                            console.error(core.functionalDescription.shape);
                            console.error(shapeResult);
                        }
                        else {
                            const shape = JSON.parse(shapeResult);
                            this.localData["shapeFamily"] = shape.family.toUpperCase();
                        }
                    })
                }
            }
            else {
                this.localData["shape"] = deepCopy(core.functionalDescription.shape.name);
                this.localData["shapeFamily"] = deepCopy(core.functionalDescription.shape.family).toUpperCase();
            }

            if (typeof(core.functionalDescription.material) == 'string') {
                if (core.functionalDescription.material != "") {
                    this.localData["material"] = deepCopy(core.functionalDescription.material);
                    this.$mkf.ready.then(_ => {
                        const materialResult = this.$mkf.get_material_data(core.functionalDescription.material);
                        if (materialResult.startsWith("Exception")) {
                            console.error(materialResult);
                        }
                        else {
                            const material = JSON.parse(materialResult);
                            this.localData["materialManufacturer"] = material.manufacturerInfo.name;
                        }
                    })
                }
            }
            else {
                this.localData["material"] = deepCopy(core.functionalDescription.material.name);
                this.localData["materialManufacturer"] = core.functionalDescription.material.manufacturerInfo.name;
            }
            this.localData["numberStacks"] = deepCopy(core.functionalDescription.numberStacks);
            this.localData["gapping"] = deepCopy(core.functionalDescription.gapping);
            this.forceUpdate += 1;
        },
        getShapeNames() {
            this.$mkf.ready.then(_ => {
                const coreShapeFamiliesHandle = this.$mkf.get_available_core_shape_families();
                for (var i = coreShapeFamiliesHandle.size() - 1; i >= 0; i--) {
                    const shapeFamily = coreShapeFamiliesHandle.get(i).toUpperCase()
                    if (!shapeFamily.includes("PQI") && !shapeFamily.includes("UT") &&
                        !shapeFamily.includes("UI") && !shapeFamily.includes("H") && !shapeFamily.includes("DRUM")) {
                        this.coreShapeFamilies.push(shapeFamily);
                    }
                }

                this.coreShapeFamilies = this.coreShapeFamilies.sort();

                if (this.onlyManufacturer != '' && this.onlyManufacturer != null) {
                    var coreShapeNamesHandle = this.$mkf.get_available_core_shapes_by_manufacturer(this.onlyManufacturer);

                    this.coreShapeFamilies.forEach((shapeFamily) => {
                        if (!shapeFamily.includes("PQI") && !shapeFamily.includes("UT") &&
                            !shapeFamily.includes("UI") && !shapeFamily.includes("H") && !shapeFamily.includes("DRUM")) {
                            this.coreShapeNames[shapeFamily] = [];
                            
                            var numberShapes = 0;
                            for (var i = coreShapeNamesHandle.size() - 1; i >= 0; i--) {
                                const aux = coreShapeNamesHandle.get(i);
                                if (aux.startsWith(shapeFamily + " ")) {
                                    numberShapes += 1;
                                    this.coreShapeNames[shapeFamily].push(aux);
                                }
                            }
                            if (numberShapes == 0) {
                                this.coreShapeNames[shapeFamily].pop();
                            }

                        }
                    })
                }
                else {
                    this.coreShapeFamilies.forEach((shapeFamily) => {
                        if (!shapeFamily.includes("PQI") && !shapeFamily.includes("UT") &&
                            !shapeFamily.includes("UI") && !shapeFamily.includes("H") && !shapeFamily.includes("DRUM")) {
                            this.coreShapeNames[shapeFamily] = [];
                            var coreShapeNamesHandle = this.$mkf.get_available_core_shapes_by_family(shapeFamily.toLowerCase())

                            var numberShapes = 0;
                            for (var i = coreShapeNamesHandle.size() - 1; i >= 0; i--) {
                                const aux = coreShapeNamesHandle.get(i);
                                numberShapes += 1;
                                this.coreShapeNames[shapeFamily].push(aux);
                            }
                            if (numberShapes == 0) {
                                this.coreShapeNames[shapeFamily].pop();
                            }

                        }
                    })
                }

                if (this.masStore.mas.magnetic.core.functionalDescription.shape.type == "custom") {
                    this.coreShapeNames[this.masStore.mas.magnetic.core.functionalDescription.shape.family.toUpperCase()].unshift(this.masStore.mas.magnetic.core.functionalDescription.shape.name);
                }
            });
        },
        getMaterialNames() {
            this.$mkf.ready.then(_ => {
                const coreMaterialManufacturersHandle = this.$mkf.get_available_core_manufacturers();
                for (var i = coreMaterialManufacturersHandle.size() - 1; i >= 0; i--) {
                    const manufacturer = coreMaterialManufacturersHandle.get(i);
                    this.coreMaterialManufacturers.push(manufacturer);
                }

                this.coreMaterialManufacturers = this.coreMaterialManufacturers.sort();

                this.coreMaterialManufacturers.forEach((manufacturer) => {
                    this.coreMaterialNames[manufacturer] = []
                    if (!(this.onlyManufacturer != '' && this.onlyManufacturer != null && manufacturer != this.onlyManufacturer)) {
                        const coreMaterialNamesHandle = this.$mkf.get_available_core_materials(manufacturer);
                        for (var i = coreMaterialNamesHandle.size() - 1; i >= 0; i--) {
                            this.coreMaterialNames[manufacturer].push(coreMaterialNamesHandle.get(i));
                        }
                    }
                    // this.coreMaterialNames[manufacturer] = this.coreMaterialNames[manufacturer].sort();
                })
            });
        },
        async shapeUpdated(value) {
            this.masStore.mas.magnetic.core.name = "Custom";
            this.masStore.mas.magnetic.core.manufacturerInfo = null;
            this.masStore.mas.magnetic.core.processedDescription = null;
            this.masStore.mas.magnetic.core.geometricalDescription = null;

            console.log(this.localData.material != null)
            this.$mkf.ready.then(_ => {
                var mas = deepCopy(this.masStore.mas);
                mas.magnetic.core.geometricalDescription = null;
                mas.magnetic.core.processedDescription = null;

                const shapeResult = this.$mkf.get_shape_data(value);
                if (shapeResult.startsWith("Exception")) {
                    console.error(shapeResult);
                }
                else {
                    const shape = JSON.parse(shapeResult);
                    if (this.localData.material == null) {
                        this.masStore.mas.magnetic.core.functionalDescription.shape = shape;
                    }
                    else {
                        mas.magnetic.core.functionalDescription.shape = shape;

                        if (!this.isStackable(shape)) {
                            mas.magnetic.core.functionalDescription.numberStacks = 1;
                        }

                        checkAndFixMas(mas).then(response => {
                            mas = response;

                            const coreResult = this.$mkf.calculate_core_data(JSON.stringify(mas.magnetic.core), false);
                            if (coreResult.startsWith("Exception")) {
                                console.error(coreResult);
                            }
                            else {
                                this.masStore.mas.magnetic.core = JSON.parse(coreResult);

                                this.masStore.mas.magnetic.coil.bobbin = "Dummy";
                                this.masStore.mas.magnetic.coil.turnsDescription = null;
                                this.masStore.mas.magnetic.coil.layersDescription = null;
                                this.masStore.mas.magnetic.coil.sectionsDescription = null;
                                this.masStore.mas.magnetic.manufacturerInfo = null;
                                const bobbinResult = this.$mkf.calculate_bobbin_data(JSON.stringify(this.masStore.mas.magnetic));
                                if (bobbinResult.startsWith("Exception")) {
                                    console.error(bobbinResult);
                                }
                                else {
                                    this.masStore.mas.magnetic.coil.bobbin = JSON.parse(bobbinResult);
                                    this.historyStore.addToHistory(this.masStore.mas);
                                }
                            }
                        })
                        .catch(error => {
                            console.error(error.data)
                        });
                    }
                }
            });
        },
        materialUpdated(value) {
            const aux = this.masStore.mas.magnetic.core;
            aux.functionalDescription.material = value
            this.masStore.mas.magnetic.core = aux;
            this.masStore.mas.magnetic.core.name = "Custom";
            this.masStore.mas.magnetic.core.manufacturerInfo = null;

            this.$mkf.ready.then(_ => {
                var mas = deepCopy(this.masStore.mas);
                mas.magnetic.core.geometricalDescription = null;
                mas.magnetic.core.processedDescription = null;

                const coreResult = this.$mkf.calculate_core_data(JSON.stringify(mas.magnetic.core), false);
                if (coreResult.startsWith("Exception")) {
                    console.error(coreResult);
                }
                else {
                    this.masStore.mas.magnetic.core = JSON.parse(coreResult);
                    this.historyStore.addToHistory(this.masStore.mas);
                }
            });
        },
        numberStacksUpdated(value) {
            this.masStore.mas.magnetic.core.functionalDescription.numberStacks = value;
            this.shapeUpdated(this.localData.shape)
            this.historyStore.addToHistory(this.masStore.mas);
        },
        gappingUpdated(value) {
            this.masStore.mas.magnetic.core.functionalDescription.gapping = value;
            this.shapeUpdated(this.localData.shape)
            this.historyStore.addToHistory(this.masStore.mas);
        },
        adviseCoreRequested() {
            this.loading = true;
            setTimeout(() => this.adviseCore(), 100);
        },
        adviseCore() {
            this.$mkf.ready.then(_ => {
                if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                    const settings = JSON.parse(this.$mkf.get_settings());

                    if (this.$stateStore.hasCurrentApplicationMirroredWindings()) {
                        settings["coreIncludeDistributedGaps"] = false;
                        settings["coreIncludeMargin"] = true;
                        settings["coreIncludeStacks"] = true;
                        settings["useToroidalCores"] = true;
                        settings["useConcentricCores"] = false;
                    }
                    else {
                        settings["coreIncludeDistributedGaps"] = this.$settingsStore.adviserAllowDistributedGaps == "1";
                        settings["coreIncludeMargin"] = true;
                        settings["coreIncludeStacks"] = this.$settingsStore.adviserAllowStacks == "1";
                        settings["useToroidalCores"] = this.$settingsStore.adviserToroidalCores == "1";
                    }
                    this.$mkf.set_settings(JSON.stringify(settings));

                    const result = this.$mkf.calculate_advised_cores(JSON.stringify(this.masStore.mas.inputs), JSON.stringify(this.masStore.coreAdviserWeights), 1, false);
                    if (result.startsWith("Exception")) {
                        console.error(result);
                        return;
                    }

                    const aux = JSON.parse(result);

                    var log = aux["log"];
                    var data = aux["data"];
                    if (data.length > 0) {
                        this.masStore.mas.magnetic.core = data[0].mas.magnetic.core;

                        this.$mkf.ready.then(_ => {

                            this.masStore.mas.magnetic.coil.bobbin = "Dummy";
                            this.masStore.mas.magnetic.coil.turnsDescription = null;
                            this.masStore.mas.magnetic.coil.layersDescription = null;
                            this.masStore.mas.magnetic.coil.sectionsDescription = null;
                            const bobbinResult = this.$mkf.calculate_bobbin_data(JSON.stringify(this.masStore.mas.magnetic));
                            if (bobbinResult.startsWith("Exception")) {
                                console.error(bobbinResult);
                            }
                            else {
                                this.masStore.mas.magnetic.coil.bobbin = JSON.parse(bobbinResult);
                            }

                            const numberTurns = [];
                            const numberTurnsHandle = this.$mkf.calculate_number_turns(data[0].mas.magnetic.coil.functionalDescription[0].numberTurns, JSON.stringify(this.masStore.mas.inputs.designRequirements));

                            const windings = this.masStore.mas.magnetic.coil.functionalDescription;
                            for (var i = 0; i < numberTurnsHandle.size(); i++) {
                                windings[i].numberTurns = numberTurnsHandle.get(i);
                            }
                            this.masStore.mas.magnetic.coil.functionalDescription = windings;
                            this.historyStore.addToHistory(this.masStore.mas);
                        });

                        this.errorMessage = "";
                    }
                    else{
                        this.errorMessage = "No core can be advised. You are on your own."
                        setTimeout(() => {this.errorMessage = ""}, 10000);

                    }
                    this.assignLocalData(this.masStore.mas.magnetic.core);
                    this.loading = false;
                }
                else {
                    console.error("No operating points found")
                    this.loading = false;
                }
            });
        },
        loadCore() {
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row" v-tooltip="styleTooltip">
            <img :data-cy="dataTestLabel + '-BasicCoreSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.coreShapeFamily"
                v-if="!loading"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-ShapeFamilies'"
                :name="'shapeFamily'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :options="coreShapeFamilies"
                :labelWidthProportionClass="'col-sm-12 col-md-5'"
                :valueWidthProportionClass="'col-sm-12 col-md-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.coreShape"
                v-if="!loading && localData.shapeFamily != null && coreShapeNames[localData.shapeFamily] != null && coreShapeNames[localData.shapeFamily].length > 0"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-ShapeNames'"
                :name="'shape'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :optionsToDisable="coreShapeFamilies"
                :options="coreShapeNames[localData.shapeFamily]"
                @update="shapeUpdated"
                :labelWidthProportionClass="'col-sm-12 col-md-5'"
                :valueWidthProportionClass="'col-sm-12 col-md-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.coreMaterialManufacturer"
                v-if="localData.shape != '' && localData.shapeFamily != null && !loading"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-MaterialManufacturers'"
                :name="'materialManufacturer'"
                :replaceTitle="'Manufacturer'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :options="coreMaterialManufacturers"
                :labelWidthProportionClass="'col-sm-12 col-md-5'"
                :valueWidthProportionClass="'col-sm-12 col-md-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.coreMaterial"
                v-if="localData.shape != '' && !loading && localData.materialManufacturer != null && coreMaterialNames[localData.materialManufacturer] != null && coreMaterialNames[localData.materialManufacturer].length > 0"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-MaterialNames'"
                :name="'material'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :optionsToDisable="coreMaterialManufacturers"
                :options="coreMaterialNames[localData.materialManufacturer]"
                @update="materialUpdated"
                :labelWidthProportionClass="'col-sm-12 col-md-5'"
                :valueWidthProportionClass="'col-sm-12 col-md-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <h5 v-if="localData.shape == '' && !loading" class="text-danger my-2">Select a family and a shape for the core</h5>

            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.coreNumberStacks"
                v-if="isStackable() && localData.shape != '' && !loading"
                :disabled="readOnly"
                :name="'numberStacks'"
                :replaceTitle="'Number of Stacks'"
                :unit="null"
                :forceUpdate="forceUpdate"
                :dataTestLabel="dataTestLabel + '-NumberStacks'"
                :min="1"
                :justifyContent="true"
                :defaultValue="1"
                :allowNegative="false"
                :modelValue="localData"
                @update="numberStacksUpdated"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <CoreGappingSelector class="col-12 mb-1 text-start"
                v-if="localData.shape != '' && localData.shapeFamily != null && localData.shape != null && !loading && masStore.mas.magnetic.core.functionalDescription.type == 'two-piece set'"
                :disabled="readOnly"
                :title="'Gap Info: '"
                :dataTestLabel="dataTestLabel + '-Gap'"
                :forceUpdate="forceUpdate"
                :autoupdate="false"
                :core="masStore.mas.magnetic.core"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="gappingUpdated"
            />

            <div
                v-if= "enableSimulation"
                class="col-12 p-0"
                >

                <BasicCoreInfo 
                    v-if="!loading && !$settingsStore.magneticBuilderSettings.advancedMode"
                    :dataTestLabel="dataTestLabel + '-BasicCoreInfo'"
                    :core="masStore.mas.magnetic.core"
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                />
                <AdvancedCoreInfo 
                    v-if="!loading && $settingsStore.magneticBuilderSettings.advancedMode"
                    :dataTestLabel="dataTestLabel + '-AdvancedCoreInfo'"
                    :core="masStore.mas.magnetic.core"
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                />
            </div>

            <BasicCoreSubmenu 
                v-if="enableSubmenu && !readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-BasicCoreSubmenu'"
                :enableAdvise="!loading"
                :enableCustomize="enableCustomize"
                :allowAdvise="enableAdvise"
                @adviseCore="adviseCoreRequested"
                @customizeCore="$emit('customizeCore')"
                @loadCore="loadCore"
            />
            <label class="text-danger col-12 pt-1" style="font-size: 0.7em">{{errorMessage}}</label>


        </div>
    </div>
</template>
