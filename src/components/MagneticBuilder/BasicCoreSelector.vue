<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import CoreGappingSelector from '/WebSharedComponents/Common/CoreGappingSelector.vue'
import BasicCoreSubmenu from './BasicCoreSubmenu.vue'
import { coreAdviserWeights } from '/WebSharedComponents/assets/js/defaults.js'
import AdvancedCoreInfo from './AdvancedCoreInfo.vue'
import BasicCoreInfo from './BasicCoreInfo.vue'
import CoreShapeSelector from './CoreShapeSelector.vue'
import { useHistoryStore } from '../../stores/history'
import { useTaskQueueStore } from '../../stores/taskQueue'

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
        const taskQueueStore = useTaskQueueStore();
        const historyStore = useHistoryStore();
        const coreMaterialManufacturers = [];
        const localData = {};
        const onlyManufacturer = null;

        if (this.masStore.coreAdviserWeights == null) {
            this.masStore.coreAdviserWeights = coreAdviserWeights;
        }

        const errorMessage = "";
        const loading = false;
        const forceUpdate = 0;
        const subscriptions = [];

        const changeMadeByUser = false;

        return {
            taskQueueStore,
            historyStore,
            localData,
            onlyManufacturer,
            coreMaterialManufacturers,
            errorMessage,
            loading,
            forceUpdate,
            subscriptions,
            changeMadeByUser,
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
        this.getMaterialNames();
        
        setTimeout(() => {this.assignLocalData(this.masStore.mas.magnetic.core);}, 1000);
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

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "coreShapeProcessed") {
                    if (args[0]) {
                        if (this.changeMadeByUser) {
                            this.changeMadeByUser = false;
                            const shape = args[1];

                            if (this.localData.material == null) {
                                this.masStore.mas.magnetic.core.functionalDescription.shape = shape;
                            }
                            else {
                                this.changeMadeByUser = true;
                                var mas = deepCopy(this.masStore.mas);
                                mas.magnetic.core.functionalDescription.shape = shape;
                                const coreHash = JSON.stringify(mas.magnetic.core);

                                if (!this.isStackable(shape)) {
                                    mas.magnetic.core.functionalDescription.numberStacks = 1;
                                }

                                checkAndFixMas(mas).then(response => {
                                    mas = response;
                                    if (coreHash != JSON.stringify(mas.magnetic.core)) {
                                        this.taskQueueStore.processCore(mas.magnetic.core);
                                    }
                                })
                                .catch(error => {
                                    console.error(error)
                                });
                            }

                        }
                        else {
                            this.localData["shapeFamily"] = args[1].family.toUpperCase();
                        }
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreMaterialProcessed") {
                    if (args[0]) {
                        this.localData["materialManufacturer"] = args[1].manufacturerInfo.name;
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreMaterialChanged") {
                    if (args[0]) {
                        const core = args[1];
                        this.masStore.mas.magnetic.core = core;
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreProcessed") {
                    if (args[0]) {
                        const core = args[1];
                        if (this.changeMadeByUser) {
                            this.masStore.mas.magnetic.core = core;
                            this.changeMadeByUser = false;
                            this.masStore.mas.magnetic.manufacturerInfo = null;
                            this.taskQueueStore.generateBobbinFromCoreShape(core, this.masStore.mas.inputs.designRequirements.wiringTechnology);
                        }
                        else {
                            this.localData["numberStacks"] = deepCopy(core.functionalDescription.numberStacks);
                            this.localData["gapping"] = deepCopy(core.functionalDescription.gapping);
                            this.forceUpdate += 1;
                        }
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "bobbinFromCoreShapeGenerated") {
                    if (args[0]) {
                        const bobbin = args[1];
                        this.masStore.mas.magnetic.coil.turnsDescription = null;
                        this.masStore.mas.magnetic.coil.layersDescription = null;
                        this.masStore.mas.magnetic.coil.sectionsDescription = null;
                        this.masStore.mas.magnetic.coil.bobbin = bobbin;
                        this.historyStore.addToHistory(this.masStore.mas);
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreMaterialsGotten") {
                    if (args[0]) {
                        const coreMaterials = args[1];
                        this.coreMaterialNames = coreMaterials;
                        this.coreMaterialManufacturers = Object.keys(coreMaterials);
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreAdvised") {
                    if (args[0]) {
                        const magnetic = args[1];
                        this.masStore.mas.magnetic.core = magnetic.core;
                        this.taskQueueStore.generateBobbinFromCoreShape(magnetic.core, this.masStore.mas.inputs.designRequirements.wiringTechnology);
                        this.taskQueueStore.calculateNumberTurns(magnetic.coil.functionalDescription[0].numberTurns, this.masStore.mas.inputs.designRequirements);
                        this.errorMessage = "";
                        this.assignLocalData(magnetic.core);
                        this.loading = false;
                    }
                    else {
                        console.error(args[1])
                        this.errorMessage = "No core can be advised. You are on your own."
                        setTimeout(() => {this.errorMessage = ""}, 10000);
                    }
                }
                if (name == "numberTurnsCalculated") {
                    if (args[0]) {
                        const numberTurns = args[1];

                        const windings = this.masStore.mas.magnetic.coil.functionalDescription;
                        for (var i = 0; i < numberTurns.length; i++) {
                            windings[i].numberTurns = numberTurns[i];
                        }
                        this.masStore.mas.magnetic.coil.functionalDescription = windings;
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
                    this.taskQueueStore.processCoreShape(core.functionalDescription.shape);
                }
            }
            else {
                this.localData["shape"] = deepCopy(core.functionalDescription.shape.name);
                this.localData["shapeFamily"] = deepCopy(core.functionalDescription.shape.family).toUpperCase();
            }

            if (typeof(core.functionalDescription.material) == 'string') {
                if (core.functionalDescription.material != "") {
                    this.localData["material"] = deepCopy(core.functionalDescription.material);
                    this.taskQueueStore.processCoreMaterial(core.functionalDescription.material);
                }
            }
            else {
                this.localData["material"] = deepCopy(core.functionalDescription.material.name);
                this.localData["materialManufacturer"] = core.functionalDescription.material.manufacturerInfo.name;
            }

            if (core.functionalDescription.shape != "" && core.functionalDescription.material != "") {
                this.taskQueueStore.processCore(core);
            }
        },
        getMaterialNames() {
            this.taskQueueStore.getCoreMaterials(this.onlyManufacturer);
        },
        async coreShapeUpdated(name, family) {
            this.localData.shapeFamily = family;
            this.localData.shape = name;
            this.shapeUpdated(name);
        },
        async shapeUpdated(value) {
            this.masStore.mas.magnetic.core.name = "Custom";
            this.changeMadeByUser = true;
            this.taskQueueStore.processCoreShape(value);
        },
        materialUpdated(value) {
            this.changeMadeByUser = true;
            this.taskQueueStore.changeCoreMaterial(value, deepCopy(this.masStore.mas.magnetic.core));
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
            if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                this.$settingsStore.adviserSettings.coreAdviseMode = "standard cores";

                this.taskQueueStore.adviseCore(this.masStore.mas.inputs, this.$stateStore.hasCurrentApplicationMirroredWindings(), this.masStore.coreAdviserWeights, this.$settingsStore.adviserSettings);
            }
            else {
                console.error("No operating points found")
                this.loading = false;
            }
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
            <CoreShapeSelector
                :dataTestLabel="dataTestLabel + '-AdvancedCoreInfo'"
                :readOnly="readOnly"
                :masStore="masStore"
                @update="coreShapeUpdated"
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
                v-if="localData.shape != '' && localData.shapeFamily != null && localData.shape != null && !loading && masStore.mas.magnetic.core.functionalDescription.type == 'two-piece set'&& masStore.mas.magnetic.core.processedDescription != null"
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
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                />
            </div>

            <BasicCoreSubmenu 
                v-if="enableSubmenu && !readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-BasicCoreSubmenu'"
                :masStore="masStore"
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
