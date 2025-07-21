<script setup>
import { toTitleCase, deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { isolationSideOrdered } from '/WebSharedComponents/assets/js/defaults.js'
import Wire2DVisualizer from '/WebSharedComponents/Common/Wire2DVisualizer.vue'
import BasicTurnsSelector from './BasicTurnsSelector.vue'
import WindingSelector from './WindingSelector.vue'
import BasicWireSelector from './BasicWireSelector.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
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
        useVisualizers: {
            type: Boolean,
            default: true,
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
        isIsolatedApp: {
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
        const wire2DVisualizerPlotCurrentDensity = this.$stateStore.wire2DVisualizerState.plotCurrentDensity? '1' : '0';
        var numberWindings = 1;
        if (this.masStore.mas.inputs.designRequirements.turnsRatios != null) {
            numberWindings = this.masStore.mas.inputs.designRequirements.turnsRatios.length + 1;
        }
        const numberWindingsAux = {
            numberWindings: numberWindings
        }
        const selectedWindingIndex = 0;
        const blockingRebounds = false;
        const wires = [];
        const imageUpToDate = false;

        return {
            blockingRebounds,
            numberWindingsAux,
            selectedWindingIndex,
            wire2DVisualizerPlotCurrentDensity,
            wires,
            imageUpToDate,
        }
    },
    computed: {
    },
    watch: {
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {

                if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
                    this.wires = [];
                    this.masStore.mas.magnetic.coil.functionalDescription.forEach((elem) => {
                        if (elem.wire != null) {
                            this.wires.push(deepCopy(elem.wire));
                        }
                    })
                    this.imageUpToDate = true;
                }
                else {
                    this.imageUpToDate = false;
                }
            },
          deep: true
        }
    },
    mounted () {

        this.$stateStore.$onAction((action) => {
            if (action.name == "redraw") {
                this.wires = [];
                this.masStore.mas.magnetic.coil.functionalDescription.forEach((elem) => {
                    if (elem.wire != null) {
                        this.wires.push(deepCopy(elem.wire));
                    }
                })
                this.imageUpToDate = true;
            }
        })
        this.masStore.$onAction((action) => {
            if (action.name == "importedMas") {
                this.numberWindingsAux.numberWindings = this.masStore.mas.magnetic.coil.functionalDescription.length;
            }
        })
    },
    methods: {
        turnsUpdated(modifiedWindingIndex) {
            if (!this.blockingRebounds) {
                this.blockingRebounds = true;
                if (this.$stateStore.hasCurrentApplicationMirroredWindings()) {
                    const tempCoilFunctionalDescription = deepCopy(this.masStore.mas.magnetic.coil.functionalDescription)
                    this.masStore.mas.magnetic.coil.functionalDescription.forEach((_, windingIndex) => {
                        if (modifiedWindingIndex != windingIndex) {
                            tempCoilFunctionalDescription[windingIndex].numberTurns = this.masStore.mas.magnetic.coil.functionalDescription[modifiedWindingIndex].numberTurns;
                            tempCoilFunctionalDescription[windingIndex].numberParallels = this.masStore.mas.magnetic.coil.functionalDescription[modifiedWindingIndex].numberParallels;
                            // this.masStore.mas.magnetic.coil.functionalDescription[windingIndex].wire = this.masStore.mas.magnetic.coil.functionalDescription[modifiedWindingIndex].wire;
                        }
                    })
                    this.masStore.mas.magnetic.coil.functionalDescription = tempCoilFunctionalDescription;
                }
                setTimeout(() => this.blockingRebounds = false, 10);
            }
        },
        wireUpdated(modifiedWindingIndex) {
            if (!this.blockingRebounds) {
                this.blockingRebounds = true;
                if (this.$stateStore.hasCurrentApplicationMirroredWindings()) {
                    const tempCoilFunctionalDescription = deepCopy(this.masStore.mas.magnetic.coil.functionalDescription)
                    this.masStore.mas.magnetic.coil.functionalDescription.forEach((_, windingIndex) => {
                        if (modifiedWindingIndex != windingIndex) {
                            tempCoilFunctionalDescription[windingIndex].wire = this.masStore.mas.magnetic.coil.functionalDescription[modifiedWindingIndex].wire;
                        }
                    })
                    this.masStore.mas.magnetic.coil.functionalDescription = tempCoilFunctionalDescription;
                }
                setTimeout(() => this.blockingRebounds = false, 10);
            }

        },
        updatedNumberElements(newLength, name) {
            if (name == 'numberWindings') {
                const newElementsCoil = [];
                const newElementsTurnsRatios = [];
                for (var i = 0; i < newLength - 1; i++) {
                    if (i < this.masStore.mas.inputs.designRequirements.turnsRatios.length) {
                        newElementsTurnsRatios.push(this.masStore.mas.inputs.designRequirements.turnsRatios[i]);
                    }
                    else {
                        newElementsTurnsRatios.push({'nominal': 1});
                    }
                }
                for (var i = 0; i < newLength; i++) {
                    if (i < this.masStore.mas.magnetic.coil.functionalDescription.length) {
                        newElementsCoil.push(this.masStore.mas.magnetic.coil.functionalDescription[i]);
                    }
                    else {
                        newElementsCoil.push({'name': toTitleCase(isolationSideOrdered[i])});
                    }
                }
                for (var operationPointIndex = 0; operationPointIndex < this.masStore.mas.inputs.operatingPoints.length; operationPointIndex++) {
                    const newExcitationsPerWinding = [];

                    for (var i = 0; i < newLength; i++) {
                        if (i < this.masStore.mas.inputs.operatingPoints[operationPointIndex].excitationsPerWinding.length) {
                            newExcitationsPerWinding.push(this.masStore.mas.inputs.operatingPoints[operationPointIndex].excitationsPerWinding[i]);
                        }
                        else {
                            newExcitationsPerWinding.push(null);
                        }
                    }
                    this.masStore.mas.inputs.operatingPoints[operationPointIndex].excitationsPerWinding = newExcitationsPerWinding;
                }

                this.masStore.mas.inputs.designRequirements.turnsRatios = newElementsTurnsRatios;
                this.masStore.mas.magnetic.coil.functionalDescription = newElementsCoil;
                this.masStore.updatedTurnsRatios();
            }
        },
        windingIndexChanged(windingIndex) {
            this.selectedWindingIndex = windingIndex;
        },
        onPlotCurrentChange(event) {
            this.$stateStore.wire2DVisualizerState.plotCurrentDensity = event.target.value == '1';
        },
    }
}
</script>

