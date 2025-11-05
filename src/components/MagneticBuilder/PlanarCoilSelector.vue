<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import ListOfCharacters from '/WebSharedComponents/DataInput/ListOfCharacters.vue'
import BasicCoilSubmenu from './BasicCoilSubmenu.vue'
import AdvancedCoilInfo from './AdvancedCoilInfo.vue'
import BasicCoilInfo from './BasicCoilInfo.vue'
import BasicCoilFillingFactors from './BasicCoilFillingFactors.vue'
import PlanarInsulationSelector from './PlanarInsulationSelector.vue'
import { toTitleCase, checkAndFixMas, deepCopy, roundWithDecimals } from '/WebSharedComponents/assets/js/utils.js'
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
        const showInsulationOptions = false;

        const loading = false;
        const blockingRebounds = false;
        const recentChange = false;
        const tryingToSend = false;
        const forceUpdate = 0; 

        var localData = {
            stackUp: "",
            insulationThicknessPerLayer: {},
            clearancePerWinding: {},
            coreToLayerDistance: 0.0001,
            borderToWireDistance: 0.0001
        }

        return {
            blockingRebounds,
            historyStore,
            localData,
            forceUpdate,
            showInsulationOptions,
            loading,
            recentChange,
            tryingToSend,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    'transition-delay': '1s',
                    width: '300px',
                    "text-align": "start",
                },
            }
        },
        windingIndexesCharacters() {
            var pattern = "";
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((item, index) => {
                pattern += String(index + 1);
            })
            return pattern;
        },
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds && this.masStore.mas.magnetic.coil.turnsDescription == null && this.masStore.mas.magnetic.coil.bobbin != "Dummy") {
                    this.recentChange = true;
                    this.assignLocalData(this.masStore.mas.magnetic);
                    this.blockingRebounds = true;
                    setTimeout(() => this.blockingRebounds = false, 100);
                    setTimeout(() => {this.tryToWind();}, 10);
                }
            },
            deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds && this.masStore.mas.magnetic.coil.bobbin != "Dummy") {
                    this.recentChange = true;
                    this.assignLocalData(this.masStore.mas.magnetic);
                    this.blockingRebounds = true;
                    setTimeout(() => this.blockingRebounds = false, 100);
                    setTimeout(() => {this.tryToWind();}, 10);
                }
            },
            deep: true
        },
    },
    mounted () {
        this.tryToWind();
        this.assignLocalData(this.masStore.mas.magnetic);

        this.getStackUp(this.masStore.mas.magnetic.coil);


        this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.tryToWind();
                this.assignLocalData(this.masStore.mas.magnetic);
                this.getStackUp(this.masStore.mas.magnetic.coil);
            }
        })

        this.masStore.$onAction((action) => {
            if (action.name == "importedMas") {
                this.assignLocalData(this.masStore.mas.magnetic);
                this.getStackUp(this.masStore.mas.magnetic.coil);
                this.tryToWind();
            }
        })

    },
    methods: {
        getWindingIndex(coil, windinName) {
            var foundWindingIndex = null;
            coil.functionalDescription.forEach((winding, windingIndex) => {
                if (winding.name == windinName) {
                    foundWindingIndex = windingIndex;
                }
            })
            return foundWindingIndex;
        },
        getStackUp(coil) {
            if (coil.sectionsDescription != null) {
                this.localData.pattern = "";
                coil.sectionsDescription.forEach((section) => {
                    if (section.type == "conduction") {
                        const windingIndex = this.getWindingIndex(coil, section.partialWindings[0].winding);
                        this.localData.pattern += String(windingIndex + 1)
                    }
                })
            }
        },
        wind() {
            this.$emit("fits", true);
            this.$mkf.ready.then(_ => {
                try {
                    const inputCoil = deepCopy(this.masStore.mas.magnetic.coil);

                    const settings = JSON.parse(this.$mkf.get_settings());
                    settings["coilMaximumLayersPlanar"] = 24;
                    this.$mkf.set_settings(JSON.stringify(settings));

                    const stackUp = [];
                    this.localData.stackUp.split('').forEach((char, index) => {
                        stackUp.push(Number(char) - 1);
                    });

                    var insulationThicknessPerLayer = "[";
                    for (const [key, value] of Object.entries(this.localData.insulationThicknessPerLayer)) {
                        insulationThicknessPerLayer += `[[${key.split('-')[0] - 1}, ${key.split('-')[1] - 1}], ${value}], `
                    }
                    if (insulationThicknessPerLayer.length > 1) {
                        insulationThicknessPerLayer = insulationThicknessPerLayer.slice(0, -2);
                    }
                    insulationThicknessPerLayer += "]";

                    var clearancePerWinding = "[";
                    for (const [key, value] of Object.entries(this.localData.clearancePerWinding)) {
                        clearancePerWinding += `[${key}, ${value}], `
                    }
                    if (clearancePerWinding.length > 1) {
                        clearancePerWinding = clearancePerWinding.slice(0, -2);
                    }
                    clearancePerWinding += "]";

                    if (inputCoil.bobbin == "Dummy") {
                        const bobbinResult = this.$mkf.create_quick_bobbin(JSON.stringify(this.masStore.mas.magnetic.core), 0);

                        if (bobbinResult.startsWith("Exception")) {
                            console.error(bobbinResult);
                        }
                        else {
                            inputCoil.bobbin = JSON.parse(bobbinResult);
                        }
                    }

                    const coilJson = this.$mkf.wind_planar(JSON.stringify(inputCoil), JSON.stringify(stackUp), this.localData.borderToWireDistance, clearancePerWinding, insulationThicknessPerLayer, this.localData.coreToLayerDistance);

                    if (coilJson.startsWith("Exception")) {
                        this.tryingToSend = false;
                        console.error(coilJson);
                        return;
                    }

                    const auxCoil = JSON.parse(coilJson);
                    this.masStore.mas.magnetic.coil.sectionsDescription = auxCoil.sectionsDescription;
                    this.masStore.mas.magnetic.coil.layersDescription = auxCoil.layersDescription;
                    this.masStore.mas.magnetic.coil.turnsDescription = auxCoil.turnsDescription;
                    this.masStore.mas.magnetic.coil.groupsDescription = auxCoil.groupsDescription;
                    this.masStore.mas.magnetic.coil.bobbin = auxCoil.bobbin;

                    const fits = this.$mkf.are_sections_and_layers_fitting(JSON.stringify(inputCoil));
                    this.$emit("fits", fits);

                    this.historyStore.addToHistory(this.masStore.mas);
                    this.tryingToSend = false;
                    // this.historyStore.unblockAdditions();
                }
                catch (e) {
                    this.tryingToSend = false;
                    console.error(e);
                    // this.recentChange = true;
                    // this.blockingRebounds = true;
                    // this.assignLocalData(this.masStore.mas.magnetic);
                    // this.tryToWind();
                    // setTimeout(() => this.blockingRebounds = false, 100);
                }

            });
        },
        tryToWind() {
            if (!this.tryingToSend) {
                this.recentChange = false
                this.tryingToSend = true
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToSend = false
                        this.tryToWind()
                    }
                    else {
                        this.wind();
                    }
                }
                , this.$settingsStore.waitingTimeAfterChange);
            }
        },
        getLayerWindingIndex(layer) {
            var windingIndex = 0;
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((winding, auxWindingIndex) => {
                if (winding.name == layer.partialWindings[0].winding) {
                    windingIndex = auxWindingIndex;
                }
            })

            return windingIndex;
        },
        assignLocalData(magnetic) {
            if (!this.blockingRebounds) {
                try {

                    if (this.masStore.mas.magnetic.coil.layersDescription != null) {
                        var stackUp = "";
                        this.localData.coreToLayerDistance = (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].width - this.masStore.mas.magnetic.coil.layersDescription[0].dimensions[0]) / 2;
                        const layerBorderCoordinate = this.masStore.mas.magnetic.coil.layersDescription[0].coordinates[0] - this.masStore.mas.magnetic.coil.layersDescription[0].dimensions[0] / 2;
                        const firstTurnBorderCoordinate = this.masStore.mas.magnetic.coil.turnsDescription[0].coordinates[0] - this.masStore.mas.magnetic.coil.turnsDescription[0].dimensions[0] / 2;
                        this.localData.borderToWireDistance = firstTurnBorderCoordinate - layerBorderCoordinate;

                        this.masStore.mas.magnetic.coil.layersDescription.forEach((layer, index) => {
                            if (layer.type == "conduction") {
                                var windingIndex = this.getLayerWindingIndex(layer);
                                stackUp += String(windingIndex + 1);
                            }
                            else {
                                if (index > 0 && index < this.masStore.mas.magnetic.coil.layersDescription.length - 1) {
                                    const previousWindingIndex = this.getLayerWindingIndex(this.masStore.mas.magnetic.coil.layersDescription[index - 1]);
                                    const nextWindingIndex = this.getLayerWindingIndex(this.masStore.mas.magnetic.coil.layersDescription[index + 1]);
                                    const key = `${previousWindingIndex + 1}-${nextWindingIndex + 1}`;

                                    this.localData.insulationThicknessPerLayer[key] = layer.dimensions[1];
                                }
                            }
                        })

                        this.masStore.mas.magnetic.coil.functionalDescription.forEach((winding, windingIndex) => {
                            this.localData.clearancePerWinding[windingIndex] = 0.0001;

                            for (let i = 0; i < this.masStore.mas.magnetic.coil.turnsDescription.length - 1; i++) {
                                if (this.masStore.mas.magnetic.coil.turnsDescription[i].winding == winding.name &&
                                    this.masStore.mas.magnetic.coil.turnsDescription[i].layer == this.masStore.mas.magnetic.coil.turnsDescription[i + 1].layer) {
                                    let firstBorder = this.masStore.mas.magnetic.coil.turnsDescription[i].coordinates[0] + this.masStore.mas.magnetic.coil.turnsDescription[i].dimensions[0] / 2;
                                    let secondBorder = this.masStore.mas.magnetic.coil.turnsDescription[i + 1].coordinates[0] - this.masStore.mas.magnetic.coil.turnsDescription[i + 1].dimensions[0] / 2;
                                    this.localData.clearancePerWinding[windingIndex] = secondBorder - firstBorder;
                                    break;
                                }
                            }
                        })


                        this.localData.stackUp = stackUp;
                        this.extractInsulationThicknessPerLayer();
                    }
                    else if (this.localData.stackUp == "") {
                        this.masStore.mas.magnetic.coil.functionalDescription.forEach((item, index) => {
                            this.localData.stackUp += String(index + 1);
                        })
                    }
                    this.$stateStore.storePlanarConfiguration(this.localData);
                    

                    this.forceUpdate += 1;
                }
                catch (e) {
                    console.error(e)
                    // setTimeout(() => this.assignLocalData(magnetic), 50);
                }
            }
        },
        extractInsulationThicknessPerLayer() {
            const insulationThicknessPerLayer = {};
            const stackUpArray = this.localData.stackUp.split('');

            stackUpArray.forEach((elem, index) => {
                if (index < this.localData.stackUp.length - 1) {
                    const key = `${this.localData.stackUp[index]}-${this.localData.stackUp[index + 1]}`
                    if (!(key in insulationThicknessPerLayer)) {
                        if (key in this.localData.insulationThicknessPerLayer) {
                            insulationThicknessPerLayer[key] = this.localData.insulationThicknessPerLayer[key];
                        }
                        else {
                            insulationThicknessPerLayer[key] = 0.0001;
                        }
                    }
                }
            })
            this.localData.insulationThicknessPerLayer = insulationThicknessPerLayer;
        },
        stackUpUpdated() {
            this.extractInsulationThicknessPerLayer();
            this.coilUpdated();
        },
        coilUpdated() {
            console.log("coilUpdated")
            this.recentChange = true;
            this.tryToWind();
        },
        marginUpdated(sectionIndex) {
            this.coilUpdated();
        },
        swapShowInsulationOptions() {
            this.showInsulationOptions = !this.showInsulationOptions;
        },
        customizeCoil() {
        },
    }
}
</script>

