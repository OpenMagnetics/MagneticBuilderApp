<script setup>
import { toTitleCase } from '/WebSharedComponents/assets/js/utils.js'
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
        mkf: {
            type: Object,
            required: true,
        },
        mkfAdvisers: {
            type: Object,
            required: true,
        },
        simulationEnabled: {
            type: Boolean,
            default: true,
        },
        submenuEnabled: {
            type: Boolean,
            default: true,
        },
        adviseEnabled: {
            type: Boolean,
            default: true,
        },
        isIsolatedApp: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        var numberWindings = 1;
        if (this.masStore.mas.inputs.designRequirements.turnsRatios != null) {
            numberWindings = this.masStore.mas.inputs.designRequirements.turnsRatios.length + 1;
        }
        const numberWindingsAux = {
            numberWindings: numberWindings
        }
        const selectedWindingIndex = 0;
        return {
            numberWindingsAux,
            selectedWindingIndex,
        }
    },
    computed: {
    },
    watch: {

    },
    mounted () {

        this.masStore.$onAction((action) => {
            if (action.name == "importedMas") {
                this.numberWindingsAux.numberWindings = this.masStore.mas.magnetic.coil.functionalDescription.length;
            }
        })
    },
    methods: {
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
    }
}
</script>

<template>
    <h5 v-if="masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape ==''" class="text-danger my-2">Select a core first</h5>

    <div v-else class="container">
        <div v-if="useVisualizers && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex] != null && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire != null" class="row mb-2" style="max-height: 30vh">
            <Wire2DVisualizer 
                v-if="masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire.type != null"
                :dataTestLabel="`${dataTestLabel}-Wire2DVisualizer`"
                :wire="masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire"
                :windingIndex="selectedWindingIndex"
                :operatingPoint="masStore.mas.inputs.operatingPoints[0]"
                :includeCurrentDensity="$userStore.wire2DVisualizerPlotCurrentDensity == 1"
                :loadingGif="'/images/loading.gif'"
                :backgroundColor="$settingsStore.labelBgColor"
            />
        </div>
        <h4 v-else class="mb-5" > {{"Wires Description"}} </h4>

        <div v-if="useVisualizers && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex] != null && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire != null && masStore.mas.magnetic.coil.functionalDescription[selectedWindingIndex].wire.type != null" class="row">
            <h5 class="offset-0 col-8 text-end">Plot current density</h5>
            <div class="col-4 container">
                <div class="row">
                    <label  class="fs-6 p-0 ps-3 pe-3 text-end text-white col-4 ">No</label>
                    <input :data-cy="'Settings-Modal-with-without-stock-button'" v-model="$userStore.wire2DVisualizerPlotCurrentDensity" type="range" class="form-range col-2 pt-2" min="0" max="1" step="1" style="width: 30px">
                    <label  class="fs-6 p-0 ps-3 text-white col-3  text-start">Yes</label>
                </div>
            </div>
        </div>

        <div v-if="isIsolatedApp" class="row">
            <ElementFromList class="border-bottom py-2 px-4 col-12 text-start"
                :name="'numberWindings'"
                :dataTestLabel="dataTestLabel + '-NumberWindings'"
                :options="Array.from({length: 12}, (_, i) => i + 1)"
                :titleSameRow="true"
                v-model="numberWindingsAux"
                :labelStyleClass="'col-8'"
                :selectStyleClass="'col-4'"
                :labelBgColor="$settingsStore.labelBgColor"
                :inputBgColor="$settingsStore.inputBgColor"
                :textColor="$settingsStore.textColor"
                :justifyContent="true"
                @update="updatedNumberElements"
            />
        </div>

        <div class="row">
            <WindingSelector
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
                    :masStore="masStore"
                    :mkf="mkf"
                    :windingIndex="key"
                />
                <BasicWireSelector
                    v-if="selectedWindingIndex==key"
                    :masStore="masStore"
                    :mkf="mkf"
                    :mkfAdvisers="mkfAdvisers"
                    :windingIndex="key"
                    :simulationEnabled="simulationEnabled"
                    :submenuEnabled="submenuEnabled"
                    :adviseEnabled="adviseEnabled"
                />
            </div>
        </div>
    </div>
</template>
