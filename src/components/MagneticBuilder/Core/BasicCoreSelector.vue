<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import CoreGappingSelector from '/WebSharedComponents/Common/CoreGappingSelector.vue'
import Magnetic3DVisualizer from '/WebSharedComponents/Common/Magnetic3DVisualizer.vue'
import BasicCoreSubmenu from './BasicCoreSubmenu.vue'
import { coreAdviserWeights, defaultUngappedGapping } from '/WebSharedComponents/assets/js/defaults.js'
import CoreInfo from './CoreInfo.vue'
import CoreShapeSelector from './CoreShapeSelector.vue'
import { useHistoryStore } from '../../../stores/history'
import { useTaskQueueStore } from '../../../stores/taskQueue'

import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>

export default {
    emits: ['customizeCore', 'gappingUpdated', 'coreProcessed'],
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
        enableAutoSimulation: {
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
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        forceUpdateVisualizer: {
            type: Number,
            default: 0,
        },
        imageUpToDate: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const historyStore = useHistoryStore();
        const coreMaterialManufacturers = [];
        const coreMaterialNames = {};
        const localData = {};
        const onlyManufacturer = null;

        if (this.masStore.coreAdviserWeights == null) {
            this.masStore.coreAdviserWeights = coreAdviserWeights;
        }

        const errorMessage = "";
        const loading = false;
        const forceUpdate = 0;
        const subscriptions = [];
        const pendingBobbinThickness = null; // Store bobbin thickness during material change

        return {
            taskQueueStore,
            historyStore,
            localData,
            onlyManufacturer,
            coreMaterialManufacturers,
            coreMaterialNames,
            errorMessage,
            loading,
            forceUpdate,
            subscriptions,
            pendingBobbinThickness,
        }
    },
    computed: {
    },
    watch: {
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.taskQueueStore.processCore(this.masStore.mas.magnetic.core);
            },
          deep: true
        },
    },
    created () {
    },
    mounted () {
        this.getMaterialNames();
        
        setTimeout(() => {this.assignLocalData(this.masStore.mas.magnetic.core);}, 1000);
        this.subscriptions.push(this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.assignLocalData(this.masStore.mas.magnetic.core);
            }
        }));
        this.subscriptions.push(this.masStore.$onAction((action) => {
            if (action.name == "importedMas") {
                this.assignLocalData(this.masStore.mas.magnetic.core);
            }
        }));

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "coreProcessed") {
                    if (args[0]) {
                        const core = args[1];
                        if (this.changeMadeByUser) {
                            this.masStore.mas.magnetic.core = core;
                            this.changeMadeByUser = false;
                            this.masStore.mas.magnetic.manufacturerInfo = null;
                        this.taskQueueStore.generateBobbinFromCoreShape(core, this.masStore.mas.inputs.designRequirements.wiringTechnology).then((bobbin) => {
                                this.masStore.mas.magnetic.coil.bobbin = bobbin;
                                // Restore bobbin thickness values after regeneration
                                if (this.pendingBobbinThickness && bobbin?.processedDescription) {
                                    if (this.pendingBobbinThickness.wallThickness !== undefined) {
                                        bobbin.processedDescription.wallThickness = this.pendingBobbinThickness.wallThickness;
                                    }
                                    if (this.pendingBobbinThickness.columnThickness !== undefined) {
                                        bobbin.processedDescription.columnThickness = this.pendingBobbinThickness.columnThickness;
                                    }
                                    this.pendingBobbinThickness = null;
                                }
                                // Note: BasicCoilSelector listens for bobbinFromCoreShapeGenerated 
                                // and will automatically trigger rewinding
                            });
                        }
                        else {
                        }
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "masCheckedAndFixed") {
                    if (args[0]) {
                        const mas = args[1];
                        if (this.masStore.mas == null) {
                            this.taskQueueStore.processCore(mas.magnetic.core);
                        }
                        else {
                            const coreHash = JSON.stringify(this.masStore.mas.magnetic.core);

                            if (coreHash != JSON.stringify(mas.magnetic.core)) {
                                this.taskQueueStore.processCore(mas.magnetic.core);
                            }
                            else if (this.changeMadeByUser) {
                                // Core hash is the same but user changed shape - still need to regenerate bobbin
                                this.masStore.mas.magnetic.core = mas.magnetic.core;
                                this.changeMadeByUser = false;
                                // Only generate bobbin if material is set (backend requires it)
                                if (mas.magnetic.core.functionalDescription?.material) {
                                    this.taskQueueStore.generateBobbinFromCoreShape(
                                        mas.magnetic.core,
                                        this.masStore.mas.inputs.designRequirements.wiringTechnology
                                    ).then((bobbin) => {
                                        this.masStore.mas.magnetic.coil.bobbin = bobbin;
                                    });
                                }
                            }
                        }
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
        isStackable() {
            let shapeFamily = this.masStore.mas.magnetic.core.functionalDescription.shape.family;

            if (shapeFamily == "e" || shapeFamily == "planar e" || shapeFamily == "t" || shapeFamily == "u") {
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
                    this.taskQueueStore.processCoreShape(core.functionalDescription.shape).then((coreShape) => {
                        this.localData["shapeFamily"] = coreShape.family;  
                    })
                    .catch(error => {
                        console.error(error);
                    });
                }
            }
            else {
                this.localData["shape"] = deepCopy(core.functionalDescription.shape.name);
                this.localData["shapeFamily"] = deepCopy(core.functionalDescription.shape.family);
            }

            if (typeof(core.functionalDescription.material) == 'string') {
                if (core.functionalDescription.material != "") {
                    this.localData["material"] = deepCopy(core.functionalDescription.material);
                    this.taskQueueStore.processCoreMaterial(core.functionalDescription.material).then((coreMaterial) => {
                        this.localData["materialManufacturer"] = coreMaterial.manufacturerInfo.name;
                    })
                    .catch(error => {
                        console.error(error);
                    });
                }
            }
            else {
                this.localData["material"] = deepCopy(core.functionalDescription.material.name);
                this.localData["materialManufacturer"] = core.functionalDescription.material.manufacturerInfo.name;
            }

            if (core.functionalDescription.shape != "" && core.functionalDescription.material != "") {
                this.taskQueueStore.processCore(core).then((core) => {
                    this.localData["numberStacks"] = deepCopy(core.functionalDescription.numberStacks);
                    this.localData["gapping"] = deepCopy(core.functionalDescription.gapping);
                    this.forceUpdate += 1;
                })
                .catch(error => {
                    console.error(error);
                });
            }
        },
        getMaterialNames() {
            this.taskQueueStore.getCoreMaterials(this.onlyManufacturer).then((coreMaterialNames) => {
                this.coreMaterialNames = coreMaterialNames;
                this.coreMaterialManufacturers = Object.keys(coreMaterialNames);
            })
            .catch(error => {
                console.error(error);
            });
        },
        async coreShapeUpdated(name, family) {
            this.localData.shapeFamily = family;
            this.localData.shape = name;
            this.shapeUpdated(name);
        },
        async shapeUpdated(value) {
            console.warn("value")
            console.warn(value)
            console.warn(value)
            if (value.startsWith("Custom")) {
                const mas = deepCopy(this.masStore.mas);
                this.taskQueueStore.checkAndFixMas(mas);
            }
            else {
                this.masStore.mas.magnetic.core.name = "Custom";
                this.changeMadeByUser = true;
                this.taskQueueStore.processCoreShape(value).then((shape) => {
                    if (this.localData.material == null) {
                        this.masStore.mas.magnetic.core.functionalDescription.shape = shape;
                        // Cannot generate bobbin without material - backend requires it
                    }
                    else {
                        const mas = deepCopy(this.masStore.mas);
                        mas.magnetic.core.functionalDescription.shape = shape;

                        if (!this.isStackable()) {
                            mas.magnetic.core.functionalDescription.numberStacks = 1;
                        }

                        this.taskQueueStore.checkAndFixMas(mas);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
            }
        },
        materialUpdated(value) {
            this.changeMadeByUser = true;
            
            // Save current bobbin wall and column thickness before material change
            const currentBobbin = this.masStore.mas.magnetic.coil.bobbin;
            this.pendingBobbinThickness = {
                wallThickness: currentBobbin?.processedDescription?.wallThickness,
                columnThickness: currentBobbin?.processedDescription?.columnThickness
            };
            
            this.taskQueueStore.changeCoreMaterial(value, deepCopy(this.masStore.mas.magnetic.core)).then((core) => {
                // Ensure default gapping is set so core losses can be calculated
                if (!core.functionalDescription.gapping || (core.functionalDescription.type == 'two-piece set' && core.functionalDescription.gapping.length === 0)) {
                    core.functionalDescription.gapping = deepCopy(defaultUngappedGapping);
                }
                this.masStore.mas.magnetic.core = core;

                this.taskQueueStore.processCore(this.masStore.mas.magnetic.core).then((core) => {
                    this.localData["numberStacks"] = deepCopy(core.functionalDescription.numberStacks);
                    this.localData["gapping"] = deepCopy(core.functionalDescription.gapping);
                    this.forceUpdate += 1;
                    // Note: Bobbin thickness will be restored in coreProcessed handler after bobbin regeneration
                })
                .catch(error => {
                    console.error(error);
                });
                
                // Ensure coil has at least one turn so core losses can be calculated
                const coil = this.masStore.mas.magnetic.coil;
                const hasValidCoil = coil?.functionalDescription?.some(w => w.numberTurns > 0);
                if (!hasValidCoil && coil?.functionalDescription?.length > 0) {
                    coil.functionalDescription[0].numberTurns = 1;
                }
            }) 
        },
        numberStacksUpdated(value) {
            this.masStore.mas.magnetic.core.functionalDescription.numberStacks = value;
            this.shapeUpdated(this.localData.shape)
            this.historyStore.addToHistory(this.masStore.mas);
        },
        gappingUpdated(value) {
            this.masStore.mas.magnetic.core.functionalDescription.gapping = value;
            this.$emit('gappingUpdated');
            // Set image as outdated immediately
            this.$emit('coreProcessingStarted');
            this.taskQueueStore.processCore(this.masStore.mas.magnetic.core).then((core) => {
                this.masStore.mas.magnetic.core = core;
                this.historyStore.addToHistory(this.masStore.mas);
                this.$emit('coreProcessed');
            })
            .catch(error => {
                console.error(error);
            });
        },
        adviseCoreRequested() {
            this.loading = true;
            setTimeout(() => this.adviseCore(), 100);
        },
        adviseCore() {
            if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                this.$settingsStore.adviserSettings.coreAdviseMode = "standard cores";

                this.taskQueueStore.adviseCore(this.masStore.mas.inputs, this.$stateStore.hasCurrentApplicationMirroredWindings(), this.masStore.coreAdviserWeights, this.$settingsStore.adviserSettings).then((magnetic) => {
                    this.masStore.mas.magnetic.core = magnetic.core;
                    this.taskQueueStore.generateBobbinFromCoreShape(magnetic.core, this.masStore.mas.inputs.designRequirements.wiringTechnology).then((bobbin) => {
                        this.masStore.mas.magnetic.coil.turnsDescription = null;
                        this.masStore.mas.magnetic.coil.layersDescription = null;
                        this.masStore.mas.magnetic.coil.sectionsDescription = null;
                        this.masStore.mas.magnetic.coil.bobbin = bobbin;
                        setTimeout(() => {this.historyStore.addToHistory(this.masStore.mas);}, 1000);
                    })
                    .catch(error => {
                        console.error(error);
                    });

                    this.taskQueueStore.calculateNumberTurns(magnetic.coil.functionalDescription[0].numberTurns, this.masStore.mas.inputs.designRequirements).then((numberTurns) => {
                        const windings = this.masStore.mas.magnetic.coil.functionalDescription;
                        for (let i = 0; i < numberTurns.length; i++) {
                            windings[i].numberTurns = numberTurns[i];
                        }
                        this.masStore.mas.magnetic.coil.functionalDescription = windings;
                    })
                    .catch(error => {
                        console.error(error);
                    });

                    this.errorMessage = "";
                    this.assignLocalData(magnetic.core);
                    this.loading = false;
                })
                .catch(error => {
                    console.error(error)
                    this.errorMessage = "No core can be advised. You are on your own."
                    setTimeout(() => {this.errorMessage = ""}, 10000);
                });
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
        <div class="card bg-dark border-0 shadow-lg">
            <div class="card-header border-bottom border-secondary px-3 py-2">
                <div class="d-flex align-items-center">
                    <i class="fa-solid fa-cube text-primary me-2"></i>
                    <h6 class="card-title mb-0 text-white">Core Configuration</h6>
                </div>
            </div>
            <div class="card-body px-3 py-2">
                <div
                    v-if="useVisualizers && masStore.mas.magnetic.core.functionalDescription != null"
                    class="row mb-4"
                    style="height: 25vh"
                    :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
                >
                    <Magnetic3DVisualizer 
                        :dataTestLabel="`${dataTestLabel}-Magnetic3DVisualizer`"
                        :magnetic="masStore.mas.magnetic"
                        :forceUpdate="forceUpdateVisualizer"
                        :showCore="true"
                        :showTurns="true"
                        :showBobbin="true"
                        :loadingGif="$settingsStore.loadingGif"
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color']"
                    />
                </div>
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
                class="col-12 mb-1 text-start ms-2"
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
                class="col-12 mb-1 text-start ms-2"
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
                v-if="localData.shape != '' && localData.shapeFamily != null && localData.shape != null && !loading && masStore.mas.magnetic.core.functionalDescription.type == 'two-piece set' && masStore.mas.magnetic.core.processedDescription != null"
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
                class="col-12 p-0"
                >

                <CoreInfo 
                    v-if="!loading && enableSimulation"
                    ref="coreInfo"
                    :dataTestLabel="dataTestLabel + '-CoreInfo'"
                    :advancedMode="$settingsStore.magneticBuilderSettings.advancedMode"
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                    :enableAutoSimulation="enableAutoSimulation"
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
    </div>
</template>
