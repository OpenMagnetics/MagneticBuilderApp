<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ListOfCharacters from '/WebSharedComponents/DataInput/ListOfCharacters.vue'
import BasicCoilSubmenu from './BasicCoilSubmenu.vue'
import AdvancedCoilInfo from './AdvancedCoilInfo.vue'
import BasicCoilInfo from './BasicCoilInfo.vue'
import BasicCoilSectionInsulationSelector from './BasicCoilSectionInsulationSelector.vue'
import BasicCoilSectionAlignmentSelector from './BasicCoilSectionAlignmentSelector.vue'
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
        const showAlignmentOptions = false;

        const showInsulationOptions = false;
        const loading = false;
        const blockingRebounds = false;
        const recentChange = false;
        const tryingToSend = false;
        const forceUpdate = 0; 
        var pattern = "";

        var localData = {};

        if (this.$stateStore.hasCurrentApplicationMirroredWindings()) {
            localData = {
                sectionsOrientation: "contiguous",
                sectionsAlignment: "spread",
                interlayerThickness: 0,
                intersectionThickness: 0,
                dataPerSection: [{
                    layersOrientation: "overlapping",
                    turnsAlignment: "centered",
                    topOrLeftMargin: 0,
                    bottomOrRightMargin: 0,
                }],
                pattern: pattern,
                repetitions: 1,
                proportionPerWinding: [],
                bobbinThickness: 0
            };
        }
        else {
            localData = {
                sectionsOrientation: "overlapping",
                sectionsAlignment: "inner or top",
                interlayerThickness: 0,
                intersectionThickness: 0,
                dataPerSection: [{
                    layersOrientation: "overlapping",
                    turnsAlignment: "spread",
                    topOrLeftMargin: 0,
                    bottomOrRightMargin: 0,
                }],
                pattern: pattern,
                repetitions: 1,
                proportionPerWinding: [],
                bobbinThickness: 0
            };
        }
        this.resetProportionPerWinding(localData);

        return {
            blockingRebounds,
            historyStore,
            localData,
            forceUpdate,
            showAlignmentOptions,
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
        conductiveSections() {
            const sections = [];

            if (this.masStore.mas.magnetic.coil.sectionsDescription != null) {
                this.masStore.mas.magnetic.coil.sectionsDescription.forEach((section) => {
                    if (section.type == "conduction") {
                        sections.push(section);
                    }
                })
            }
            return sections;
        },
        numberSections() {
            if (this.masStore.mas.magnetic.coil.sectionsDescription != null) {
                return this.conductiveSections.length;
            }
            else {
                return this.masStore.mas.magnetic.coil.functionalDescription.length;
            }
        },
        windingIndexesCharacters() {
            var pattern = "";
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((item, index) => {
                pattern += String(index + 1);
            })
            return pattern;
        },
        shortenedNames() {
            const shortenedNames = {}

            var width = 0;
            if (this.$refs.coilSelectorContainer != null) {
                width = this.$refs.coilSelectorContainer.clientWidth / this.localData.pattern.length;
            }

            this.conductiveSections.forEach((section, key) => {
                var label = toTitleCase(section.name.toLowerCase());
                var label = label.replace("section", "stn");
                if (width > 0) {
                    var slice = section.name.length
                    if (width < 200)
                        slice = 4;
                    if (width < 150)
                        slice = 3;
                    if (width < 100)
                        slice = 2;
                    label = label.split(' ')
                        .map(item => item.length <= slice? item + ' ' : item.slice(0, slice) + '. ')
                        .join('');
                }
                shortenedNames[key] = label;
            })

            return shortenedNames
        },
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds && this.masStore.mas.magnetic.coil.turnsDescription == null && this.masStore.mas.magnetic.coil.bobbin != "Dummy") {
                    this.recentChange = true;
                    this.blockingRebounds = true;
                    this.assignCoilData();
                    setTimeout(() => {this.tryToWind();}, 10);
                    setTimeout(() => this.blockingRebounds = false, 10);
                }
            },
            deep: true
        },
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds && this.masStore.mas.magnetic.coil.turnsDescription == null && this.masStore.mas.magnetic.coil.bobbin != "Dummy") {
                    this.recentChange = true;
                    this.blockingRebounds = true;
                    setTimeout(() => {this.tryToWind();}, 10);
                    setTimeout(() => this.blockingRebounds = false, 10);
                }
            },
            deep: true
        },
        'masStore.mas.inputs.designRequirements.turnsRatios': {
            handler(newValue, oldValue) {
                this.resetProportionPerWinding(this.localData);
            },
            deep: true
        },
    },
    mounted () {
        this.tryToWind();
        this.assignLocalData(this.masStore.mas.magnetic);

        this.getProportionsAndPattern(this.masStore.mas.magnetic.coil);

        this.masStore.mas.magnetic.coil.functionalDescription.forEach((datum, sectionIndex) => {
            if (sectionIndex >= this.localData.dataPerSection.length) {
                this.localData.dataPerSection.push({
                    layersOrientation: this.localData.dataPerSection[sectionIndex - 1].layersOrientation,
                    turnsAlignment: this.localData.dataPerSection[sectionIndex - 1].turnsAlignment,
                    topOrLeftMargin: this.localData.dataPerSection[sectionIndex - 1].topOrLeftMargin,
                    bottomOrRightMargin: this.localData.dataPerSection[sectionIndex - 1].bottomOrRightMargin,
                });
            }
        })

        this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.tryToWind();
                this.assignLocalData(this.masStore.mas.magnetic);
                this.getProportionsAndPattern(this.masStore.mas.magnetic.coil);

                this.masStore.mas.magnetic.coil.functionalDescription.forEach((datum, sectionIndex) => {
                    if (sectionIndex >= this.localData.dataPerSection.length) {
                        this.localData.dataPerSection.push({
                            layersOrientation: this.localData.dataPerSection[sectionIndex - 1].layersOrientation,
                            turnsAlignment: this.localData.dataPerSection[sectionIndex - 1].turnsAlignment,
                            topOrLeftMargin: this.localData.dataPerSection[sectionIndex - 1].topOrLeftMargin,
                            bottomOrRightMargin: this.localData.dataPerSection[sectionIndex - 1].bottomOrRightMargin,
                        });
                    }
                })
            }
        })


        this.masStore.$onAction((action) => {
            if (action.name == "importedMas") {
                this.assignLocalData(this.masStore.mas.magnetic);
                this.getProportionsAndPattern(this.masStore.mas.magnetic.coil);
                this.tryToWind();

                this.masStore.mas.magnetic.coil.functionalDescription.forEach((datum, sectionIndex) => {
                    if (sectionIndex >= this.localData.dataPerSection.length) {
                        this.localData.dataPerSection.push({
                            layersOrientation: this.localData.dataPerSection[sectionIndex - 1].layersOrientation,
                            turnsAlignment: this.localData.dataPerSection[sectionIndex - 1].turnsAlignment,
                            topOrLeftMargin: this.localData.dataPerSection[sectionIndex - 1].topOrLeftMargin,
                            bottomOrRightMargin: this.localData.dataPerSection[sectionIndex - 1].bottomOrRightMargin,
                        });
                    }
                })
            }
        })

    },
    methods: {
        resetProportionPerWinding(localData) {
            localData.proportionPerWinding = [];
            localData.pattern = "";
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((item, index) => {
                localData.pattern += String(index + 1);
                localData.proportionPerWinding.push(1.0 / this.masStore.mas.magnetic.coil.functionalDescription.length);
            })
        },
        getWindingIndex(coil, windinName) {
            var foundWindingIndex = null;
            coil.functionalDescription.forEach((winding, windingIndex) => {
                if (winding.name == windinName) {
                    foundWindingIndex = windingIndex;
                }
            })
            return foundWindingIndex;
        },
        getProportionsAndPattern(coil) {
            if (coil.sectionsDescription != null) {
                const bobbinShape = coil.bobbin.processedDescription.windingWindows[0].shape;
                const sectionsOrientation = coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation;

                var windingDimensions = [];
                coil.functionalDescription.forEach((winding, windingIndex) => {
                    windingDimensions.push(0);
                })

                var windingDimensionsTotal = 0;
                this.localData.pattern = "";
                coil.sectionsDescription.forEach((section) => {
                    if (section.type == "conduction") {
                        const windingIndex = this.getWindingIndex(coil, section.partialWindings[0].winding);
                        this.localData.pattern += String(windingIndex + 1)
                        if (bobbinShape == "round") {
                            if (sectionsOrientation == "contiguous") {
                                windingDimensions[windingIndex] += section.dimensions[1];
                                windingDimensionsTotal += section.dimensions[1];
                            }
                            else {
                                windingDimensions[windingIndex] += section.dimensions[0];
                                windingDimensionsTotal += section.dimensions[0];
                            }
                        }
                        else {
                            if (sectionsOrientation == "contiguous") {
                                windingDimensions[windingIndex] += section.dimensions[1];
                                windingDimensionsTotal += section.dimensions[1];
                            }
                            else {
                                windingDimensions[windingIndex] += section.dimensions[0];
                                windingDimensionsTotal += section.dimensions[0];
                            }
                        }
                    }
                })
                this.localData.proportionPerWinding = []
                windingDimensions.forEach((elem) => {
                    this.localData.proportionPerWinding.push(roundWithDecimals(elem / windingDimensionsTotal, 0.01));
                })
            }
        },
        wind() {
            this.$emit("fits", true);
            this.$mkf.ready.then(_ => {
                try {
                    const inputCoil = deepCopy(this.masStore.mas.magnetic.coil);

                    const margins = [];
                    if (this.conductiveSections.length > 0) {
                        inputCoil["_turnsAlignment"] = {};
                        inputCoil["_layersOrientation"] = {};
                        this.localData.dataPerSection.forEach((datum, sectionIndex) => {
                            if (sectionIndex in this.conductiveSections) {
                                const sectionName = this.conductiveSections[sectionIndex].name
                                inputCoil["_turnsAlignment"][sectionName] = datum.turnsAlignment;
                                inputCoil["_layersOrientation"][sectionName] = datum.layersOrientation;
                            }
                            margins.push([datum.topOrLeftMargin, datum.bottomOrRightMargin])
                        })
                    }
                    else {
                        inputCoil["_turnsAlignment"] = [];
                        inputCoil["_layersOrientation"] = [];
                        this.localData.dataPerSection.forEach((datum, sectionIndex) => {
                            inputCoil["_turnsAlignment"].push(datum.turnsAlignment);
                            inputCoil["_layersOrientation"].push(datum.layersOrientation);
                            margins.push([datum.topOrLeftMargin, datum.bottomOrRightMargin])
                        })
                    }

                    const pattern = [];
                    this.localData.pattern.split('').forEach((char) => {
                        pattern.push(Number(char) - 1);
                    });
                    const coilJson = this.$mkf.wind(JSON.stringify(inputCoil), this.localData.repetitions, JSON.stringify(this.localData.proportionPerWinding), JSON.stringify(pattern), JSON.stringify(margins));

                    if (coilJson.startsWith("Exception")) {
                        this.tryingToSend = false;
                        console.error(coilJson);
                        return;
                    }
                    this.masStore.mas.magnetic.coil = JSON.parse(coilJson);
                    // this.assignLocalData(this.masStore.mas.magnetic);
                    const fits = this.$mkf.are_sections_and_layers_fitting(JSON.stringify(inputCoil));
                    this.$emit("fits", fits);

                    this.historyStore.addToHistory(this.masStore.mas);
                    this.tryingToSend = false;
                    this.historyStore.unblockAdditions();
                }
                catch (e) {
                    this.tryingToSend = false;
                    this.recentChange = true;
                    this.blockingRebounds = true;
                    this.assignLocalData(this.masStore.mas.magnetic);
                    this.tryToWind();
                    setTimeout(() => this.blockingRebounds = false, 100);
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
        assignLocalData(magnetic) {
            if (!this.blockingRebounds) {
                try {
                    if (magnetic.coil.bobbin != "" && magnetic.coil.bobbin != "Dummy") {
                        if (magnetic.coil.bobbin.processedDescription != null) {
                            if (magnetic.coil.bobbin.processedDescription.windingWindows != null) {
                                if (magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsAlignment != null) {
                                    this.localData.sectionsAlignment = magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsAlignment;
                                }
                                if (magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation != null) {
                                    this.localData.sectionsOrientation = magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation;
                                }
                                if (magnetic.coil.bobbin.processedDescription.wallThickness != null && magnetic.coil.bobbin.processedDescription.columnThickness != null) {
                                    this.localData.bobbinThickness = Math.min(magnetic.coil.bobbin.processedDescription.wallThickness, magnetic.coil.bobbin.processedDescription.columnThickness);
                                }
                            }
                        }
                    }
                    if (magnetic.coil.sectionsDescription != null && magnetic.coil.layersDescription != null) {
                        var conductionSectionIndex = 0;
                        magnetic.coil.sectionsDescription.forEach((section) => {
                            if (section.type == "conduction") {
                                if (this.localData.dataPerSection.length <= conductionSectionIndex) {
                                    this.localData.dataPerSection.push({
                                        layersOrientation: "overlapping",
                                        turnsAlignment: "spread",
                                    });
                                }
                                this.localData.dataPerSection[conductionSectionIndex].layersOrientation = section.layersOrientation;

                                magnetic.coil.layersDescription.forEach((layer, layerIndex) => {
                                    if (layer.section == section.name) {
                                        if (layer.type == "conduction") {
                                            this.localData.dataPerSection[conductionSectionIndex].turnsAlignment = layer.turnsAlignment;
                                        }
                                        else {

                                            if (section.layersOrientation == "overlapping") {
                                                this.localData.interlayerThickness = layer.dimensions[0];
                                            }
                                            else {
                                                this.localData.interlayerThickness = layer.dimensions[1];
                                            }

                                        }
                                    }
                                })

                                if (section.margin != null) {
                                    this.localData.dataPerSection[conductionSectionIndex].topOrLeftMargin = section.margin[0];
                                    this.localData.dataPerSection[conductionSectionIndex].bottomOrRightMargin = section.margin[1];
                                }

                                conductionSectionIndex += 1;
                            }
                            else {
                                if (this.localData.sectionsOrientation == "overlapping") {
                                    this.localData.intersectionThickness = section.dimensions[0];
                                }
                                else {
                                    this.localData.intersectionThickness = section.dimensions[1];
                                }
                            }
                        })
                    }

                    this.forceUpdate += 1;
                }
                catch (e) {
                    // setTimeout(() => this.assignLocalData(magnetic), 50);
                }
            }
        },
        assignCoilData() {
            if (this.masStore.mas.magnetic.coil.bobbin.processedDescription == null) {
                this.masStore.mas.magnetic.coil.bobbin.processedDescription = {};
            }
            if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows == null) {
                this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows = [];
                this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows.push({});
            }

            this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsAlignment = this.localData.sectionsAlignment;
            this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation = this.localData.sectionsOrientation;
        },
        coilUpdated() {
            this.updateDataPerSection();
            this.assignCoilData();
            this.recentChange = true;
            this.tryToWind();
        },
        updateDataPerSection() {

            while (this.localData.dataPerSection.length > this.localData.pattern.length) {
                this.localData.dataPerSection.pop();
            }

            this.localData.pattern.split('').forEach((windingIndexPlusOne, newSectionIndex) => {
                if (newSectionIndex >= this.localData.dataPerSection.length) {
                    var newSection = null;
                    this.localData.dataPerSection.forEach((section, sectionIndex) => {
                        if (this.localData.pattern.split('')[sectionIndex] == windingIndexPlusOne) {
                            newSection = deepCopy(section);
                        }
                    })
                    this.localData.dataPerSection.push(newSection);
                }
            })

        },
        marginUpdated(sectionIndex) {
            this.coilUpdated();
        },
        swapShowAlignmentOptions(showAlignmentOptions) {
            this.showAlignmentOptions = showAlignmentOptions;
        },
        swapShowInsulationOptions(showInsulationOptions) {
            this.showInsulationOptions = showInsulationOptions;
        },
        customizeCoil() {
        },
        bobbinUpdated(thickness) {
            this.$mkf.ready.then(_ => {

                const bobbinJson = this.$mkf.create_quick_bobbin(JSON.stringify(this.masStore.mas.magnetic.core), thickness);

                if (bobbinJson.startsWith("Exception")) {
                    this.tryingToSend = false;
                    console.error(bobbinJson);
                    return;
                }

                this.masStore.mas.magnetic.coil.bobbin = JSON.parse(bobbinJson);
                this.coilUpdated();
            })
        },
    }
}
</script>

<template>
    <div class="container" v-tooltip="styleTooltip">
        <div class="row">
            <Dimension 
                :disabled="readOnly"
                class="col-12 mb-1 ps-4 text-start"
                :name="'bobbinThickness'"
                :unit="'m'"
                :dataTestLabel="dataTestLabel + '-BobbinThickness'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="bobbinUpdated"
            />
        </div>
        <div class="row"  ref="coilSelectorContainer">
            <img :data-cy="dataTestLabel + '-BasicCoilSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <ListOfCharacters
                v-tooltip="tooltipsMagneticBuilder.sectionsInterleaving"
                v-if="!loading && masStore.mas.magnetic.coil.functionalDescription.length > 1"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-SectionsInterleaving'"
                :modelValue="localData.pattern" 
                @updateModelValue="localData.pattern = $event"
                :name="'pattern'"
                :replaceTitle="'Section Interl. Order'"
                :allowedCharacters="windingIndexesCharacters"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="coilUpdated"
            />
        </div>
               
        <div
            v-if="!$stateStore.hasCurrentApplicationMirroredWindings()"
            class="col-12"
        >
            <BasicCoilSectionAlignmentSelector 
                :data="localData"
                :showAlignmentOptions="showAlignmentOptions"
                :masStore="masStore"
                :readOnly="readOnly"
                @coilUpdated="coilUpdated"
            />
        </div>

        <div class="row mb-4" v-show="masStore.mas.magnetic.coil.sectionsDescription != null">
            <BasicCoilSectionInsulationSelector
                :data="localData"
                :showInsulationOptions="showInsulationOptions"
                :masStore="masStore"
                :readOnly="readOnly"
                @marginUpdated="marginUpdated"
            />
        </div>

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

        <BasicCoilSubmenu
            v-if="enableSubmenu"
            :readOnly="readOnly"
            class="col-12 mb-1 text-start"
            :dataTestLabel="dataTestLabel + '-BasicCoreSubmenu'"
            :enableAlignmentOptions="!loading"
            :enableCustomize="false"
            @showAlignmentOptions="swapShowAlignmentOptions"
            @showInsulationOptions="swapShowInsulationOptions"
            @customizeCore="customizeCoil"
        />
    </div>
</template>