<template>
    <h5 v-if="masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape ==''" class="text-danger my-2">Select a core first</h5>

    <div v-else class="container">
        <div
            v-if="useVisualizers && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex] != null && wires[selectedWindingIndex] != null"
            class="row mb-2"
            style="max-height: 20vh"
            :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <Wire2DVisualizer 
                v-if="masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire.type != null"
                :dataTestLabel="`${dataTestLabel}-Wire2DVisualizer`"
                :wire="wires[selectedWindingIndex]"
                :windingIndex="selectedWindingIndex"
                :operatingPoint="masStore.mas.inputs.operatingPoints[operatingPointIndex]"
                :includeCurrentDensity="wire2DVisualizerPlotCurrentDensity == '1'"
                :loadingGif="$settingsStore.loadingGif"
                :backgroundColor="$styleStore.magneticBuilder.main.background"
            />
        </div>
        <h4 v-else class="mb-5" > {{"Wires Description"}} </h4>

        <div v-if="useVisualizers && enableSimulation && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex] != null && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire != null && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire.type != null" class="row">
            <h5 class="offset-0 col-8 text-end">Plot current density</h5>
            <div class="col-4 container">
                <div class="row">
                    <label
                        :style="$styleStore.magneticBuilder.wireVisualizerButton"
                        class="fs-6 p-0 ps-3 pe-3 text-end col-4"
                    >
                        No
                    </label>
                    <input
                        :style="$styleStore.magneticBuilder.wireVisualizerButton"
                        :data-cy="'Settings-Modal-with-without-stock-button'"
                        v-model="wire2DVisualizerPlotCurrentDensity"
                        type="range"
                        class="slider form-range col-2 pt-2"
                        min="0"
                        max="1"
                        step="1"
                        style="width: 30px"
                        @change="onPlotCurrentChange($event)"
                    >
                    <label
                        :style="$styleStore.magneticBuilder.wireVisualizerButton"
                        class="fs-6 p-0 ps-3 col-3 text-start"
                    >
                        Yes
                    </label>
                </div>
            </div>
        </div>

        <div v-if="isIsolatedApp" class="row">
            <ElementFromList class="border-bottom py-2 px-4 col-12 text-start"
                :name="'numberWindings'"
                :disabled="readOnly"
                :dataTestLabel="dataTestLabel + '-NumberWindings'"
                :options="Array.from({length: 12}, (_, i) => i + 1)"
                :titleSameRow="true"
                v-model="numberWindingsAux"
                :labelWidthProportionClass="'col-8'"
                :selectStyleClass="'col-4'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                :justifyContent="true"
                @update="updatedNumberElements"
            />
        </div>

        <div class="row">
            <WindingSelector
                v-if="!$stateStore.hasCurrentApplicationMirroredWindings()"
                :dataTestLabel="`${dataTestLabel}-WindingSelector`"
                :coil="masStore.mas.magnetic.coil"
                :masStore="masStore"
                @windingIndexChanged="windingIndexChanged"
            />
        </div>

        <div class="row">
            <div v-for="value, key in masStore.mas.magnetic.coil.functionalDescription">
                <BasicTurnsSelector
                    class="mt-1"
                    v-if="selectedWindingIndex==key"
                    :readOnly="readOnly"
                    :masStore="masStore"
                    :windingIndex="key"
                    @turnsUpdated="turnsUpdated"
                />
                <BasicWireSelector
                    v-if="selectedWindingIndex==key"
                    :masStore="masStore"
                    :readOnly="readOnly"
                    :operatingPointIndex="operatingPointIndex"
                    :windingIndex="key"
                    :enableSimulation="enableSimulation"
                    :enableSubmenu="enableSubmenu"
                    :enableAdvise="enableAdvise"
                    @wireUpdated="wireUpdated"
                />
            </div>
        </div>
    </div>
</template>


<style type="text/css">
/* --------------------------- webkit browsers */
.slider::-webkit-slider-thumb {
  background-color: var(--bs-primary);
}
/* -------------------------- Firefox */
.slider::-moz-range-thumb { 
  background-color: var(--bs-primary);
}
</style>