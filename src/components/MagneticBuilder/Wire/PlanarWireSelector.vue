<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import BasicWireSubmenu from './BasicWireSubmenu.vue'
import WireInfo from './WireInfo.vue'
import { toTitleCase, checkAndFixMas, deepCopy } from '/WebSharedComponents/assets/js/utils.js'
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
        const wireThicknesses = [];
        const errorMessage = ""; 
        var localData = {
            wireThickness: 0.001,
            wireWidth: 0.002,
        };
        if (typeof(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire) == 'string' && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy") {
            taskQueueStore.processWire(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex]).then((wire) => {
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire = wire;

            })
        }

        const blockingRebounds = false;
        const wireHash = "";

        return {
            taskQueueStore,
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
            if (wire != "" && wire.type != null) {
                this.localData["wireThickness"] = wire.standardName;
                this.taskQueueStore.resolveDimensionWithTolerance(wire.conductingWidth).then((dimension) => {
                    this.localData["wireWidth"] = dimension;
                    this.forceUpdate += 1;
                })
            }
        },
        assignWire() {
            this.errorMessage = "";
            var wire = {};
            if (this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "" && this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire != "Dummy") {
                wire = this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].wire;
            }

            this.taskQueueStore.getWireDataByStandardName(this.localData["wireThickness"]).then((wire) => {
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
            })
            .catch(error => {
                console.error(error);
                return;
            })
        },
        getWireThicknesses() {
            this.wireThicknesses = [];
            this.taskQueueStore.getPlanarThicknesses().then((planarThicknessesHandle) => {
                for (var i = planarThicknessesHandle.size() - 1; i >= 0; i--) {
                    const wireThickness = planarThicknessesHandle.get(i);
                    this.wireThicknesses.push(toTitleCase(wireThickness));
                }

                this.wireThicknesses.sort(function(a, b){
                    a = Number(a.split(" ")[0]);
                    b = Number(b.split(" ")[0]);
                    return a - b;
                });
            })
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
            this.taskQueueStore.getSettings().then((settings) => {
                settings["coilMaximumLayersPlanar"] = 24;
                this.taskQueueStore.setSettings(settings).then(() => {

                    this.taskQueueStore.adviseAllWires(this.masStore.mas)
                    .then((coil) => {
                        this.errorMessage = "";
                        this.masStore.mas.magnetic.coil = coil;
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
                })
            })
        },
        adviseWire() {
            this.taskQueueStore.getSettings().then((settings) => {
                settings["coilMaximumLayersPlanar"] = 24;
                this.taskQueueStore.setSettings(settings).then(() => {
                    this.taskQueueStore.adviseWire(this.masStore.mas, this.windingIndex)
                    .then((winding) => {
                        this.errorMessage = "";
                        this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex] = winding;
                        this.assignLocalData(winding.wire);
                        this.cleanCoil();

                        this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] = null;
                        setTimeout(() => this.loading = false, 100);

                    })
                    .catch(error => {
                        this.errorMessage = "Our advisers could not find a wire. Sorry, you are on your own!";
                        this.loading = false;
                        setTimeout(() => {this.errorMessage = ""}, 10000);
                        console.error(error);
                    })
                })
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