<template>
    <div class="container" v-tooltip="styleTooltip">
        <div class="row"  ref="coilSelectorContainer">
            <img :data-cy="dataTestLabel + '-BasicCoilSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <ListOfCharacters
                v-tooltip="tooltipsMagneticBuilder.sectionsInterleaving"
                v-if="!loading && masStore.mas.magnetic.coil.functionalDescription.length > 0"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-SectionsInterleaving'"
                :modelValue="localData.stackUp" 
                @updateModelValue="localData.stackUp = $event"
                :name="'stackUp'"
                :replaceTitle="'Stack Up'"
                :allowConsecutive="true"
                :allowedCharacters="windingIndexesCharacters"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="stackUpUpdated"
            />
        </div>

        <PlanarInsulationSelector
            class="col-12 ps-2 ms-1 mb-1 text-start border-top pt-2"
            v-if="!loading && showInsulationOptions"
            :dataTestLabel="dataTestLabel + '-AdvancedCoilInfo'"
            :loading="loading"
            :readOnly="readOnly"
            :data="localData"
            @update="coilUpdated"
        />

        <div v-if="enableSimulation" class="col-12">
            <BasicCoilInfo
                v-if="!loading && !$settingsStore.magneticBuilderSettings.advancedMode"
                :dataTestLabel="dataTestLabel + '-BasicCoreInfo'"
                :core="masStore.mas.magnetic.core"
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
            />
            <AdvancedCoilInfo
                v-if="!loading && $settingsStore.magneticBuilderSettings.advancedMode"
                :dataTestLabel="dataTestLabel + '-AdvancedCoilInfo'"
                :core="masStore.mas.magnetic.core"
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
            />
        </div>
        <button
            :style="showInsulationOptions? $styleStore.magneticBuilder.hideInsulationOptionsButton: $styleStore.magneticBuilder.showInsulationOptionsButton"
            :data-cy="dataTestLabel + '-Coil-ShowInsulationOptions-button'"
            :class="'col-12'"
            class="btn mx-auto d-block mt-1"
            @click="swapShowInsulationOptions"
        >
            {{showInsulationOptions? 'Hide Insulation options' : 'Show Insulation options'}}
        </button>

    </div>
</template>
