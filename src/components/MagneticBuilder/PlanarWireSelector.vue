<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import BasicWireSubmenu from './BasicWireSubmenu.vue'
import AdvancedWireInfo from './AdvancedWireInfo.vue'
import BasicWireInfo from './BasicWireInfo.vue'
import { toTitleCase, checkAndFixMas, deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { useHistoryStore } from '../../stores/history'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
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
        const historyStore = useHistoryStore();
        const loading = false; 
        const forceUpdate = 0; 
        const wireThicknesses = [];
        const errorMessage = ""; 
        var localData = {
            wireThickness: 0.001,
            wireWidth: 0.002,
        };
        if (typeof(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire) == 'string' && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy") {
            this.$mkf.ready.then(_ => {

                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire = JSON.parse(this.$mkf.get_wire_data(JSON.stringify(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex])));
            });
        }

        const blockingRebounds = false;
        const wireHash = "";

        return {
            blockingRebounds,
            wireHash,
            historyStore,
            localData,
            wireThicknesses,
            forceUpdate,
            loading,
            errorMessage,
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
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                const newWireHash = JSON.stringify(newValue[this.windingIndex].wire);
                if (!this.blockingRebounds && newWireHash != this.wireHash) {
                    this.assignLocalData(newValue[this.windingIndex].wire)
                    this.blockingRebounds = true;
                    this.wireHash = newWireHash;
                    setTimeout(() => this.blockingRebounds = false, 10);
                }
            },
          deep: true
        },
    },
    mounted () {
        this.getWireThicknesses();
        if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != null) {
            this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
        }
        this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
            }
        })
    },
    methods: {
        cleanCoil() {
            this.masStore.mas.magnetic.coil.turnsDescription = null;
            this.masStore.mas.magnetic.coil.layersDescription = null;
            this.masStore.mas.magnetic.coil.sectionsDescription = null;
        },
        assignLocalData(wire) {
            this.errorMessage = "";
            this.$mkf.ready.then(_ => {
                if (wire != "" && wire.type != null) {
                    this.localData["wireThickness"] = wire.standardName;
                    this.localData["wireWidth"] = this.$mkf.resolve_dimension_with_tolerance(JSON.stringify(wire.conductingWidth));
                    this.forceUpdate += 1;
                }
                this.getWireThicknesses();
            });
        },
        assignWire() {
            this.errorMessage = "";
            this.$mkf.ready.then(_ => {
                var wire = {};
                if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy") {
                    wire = this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire;
                }

                const resultWire = this.$mkf.get_wire_data_by_standard_name(this.localData["wireThickness"]);
                if (resultWire.startsWith("Exception")) {
                    console.error(resultWire);
                    return;
                }

                wire = JSON.parse(resultWire);
                wire.conductingWidth = {};
                wire.conductingWidth.nominal = this.localData["wireWidth"];
                wire.outerWidth = {};
                wire.outerWidth.nominal = this.localData["wireWidth"];
                wire.outerHeight = {};
                wire.outerHeight.nominal = wire.conductingHeight.nominal;
                wire.numberConductors = 1;
                wire.material = "copper";

                this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] = null;
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire = wire;
                this.cleanCoil();
                this.$emit("wireUpdated", this.windingIndex);
                // this.historyStore.addToHistory(this.masStore.mas);
            });
        },
        getWireThicknesses() {
            this.$mkf.ready.then(_ => {
                this.wireThicknesses = [];
                const wireThicknessesHandle = this.$mkf.get_planar_thicknesses();
                for (var i = wireThicknessesHandle.size() - 1; i >= 0; i--) {
                    const wireThickness = wireThicknessesHandle.get(i);
                    this.wireThicknesses.push(toTitleCase(wireThickness));
                }

                this.wireThicknesses.sort(function(a, b){
                    a = Number(a.split(" ")[0]);
                    b = Number(b.split(" ")[0]);
                    return a - b;
                });

            });
        },
        wireUpdated() {
            this.assignWire();
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
            this.$mkf.ready.then(_ => {
                if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                    const settings = JSON.parse(this.$mkf.get_settings());
                    settings["coilMaximumLayersPlanar"] = 24;
                    this.$mkf.set_settings(JSON.stringify(settings));

                    checkAndFixMas(this.masStore.mas, this.$mkf).then(response => {
                        this.masStore.mas = response;

                        const resultMasWithCoil = this.$mkf.calculate_advised_coil(JSON.stringify(this.masStore.mas));
                        if (resultMasWithCoil.startsWith("Exception")) {
                            this.errorMessage = "Our advisers could not find a wire. Sorry, you are on your own!";
                            setTimeout(() => {this.errorMessage = ""}, 10000);
                            this.loading = false;
                            console.error(resultMasWithCoil);
                            return;
                        }
                        this.errorMessage = "";
                        const masWithCoil = JSON.parse(resultMasWithCoil);

                        this.masStore.mas.magnetic.coil.functionalDescription = masWithCoil.magnetic.coil.functionalDescription;
                        this.masStore.mas.magnetic.coil.sectionsDescription = masWithCoil.magnetic.coil.sectionsDescription;
                        this.masStore.mas.magnetic.coil.layersDescription = masWithCoil.magnetic.coil.layersDescription;
                        this.masStore.mas.magnetic.coil.turnsDescription = masWithCoil.magnetic.coil.turnsDescription;
                        this.masStore.mas.magnetic.coil.groupsDescription = masWithCoil.magnetic.coil.groupsDescription;


                        this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
                        // this.cleanCoil();

                        this.$stateStore.wire2DVisualizerState.plotCurrentViews = {};
                        setTimeout(() => this.loading = false, 100);
                    })
                }
                else {
                    console.error("No operating points found")
                    this.loading = false;
                }
            });
        },
        adviseWire() {
            this.$mkf.ready.then(_ => {
                if (this.masStore.mas.inputs.operatingPoints.length > 0) {
                    const settings = JSON.parse(this.$mkf.get_settings());
                    settings["coilMaximumLayersPlanar"] = 24;
                    this.$mkf.set_settings(JSON.stringify(settings));

                    checkAndFixMas(this.masStore.mas, this.$mkf).then(response => {
                        this.masStore.mas = response;

                        const resultMasWithCoil = this.$mkf.calculate_advised_coil(JSON.stringify(this.masStore.mas));
                        if (resultMasWithCoil.startsWith("Exception")) {
                            this.errorMessage = "Our advisers could not find a wire. Sorry, you are on your own!";
                            this.loading = false;
                            console.error(resultMasWithCoil);
                            return;
                        }
                        this.errorMessage = "";
                        const masWithCoil = JSON.parse(resultMasWithCoil);

                        this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex] = masWithCoil.magnetic.coil.functionalDescription[this.windingIndex];


                        this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] = null;
                        this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire);
                        this.cleanCoil();

                        setTimeout(() => this.loading = false, 100);
                    })
                }
                else {
                    console.error("No operating points found")
                    this.loading = false;
                }
            });
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
                v-tooltip="tooltipsMagneticBuilder.wireRectangularConductingHeight"
                v-if="!loading"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-WireThickness'"
                :replaceTitle="'Cond. diameter'"
                :name="'wireThickness'"
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
                :options="wireThicknesses"
                @update="wireUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireRectangularConductingWidth"
                v-if="!loading"
                :disabled="readOnly"
                :name="'wireWidth'"
                :replaceTitle="'Cond. Width'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-WirWidth'"
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
                <BasicWireInfo 
                    v-if="!loading && !$settingsStore.magneticBuilderSettings.advancedMode"
                    :dataTestLabel="dataTestLabel + '-BasicWireInfo'"
                    :wire="masStore.mas.magnetic.coil.functionalDescription[windingIndex].wire"
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                    :windingIndex="windingIndex"
                />
                <AdvancedWireInfo 
                    v-if="!loading && $settingsStore.magneticBuilderSettings.advancedMode"
                    :dataTestLabel="dataTestLabel + '-AdvancedWireInfo'"
                    :wire="masStore.mas.magnetic.coil.functionalDescription[windingIndex].wire"
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
