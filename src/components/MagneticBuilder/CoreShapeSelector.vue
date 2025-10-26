<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { useHistoryStore } from '../../stores/history'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import CoreShapeTableModal from './CoreShapeTableModal.vue'
</script>

<script>

export default {
    emits: ["update"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
            required: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        const coreShapeNames = {}; 
        const coreShapeFamilies = []; 
        const localData = {};

        const loading = false;
        const forceUpdate = 0;

        const coreShapeData = []; 
        return {
            historyStore,
            localData,
            coreShapeNames,
            coreShapeFamilies,
            loading,
            forceUpdate,
            coreShapeData,
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
            this.forceUpdate += 1;
        },
        getShapeNames() {
            this.$mkf.ready.then(_ => {
                const coreShapeFamiliesHandle = this.$mkf.get_available_core_shape_families();
                for (var i = coreShapeFamiliesHandle.size() - 1; i >= 0; i--) {
                    const shapeFamily = coreShapeFamiliesHandle.get(i).toUpperCase()
                    if (!shapeFamily.includes("PQI") && !shapeFamily.includes("UT") &&
                        !shapeFamily.includes("UI") && !shapeFamily.includes("H") && !shapeFamily.includes("DRUM")) {
                        if (this.masStore.mas.inputs.designRequirements.wiringTechnology == 'Wound' || shapeFamily != 'T') {
                            this.coreShapeFamilies.push(shapeFamily);
                        }
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


                                    this.coreShapeData.push({
                                        name: aux,
                                        family: shapeFamily,
                                        edit: "ea",
                                    })
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

                                this.coreShapeData.push({
                                    name: aux,
                                    family: shapeFamily,
                                    select: "ea",
                                })
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
        loadCore() {
        },
        selectCoreShape(data) {
            console.log(data);
        },
    }
}
</script>
<template>
    <CoreShapeTableModal 
        :dataTestLabel="dataTestLabel"
        :masStore="masStore"
        :coreShapeData="coreShapeData"

    />

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
                class="col-10 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-ShapeNames'"
                :name="'shape'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="localData"
                :optionsToDisable="coreShapeFamilies"
                :options="coreShapeNames[localData.shapeFamily]"
                @update="$emit('update', localData.shape)"
                :labelWidthProportionClass="'col-sm-12 col-md-5'"
                :valueWidthProportionClass="'col-sm-12 col-md-7'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />

            <div class="ms-3 col-1 p-0 pt-1 " v-tooltip="styleTooltip">
                <button 
                    style="height: 35px;"
                    :style="$styleStore.magneticBuilder.tableButton"
                    class="btn ms-1"
                    data-bs-toggle="modal"
                    data-bs-target="#coreShapeTableModal"
                    >
                    <i class="fa-solid fa-table-list"></i>
                </button>
            </div>
        </div>
    </div>
</template>
