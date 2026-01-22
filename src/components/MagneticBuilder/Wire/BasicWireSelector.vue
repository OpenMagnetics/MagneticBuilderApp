<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import BasicWireSubmenu from './BasicWireSubmenu.vue'
import WireInfo from './WireInfo.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { useHistoryStore } from '../../../stores/history'
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
        windingIndex: {
            type: Number,
            default: 0,
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
        const loading = false; 
        const forceUpdate = 0; 
        const wireTypes = {};
        const wireConductingDiameters = [];
        const wireHeights = [];
        const wireWidths = [];
        const wireStandards = []; 
        const wireCoatings = []; 
        const errorMessage = ""; 
        const localData = {
            type: null,
            standard: "IEC 60317",
            roundConductingDiameter: null,
            litzStrandConductingDiameter: null,
            coating: null,
            numberConductors: 13,
            rectangularConductingHeight: 0.001,
            rectangularConductingWidth: 0.002,
            foilConductingHeight: 0.005,
            foilConductingWidth: 0.0001,
        };
        if (typeof(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire) == 'string' && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy") {
            taskQueueStore.processWire(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex]);
        }

        const blockingRebounds = false;
        const wireHash = "";
        const subscriptions = [];

        return {
            taskQueueStore,
            blockingRebounds,
            wireHash,
            historyStore,
            localData,
            wireTypes,
            wireConductingDiameters,
            wireHeights,
            wireWidths,
            wireStandards,
            wireCoatings,
            forceUpdate,
            loading,
            errorMessage,
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
    },
    watch: {
        // 'masStore.mas.magnetic.coil.functionalDescription': {
        //     handler(newValue, oldValue) {
        //         const newWireHash = JSON.stringify(newValue[this.windingIndex].wire);
        //         if (!this.blockingRebounds && newWireHash != this.wireHash) {
        //             this.assignLocalData(newValue[this.windingIndex].wire)
        //             this.blockingRebounds = true;
        //             this.wireHash = newWireHash;
        //             setTimeout(() => this.blockingRebounds = false, 10);
        //         }
        //     },
        //   deep: true
        // },
    },
    mounted () {

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "wireProcessed") {
                    if (args[0]) {
                        this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire = args[1];
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "newWireCreated") {
                    if (args[0]) {
                        this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire = args[1];
                        if (!this.$stateStore.loadingDesign) {
                            this.cleanCoil();
                            this.$emit("wireUpdated", this.windingIndex);
                        }
                    }
                    else {
                        console.error(args[1])
                    }
                }
            });
        }))

        if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != null) {
            this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
        }
        this.subscriptions.push(this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
            }
        }));
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        cleanCoil() {
            this.masStore.mas.magnetic.coil.turnsDescription = null;
            this.masStore.mas.magnetic.coil.layersDescription = null;
            this.masStore.mas.magnetic.coil.sectionsDescription = null;
        },
        assignLocalData(wire) {
            this.errorMessage = "";
            if (wire != "" && wire.type != null) {

                this.localData["type"] = wire.type;
                if (wire.standard != null) {
                    this.localData["standard"] = wire.standard;
                }
                else {
                    this.localData["standard"] = "IEC 60317";
                }


                if (wire.type == "round") {
                    this.localData["roundConductingDiameter"] = wire.standardName;
                    this.taskQueueStore.getWireCoatingLabel(wire).then((coatingLabel) => {
                        this.localData["coating"] = coatingLabel;
                    });
                    this.localData["numberConductors"] = 1;
                }
                else if (wire.type == "litz") {
                    if (typeof(wire.strand) == 'string') {
                        this.taskQueueStore.getWireByName(wire.strand).then((wire) => {
                            this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire.strand = wire;
                        });
                    }

                    this.localData["standard"] =  wire.strand.standard;
                    this.localData["litzStrandConductingDiameter"] = wire.strand.standardName;
                    this.localData["numberConductors"] = wire.numberConductors;
                }
                else if (wire.type == "rectangular") {
                    this.taskQueueStore.resolveDimensionWithTolerance(wire.conductingHeight).then((value) => {
                        this.localData["rectangularConductingHeight"] = value;
                    });
                    this.taskQueueStore.resolveDimensionWithTolerance(wire.conductingWidth).then((value) => {
                        this.localData["rectangularConductingWidth"] = value;
                    });
                    this.localData["numberConductors"] = 1;
                }
                else if (wire.type == "foil") {
                    if (this.masStore.mas.magnetic.coil.bobbin != "Dummy"){
                        this.localData["foilConductingHeight"] = this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].height * 0.9 // hardcoded;
                    }
                    this.taskQueueStore.resolveDimensionWithTolerance(wire.conductingWidth).then((value) => {
                        this.localData["foilConductingWidth"] = value;
                    });
                    this.localData["numberConductors"] = 1;
                }
                this.taskQueueStore.getWireCoatingLabel(wire).then((coatingLabel) => {
                    this.localData["coating"] = coatingLabel;
                });
                this.forceUpdate += 1;
            }
            this.getWireTypes();
            this.getWireStandards();
            this.getWireDiameters();
            this.getWireCoatings();
        },
        assignWire() {
            this.errorMessage = "";
            this.taskQueueStore.createNewWire(this.localData, this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
        },
        getWireTypes() {
            this.taskQueueStore.getAvailableWires().then((wireTypes) => {
                this.wireTypes = wireTypes;
            });
        },
        getWireStandards() {
            this.taskQueueStore.getAvailableWireStandards().then((wireTypes) => {
                this.wireStandards = wireTypes;
            });
        },
        getWireDiameters() {
            try {
                this.taskQueueStore.getUniqueWireDiameters(this.localData.standard).then((wireConductingDiameters) => {
                    this.wireConductingDiameters = wireConductingDiameters;
                });
            }
            catch (e) {
                setTimeout(() => this.getWireDiameters(), 100);
            }
        },
        getWireCoatings() {
            if (this.localData.type != null) {

                this.taskQueueStore.getCoatingLabelsByType(this.localData.type).then((labels) => {
                    this.wireCoatings = labels;
                    if (this.wireCoatings.length > 0 && !this.wireCoatings.includes(this.localData["coating"])) {
                        this.localData["coating"] = this.wireCoatings[0];
                    }
                });
            }
        },
        wireStandardUpdated() {
            this.getWireDiameters();
            this.assignWire();
        },
        wireCoatingUpdated() {
            this.assignWire();
        },
        wireUpdated() {
            this.assignWire();
        },
        isAnyLitzLoaded() {
            return this.localData["litzStrandConductingDiameter"] != null
        },
        isAnyRoundLoaded() {
            return this.localData["roundConductingDiameter"] != null
        },
        isAnyRectangularLoaded() {
            return this.localData["rectangularConductingWidth"] != null
        },
        isAnyFoilLoaded() {
            return this.localData["foilConductingWidth"] != null
        },
        wireTypeUpdated() {
            try {

                this.getWireCoatings();

                const newType = this.localData.type;
                if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" &&
                    this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire.type != null) {
                    const oldWire = deepCopy(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
                    const effectiveFrequency = this.masStore.mas.inputs.operatingPoints[0].excitationsPerWinding[0].current.processed.effectiveFrequency;

                    if ((newType == "litz" && !this.isAnyLitzLoaded()) ||
                        (newType == "round" && !this.isAnyRoundLoaded()) ||
                        (newType == "rectangular" && !this.isAnyRectangularLoaded()) ||
                        (newType == "foil" && !this.isAnyFoilLoaded())) {

                        this.taskQueueStore.calculateEquivalentWire(oldWire, newType, effectiveFrequency).then((wire) => {
                            this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire = wire;
                            this.assignLocalData(wire);
                            this.assignWire();
                        });

                    }
                    else {
                        this.assignWire();
                    }
                }
            }
            catch(e) {
                // console.error(e)
                setTimeout(() => this.wireTypeUpdated(), 100);
            }
        },
        adviseWireRequested() {
            this.loading = true;
            setTimeout(() => this.adviseWire(), 100);
        },
        adviseAllWiresRequested() {
            this.loading = true;
            setTimeout(() => this.adviseAllWires(), 100);
        },
        adviseAllWires() {
            if (this.masStore.mas.inputs.operatingPoints.length > 0) {

                // this.taskQueueStore.checkAndFixMas(this.masStore.mas).then(() => {
                // });

                this.taskQueueStore.adviseAllWires(this.masStore.mas)
                .then((coil) => {
                    this.errorMessage = "";
                    this.masStore.mas.magnetic.coil.functionalDescription = coil.functionalDescription;
                    this.assignLocalData(coil.functionalDescription[this.windingIndex].wire);
                    this.cleanCoil();

                    this.$stateStore.wire2DVisualizerState.plotCurrentViews = {};
                    setTimeout(() => this.loading = false, 100);

                })
                .catch(error => {
                    this.errorMessage = "Our advisers could not find a wire. Sorry, you are on your own!";
                    setTimeout(() => {this.errorMessage = ""}, 10000);
                    this.loading = false;
                    console.error(error);
                })
            }
            else {
                console.error("No operating points found")
                this.loading = false;
            }
        },
        adviseWire() {
            if (this.masStore.mas.inputs.operatingPoints.length > 0) {

                // this.taskQueueStore.checkAndFixMas(this.masStore.mas).then(() => {
                // });

                this.taskQueueStore.adviseWire(this.masStore.mas, this.windingIndex)
                .then((winding) => {
                    this.errorMessage = "";
                    this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex] = winding;
                    this.assignLocalData(winding.wire);
                    this.cleanCoil();

                    this.$stateStore.wire2DVisualizerState.plotCurrentViews = {};
                    setTimeout(() => this.loading = false, 100);

                })
                .catch(error => {
                    this.errorMessage = "Our advisers could not find a wire. Sorry, you are on your own!";
                    this.loading = false;
                    setTimeout(() => {this.errorMessage = ""}, 10000);
                    console.error(error);
                })
            }
            else {
                console.error("No operating points found")
                this.loading = false;
            }
        },
        customizeWire() {
        },
        loadWire() {
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row" v-tooltip="styleTooltip">
            <img :data-cy="dataTestLabel + '-BasicWireSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.wireType"
                v-if="!loading"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-WireType'"
                :name="'type'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :options="wireTypes"
                :labelWidthProportionClass="'col-5'"
                :selectStyleClass="'col-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="wireTypeUpdated"
            />
            <h5 v-if="!loading && localData.type == null" class="text-danger my-2">Select a type for the wire</h5>

            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.wireStandard"
                v-if="!loading && localData.type == 'round' || localData.type == 'litz' && localData.standard != null"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-WireStandard'"
                :name="'standard'"
                :titleSameRow="true"
                :justifyContent="true"
                :labelWidthProportionClass="'col-3'"
                :selectStyleClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                v-model="localData"
                :options="wireStandards"
                @update="wireStandardUpdated"
            />
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.wireRoundConductingDiameter"
                v-if="!loading && localData.type == 'round'"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-WireConductingDiameter'"
                :replaceTitle="'Cond. diameter'"
                :name="'roundConductingDiameter'"
                :titleSameRow="true"
                :justifyContent="true"
                :labelWidthProportionClass="'col-5'"
                :selectStyleClass="'col-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                v-model="localData"
                :options="wireConductingDiameters"
                @update="wireUpdated"
            />
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.wireLitzStrandConductingDiameter"
                v-if="!loading && localData.type == 'litz'"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-StrandConductingDiameter'"
                :replaceTitle="'Cond. diameter'"
                :name="'litzStrandConductingDiameter'"
                :labelWidthProportionClass="'col-6'"
                :selectStyleClass="'col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :options="wireConductingDiameters"
                @update="wireUpdated"
            />
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.wireCoating"
                v-if="!loading && localData.type != null"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-WireCoating'"
                :name="'coating'"
                :titleSameRow="true"
                :justifyContent="true"
                :labelWidthProportionClass="'col-3'"
                :selectStyleClass="'col-9'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                v-model="localData"
                :options="wireCoatings"
                @update="wireCoatingUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireLitzNumberConductors"
                v-if="!loading && localData.type == 'litz'"
                :disabled="readOnly"
                :name="'numberConductors'"
                :replaceTitle="'No. Strands'"
                :unit="null"
                :dataTestLabel="dataTestLabel + '-NumberConductors'"
                :numberDecimals="0"
                :min="1"
                :max="1000000"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :labelWidthProportionClass="'col-xs-12 col-md-7'"
                :valueWidthProportionClass="'col-xs-8 col-md-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="wireUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireRectangularConductingHeight"
                v-if="!loading && localData.type == 'rectangular'"
                :disabled="readOnly"
                :name="'rectangularConductingHeight'"
                :replaceTitle="'Cond. Height'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-WireConductingHeight'"
                :min="1e-9"
                :max="0.1"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="wireUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireRectangularConductingWidth"
                v-if="!loading && localData.type == 'rectangular'"
                :disabled="readOnly"
                :name="'rectangularConductingWidth'"
                :replaceTitle="'Cond. Width'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-WireConductingWidth'"
                :min="1e-9"
                :max="0.1"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="wireUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireFoilConductingHeight"
                v-if="!loading && localData.type == 'foil'"
                :disabled="readOnly"
                :name="'foilConductingHeight'"
                :replaceTitle="'Cond. Height'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-WireConductingHeight'"
                :min="1e-9"
                :max="0.1"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="wireUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireFoilConductingWidth"
                v-if="!loading && localData.type == 'foil'"
                :disabled="readOnly"
                :name="'foilConductingWidth'"
                :replaceTitle="'Cond. Width'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-WireConductingWidth'"
                :min="1e-9"
                :max="0.1"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="wireUpdated"
            />

            <div v-if="enableSimulation" class="col-12 p-0">
                <WireInfo 
                    v-if="!loading"
                    :dataTestLabel="dataTestLabel + '-WireInfo'"
                    :advancedMode="$settingsStore.magneticBuilderSettings.advancedMode"
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                    :windingIndex="windingIndex"
                />
            </div>

            <BasicWireSubmenu
                v-if="enableSubmenu && !readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-BasicWireSubmenu'"
                :enableCustomize="false"
                :severalWires="masStore.mas.magnetic.coil.functionalDescription.length > 1"
                :enableAdvise="!loading"
                :allowAdvise="enableAdvise"
                @adviseWire="adviseWireRequested"
                @adviseAllWires="adviseAllWiresRequested"
                @customizeCore="customizeWire"
                @loadCore="loadWire"
            />

            <label class="text-danger col-12 pt-1" style="font-size: 1em">{{errorMessage}}</label>

        </div>
    </div>
</template>
