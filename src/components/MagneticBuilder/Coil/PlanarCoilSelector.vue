<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import ListOfCharacters from '/WebSharedComponents/DataInput/ListOfCharacters.vue'
import BasicCoilSubmenu from './BasicCoilSubmenu.vue'
import CoilInfo from './CoilInfo.vue'
import BasicCoilFillingFactors from './BasicCoilFillingFactors.vue'
import PlanarInsulationSelector from './PlanarInsulationSelector.vue'
import { toTitleCase, checkAndFixMas, deepCopy, roundWithDecimals } from '/WebSharedComponents/assets/js/utils.js'
import { useHistoryStore } from '../../../stores/history'
import { useTaskQueueStore } from '../../../stores/taskQueue'

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
        enableAutoSimulation: {
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
        const taskQueueStore = useTaskQueueStore();
        const historyStore = useHistoryStore();
        const showInsulationOptions = false;

        const loading = false;
        const blockingRebounds = false;
        const recentChange = false;
        const tryingToSend = false;
        const forceUpdate = 0; 
        const subscriptions = []; 

        const localData = {
            stackUp: "",
            insulationThicknessPerLayer: {},
            clearancePerWinding: {},
            coreToLayerDistance: 0.0001,
            borderToWireDistance: 0.0001
        }

        return {
            taskQueueStore,
            blockingRebounds,
            historyStore,
            localData,
            forceUpdate,
            showInsulationOptions,
            loading,
            recentChange,
            tryingToSend,
            subscriptions,
        }
    },
    computed: {
        windingIndexesCharacters() {
            let pattern = "";
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((item, index) => {
                pattern += String(index + 1);
            })
            return pattern;
        },
    },
    watch: {
    },
    mounted () {
        this.tryToWind();
        this.assignLocalData(this.masStore.mas.magnetic);

        this.getStackUp(this.masStore.mas.magnetic.coil);


        this.subscriptions.push(this.historyStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "historyPointerUpdated") {
                    this.tryToWind();
                    this.assignLocalData(this.masStore.mas.magnetic);
                    this.getStackUp(this.masStore.mas.magnetic.coil);
                }
            });
        }))

        this.subscriptions.push(this.masStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "importedMas") {
                    this.assignLocalData(this.masStore.mas.magnetic);
                    this.getStackUp(this.masStore.mas.magnetic.coil);
                    this.tryToWind();
                }
            });
        }))

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "numberTurnsUpdated" || name == "newWireCreated") {
                    if (args[0]) {
                        this.recentChange = true;
                        this.tryToWind();
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
        getWindingIndex(coil, windinName) {
            let foundWindingIndex = null;
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

            this.taskQueueStore.getSettings().then((settings) => {
                settings["coilMaximumLayersPlanar"] = 24;
                this.taskQueueStore.setSettings(settings).then(() => {
                    const inputCoil = deepCopy(this.masStore.mas.magnetic.coil);

                    const stackUp = [];
                    this.localData.stackUp.split('').forEach((char, index) => {
                        stackUp.push(Number(char) - 1);
                    });

                    this.taskQueueStore.generateBobbinFromCoreShape(this.masStore.mas.magnetic.core, "Printed").then((bobbin) => {
                        inputCoil.bobbin = bobbin;

                        this.taskQueueStore.windPlanar(inputCoil, stackUp, this.localData.borderToWireDistance, this.localData.clearancePerWinding, this.localData.insulationThicknessPerLayer, this.localData.coreToLayerDistance)
                        .then((coil) => {
                            this.masStore.mas.magnetic.coil = coil;
                            this.assignLocalData(this.masStore.mas.magnetic);
                            this.historyStore.addToHistory(this.masStore.mas);
                            this.tryingToSend = false;
                            this.taskQueueStore.checkIfSectionsAndLayersFit(coil).then((fits) => {
                                this.$emit("fits", fits);
                            })

                        })
                        .catch(error => {
                            this.tryingToSend = false;
                            console.error(error);
                        })
                    })
                    .catch(error => {
                        this.tryingToSend = false;
                        console.error(error);
                    })
                })
                .catch(error => {
                    this.tryingToSend = false;
                    console.error(error);
                })
            })
            .catch(error => {
                this.tryingToSend = false;
                console.error(error);
            })
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
            let windingIndex = 0;
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
                        let stackUp = "";
                        this.localData.coreToLayerDistance = (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].width - this.masStore.mas.magnetic.coil.layersDescription[0].dimensions[0]) / 2;
                        const layerBorderCoordinate = this.masStore.mas.magnetic.coil.layersDescription[0].coordinates[0] - this.masStore.mas.magnetic.coil.layersDescription[0].dimensions[0] / 2;
                        const firstTurnBorderCoordinate = this.masStore.mas.magnetic.coil.turnsDescription[0].coordinates[0] - this.masStore.mas.magnetic.coil.turnsDescription[0].dimensions[0] / 2;
                        this.localData.borderToWireDistance = firstTurnBorderCoordinate - layerBorderCoordinate;

                        this.masStore.mas.magnetic.coil.layersDescription.forEach((layer, index) => {
                            if (layer.type == "conduction") {
                                const windingIndex = this.getLayerWindingIndex(layer);
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
    <div class="container">
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
            :dataTestLabel="dataTestLabel + '-PlanarInsulationSelector'"
            :loading="loading"
            :readOnly="readOnly"
            :data="localData"
            @update="coilUpdated"
        />

        <div class="col-12">
            <CoilInfo
                v-if="!loading && enableSimulation"
                ref="coilInfo"
                :dataTestLabel="dataTestLabel + '-CoilInfo'"
                :advancedMode="$settingsStore.magneticBuilderSettings.advancedMode"
                :masStore="masStore"
                :operatingPointIndex="operatingPointIndex"
                :enableAutoSimulation="enableAutoSimulation"
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
