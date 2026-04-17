<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import ListOfCharacters from '/WebSharedComponents/DataInput/ListOfCharacters.vue'
import BasicCoilSubmenu from './BasicCoilSubmenu.vue'
import CoilInfo from './CoilInfo.vue'
import BasicCoilFillingFactors from './BasicCoilFillingFactors.vue'
import BasicCoilSectionInsulationSelector from './BasicCoilSectionInsulationSelector.vue'
import BasicCoilSectionAlignmentSelector from './BasicCoilSectionAlignmentSelector.vue'
import Magnetic2DVisualizer from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import { toTitleCase, checkAndFixMas, deepCopy, roundWithDecimals, cleanCoil, generateHash } from '/WebSharedComponents/assets/js/utils.js'
import { useHistoryStore } from '../../../stores/history'
import { useTaskQueueStore } from '../../../stores/taskQueue'

import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>

export default {
    emits: ['fits', 'plotModeChange', 'swapIncludeFringing', 'errorInImage'],
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
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        imageUpToDate: {
            type: Boolean,
            default: true,
        },
        forceUpdateVisualizer: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        const taskQueueStore = useTaskQueueStore();
        const showAlignmentOptions = false;

        const showInsulationOptions = false;
        const loading = false;
        const blockingRebounds = false;
        const recentChange = false;
        const tryingToSend = false;
        const forceUpdate = 0; 
        let pattern = "";
        const oldMagneticCoilHash = 1;
        const oldInputsCoilHash = 1;

        let localData = {};

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
                bobbinWallThickness: 0.001,
                bobbinColumnThickness: 0.001,
                fillingFactors: {
                    areaFillingFactor: 0,
                    overlappingFillingFactor: 0,
                    contiguousFillingFactor: 0
                }
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
                bobbinWallThickness: 0.001,
                bobbinColumnThickness: 0.001,
                fillingFactors: {
                    areaFillingFactor: 0,
                    overlappingFillingFactor: 0,
                    contiguousFillingFactor: 0
                }
            };
        }
        this.resetProportionPerWinding(localData);

        const subscriptions = [];

        return {
            blockingRebounds,
            taskQueueStore,
            historyStore,
            localData,
            forceUpdate,
            showAlignmentOptions,
            showInsulationOptions,
            loading,
            recentChange,
            tryingToSend,
            oldMagneticCoilHash,
            oldInputsCoilHash,
            subscriptions,
            _windTimer: null,
            _reboundsTimer: null,
        }
    },
    computed: {
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
            let pattern = "";
            this.masStore.mas.magnetic.coil.functionalDescription.forEach((item, index) => {
                pattern += String(index + 1);
            })
            return pattern;
        },
        contiguousLabel() {
            try {
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].shape == "rectangular") {
                    return "height";
                }
                else {
                    return "angle";
                }
            }
            catch (e) {
                return "height"
            }
        },
        overlappingLabel() {
            try {
                if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].shape == "rectangular") {
                    return "width";
                }
                else {
                    return "radial";
                }
            }
            catch (e) {
                return "width"
            }
        },
        shortenedNames() {
            const shortenedNames = {}

            let width = 0;
            if (this.$refs.coilSelectorContainer != null) {
                width = this.$refs.coilSelectorContainer.clientWidth / this.localData.pattern.length;
            }

            this.conductiveSections.forEach((section, key) => {
                let label = toTitleCase(section.name.toLowerCase());
                label = label.replace("section", "stn");
                if (width > 0) {
                    let slice = section.name.length
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
    },
    mounted () {
        if (this.$stateStore.loadingDesign) {
            this._loadingTimer = setTimeout(() => {
                this.$stateStore.loadingDesign = false;
                this._loadingTimer = null;
            }, 2000);
        }
        else {
            this.tryToWind();
        }
        this.assignLocalData(this.masStore.mas.magnetic);

        this.getProportionsAndPattern(this.masStore.mas.magnetic.coil);

        this.subscriptions.push(this.masStore.$onAction((action) => {
            action.after(() => {
                if (action.name == "importedMas") {
                    this.resetProportionPerWinding(this.localData);
                    this.tryToWind();
                    this.assignLocalData(this.masStore.mas.magnetic);
                }
                if (action.name == "resetMas") {
                    // Reset localData to defaults based on application type
                    if (this.$stateStore.hasCurrentApplicationMirroredWindings()) {
                        this.localData.sectionsOrientation = "contiguous";
                        this.localData.sectionsAlignment = "spread";
                        this.localData.dataPerSection = [{
                            layersOrientation: "overlapping",
                            turnsAlignment: "centered",
                            topOrLeftMargin: 0,
                            bottomOrRightMargin: 0,
                        }];
                    }
                    else {
                        this.localData.sectionsOrientation = "overlapping";
                        this.localData.sectionsAlignment = "inner or top";
                        this.localData.dataPerSection = [{
                            layersOrientation: "overlapping",
                            turnsAlignment: "spread",
                            topOrLeftMargin: 0,
                            bottomOrRightMargin: 0,
                        }];
                    }
                    this.resetProportionPerWinding(this.localData);
                    this.assignLocalData(this.masStore.mas.magnetic);
                }
            });
        }));

        this.subscriptions.push(this.historyStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "historyPointerUpdated") {
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
            });
        }))

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "numberTurnsUpdated" || name == "newWireCreated") {
                    if (args[0] && !this.taskQueueStore.windingIndexChangeBlock) {
                        this.recentChange = true;
                        this.tryToWind();
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "bobbinFromCoreShapeGenerated" || name == "bobbinDifferentThicknessesGenerated") {
                    if (args[0]) {
                        this.taskQueueStore.bobbinRegenerationPending = false;
                        this.assignLocalData(this.masStore.mas.magnetic);
                        this.assignCoilData();
                        this.recentChange = true;
                        this.tryToWind();
                    }
                    else {
                        console.error(args[1])
                    }
                }
                if (name == "coreProcessed") {
                    if (args[0]) {
                        this.assignLocalData(this.masStore.mas.magnetic);
                        this.assignCoilData();
                        // Only trigger winding if no bobbin regeneration is pending.
                        // When shape/material/stacks change, bobbin will be regenerated
                        // and bobbinFromCoreShapeGenerated will trigger the wind instead.
                        // For gapping-only changes, no bobbin regen happens so we wind here.
                        if (!this.taskQueueStore.bobbinRegenerationPending) {
                            this.recentChange = true;
                            this.tryToWind();
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
        if (this._windTimer) clearTimeout(this._windTimer);
        if (this._reboundsTimer) clearTimeout(this._reboundsTimer);
        if (this._loadingTimer) clearTimeout(this._loadingTimer);
        this.subscriptions.forEach((subscription) => {subscription();})
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
            let foundWindingIndex = null;
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

                let windingDimensions = [];
                coil.functionalDescription.forEach((winding, windingIndex) => {
                    windingDimensions.push(0);
                })

                let windingDimensionsTotal = 0;
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
            // Skip winding for toroidal cores or when bobbin is dummy/invalid
            const bobbin = this.masStore.mas.magnetic.coil?.bobbin;
            if (!bobbin || bobbin === "Dummy" || bobbin === "") {
                this.tryingToSend = false;
                return;
            }

            const inputCoil = deepCopy(this.masStore.mas.magnetic.coil);

            const margins = [];
            // Use object format only when there are existing sections AND no new sections were added.
            // When new sections are added (e.g. interleaving pattern changed), we must use the array
            // format so the backend applies alignments by index to ALL sections, including new ones.
            if (this.conductiveSections.length > 0 && this.conductiveSections.length === this.localData.dataPerSection.length) {
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
            inputCoil["_interlayerInsulationThickness"] = this.localData.interlayerThickness;
            inputCoil["_intersectionInsulationThickness"] = this.localData.intersectionThickness;
            
            // Include margins in hash computation to detect margin changes even when sectionsDescription doesn't exist yet
            const coilWithMargins = {
                ...this.masStore.mas.magnetic.coil,
                _margins: margins
            };
            const inputCoilWithMargins = {
                ...inputCoil,
                _margins: margins
            };
            
            const newMagneticCoilHash = generateHash(JSON.stringify(coilWithMargins));
            const newInputsCoilHash = generateHash(JSON.stringify(inputCoilWithMargins));



            if (this.oldMagneticCoilHash != newMagneticCoilHash || this.oldInputsCoilHash != newInputsCoilHash) {
                this.oldMagneticCoilHash = newMagneticCoilHash;
                this.oldInputsCoilHash = newInputsCoilHash;

                this.$emit("fits", true);
                try {
                    const pattern = [];
                    this.localData.pattern.split('').forEach((char) => {
                        pattern.push(Number(char) - 1);
                    });

                    this.taskQueueStore.wind(inputCoil, this.localData.repetitions, this.localData.proportionPerWinding, pattern, margins).then((coil) => {
                        this.taskQueueStore.calculateFillingFactors(coil).then((fillingFactors) => {
                            this.localData.fillingFactors = fillingFactors;
                        })

                        this.taskQueueStore.checkIfSectionsAndLayersFit(coil).then((fits) => {
                            this.$emit("fits", fits);
                        })

                        // Preserve the bobbin from the existing coil before assigning the new coil
                        // The wind() function returns a coil without bobbin data
                        const existingBobbin = this.masStore.mas.magnetic.coil.bobbin;
                        this.masStore.mas.magnetic.coil = coil;
                        this.masStore.mas.magnetic.coil.bobbin = existingBobbin;

                        // Unblock FIRST so addToHistory succeeds — during initial
                        // mount and file import, history is blocked until this point.
                        this.historyStore.unblockAdditions();
                        this.historyStore.addToHistory(this.masStore.mas);
                        this.tryingToSend = false;
                    })
                    .catch(error => {
                        console.error(error);
                        this.tryingToSend = false;
                    });
                }
                catch (e) {
                    console.error(e);
                    this.tryingToSend = false;
                    this.recentChange = true;
                    this.blockingRebounds = true;
                    this.assignLocalData(this.masStore.mas.magnetic);
                    this.tryToWind();
                    if (this._reboundsTimer) clearTimeout(this._reboundsTimer);
                    this._reboundsTimer = setTimeout(() => {
                        this.blockingRebounds = false;
                        this._reboundsTimer = null;
                    }, 100);
                }
            }
            else {
                this.tryingToSend = false;
            }

        },
        tryToWind() {
            if (!this.tryingToSend) {
                this.recentChange = false
                this.tryingToSend = true
                if (this._windTimer) clearTimeout(this._windTimer);
                this._windTimer = setTimeout(() => {
                    this._windTimer = null;
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
                                    this.localData.bobbinWallThickness = magnetic.coil.bobbin.processedDescription.wallThickness;
                                    this.localData.bobbinColumnThickness = magnetic.coil.bobbin.processedDescription.columnThickness;
                                }
                            }
                        }
                    }
                    if (magnetic.coil.sectionsDescription != null && magnetic.coil.layersDescription != null) {
                        let conductionSectionIndex = 0;
                        magnetic.coil.sectionsDescription.forEach((section) => {
                            if (section.type == "conduction") {
                                if (this.localData.dataPerSection.length <= conductionSectionIndex) {
                                    const previousSection = conductionSectionIndex > 0
                                        ? this.localData.dataPerSection[conductionSectionIndex - 1]
                                        : null;
                                    // Try to inherit from the last section of the same winding
                                    const currentWindingChar = this.localData.pattern[conductionSectionIndex];
                                    let sameWindingSection = null;
                                    for (let i = conductionSectionIndex - 1; i >= 0; i--) {
                                        if (this.localData.pattern[i] == currentWindingChar) {
                                            sameWindingSection = this.localData.dataPerSection[i];
                                            break;
                                        }
                                    }
                                    const template = sameWindingSection || previousSection;
                                    this.localData.dataPerSection.push({
                                        layersOrientation: template ? template.layersOrientation : "overlapping",
                                        turnsAlignment: template ? template.turnsAlignment : "spread",
                                        topOrLeftMargin: template ? template.topOrLeftMargin : 0,
                                        bottomOrRightMargin: template ? template.bottomOrRightMargin : 0,
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
                                    if (section.margin.bottomOrRightWidth != null) {
                                        this.localData.dataPerSection[conductionSectionIndex].topOrLeftMargin = section.margin.topOrLeftWidth;
                                        this.localData.dataPerSection[conductionSectionIndex].bottomOrRightMargin = section.margin.bottomOrRightWidth;
                                    }
                                    else {
                                        this.localData.dataPerSection[conductionSectionIndex].topOrLeftMargin = section.margin[0];
                                        this.localData.dataPerSection[conductionSectionIndex].bottomOrRightMargin = section.margin[1];
                                    }
                                }

                                conductionSectionIndex += 1;
                            }
                            else {
                                if (this.localData.sectionsOrientation == "overlapping") {
                                    this.localData.intersectionThickness = section.dimensions[0];
                                }
                                else {
                                    if (this.masStore.mas.magnetic.core.functionalDescription.shape.family == 't') {
                                        const thickness = section.dimensions[0] * Math.sin(section.dimensions[1]);
                                        this.localData.intersectionThickness = thickness;
                                    }
                                    else {
                                        this.localData.intersectionThickness = section.dimensions[1];
                                    }
                                }
                            }
                        })
                    }

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

                    this.forceUpdate += 1;
                    this.$stateStore.storeWoundConfiguration(this.localData);
                }
                catch (e) {
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

            // Update margins in the coil's sectionsDescription
            if (this.masStore.mas.magnetic.coil.sectionsDescription != null) {
                let conductionSectionIndex = 0;
                this.masStore.mas.magnetic.coil.sectionsDescription.forEach((section) => {
                    if (section.type == "conduction" && conductionSectionIndex < this.localData.dataPerSection.length) {
                        if (section.margin == null) {
                            section.margin = {};
                        }
                        section.margin.topOrLeftWidth = this.localData.dataPerSection[conductionSectionIndex].topOrLeftMargin;
                        section.margin.bottomOrRightWidth = this.localData.dataPerSection[conductionSectionIndex].bottomOrRightMargin;
                        conductionSectionIndex++;
                    }
                });
            }
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
                    let newSection = null;
                    // Inherit from the last section of the same winding
                    for (let i = newSectionIndex - 1; i >= 0; i--) {
                        if (this.localData.pattern[i] == windingIndexPlusOne) {
                            newSection = deepCopy(this.localData.dataPerSection[i]);
                            break;
                        }
                    }
                    // Fallback to the immediately previous section
                    if (!newSection && newSectionIndex > 0) {
                        newSection = deepCopy(this.localData.dataPerSection[newSectionIndex - 1]);
                    }
                    // Final fallback to defaults
                    if (!newSection) {
                        newSection = {
                            layersOrientation: "overlapping",
                            turnsAlignment: "spread",
                            topOrLeftMargin: 0,
                            bottomOrRightMargin: 0,
                        };
                    }
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
            // Prevent regenerating bobbin with zero thickness values
            if (this.localData.bobbinWallThickness <= 0 || this.localData.bobbinColumnThickness <= 0) {
                console.warn('[BasicCoilSelector] Bobbin thickness must be greater than 0. Current values:', {
                    wall: this.localData.bobbinWallThickness,
                    column: this.localData.bobbinColumnThickness
                });
                return;
            }

            // Check if thickness actually changed from current bobbin to avoid infinite loop
            const currentBobbin = this.masStore.mas.magnetic.coil.bobbin;
            if (currentBobbin && currentBobbin !== "Dummy" && currentBobbin.processedDescription) {
                const currentWall = currentBobbin.processedDescription.wallThickness;
                const currentColumn = currentBobbin.processedDescription.columnThickness;
                const newWall = this.localData.bobbinWallThickness;
                const newColumn = this.localData.bobbinColumnThickness;
                
                if (Math.abs(currentWall - newWall) < 1e-9 && Math.abs(currentColumn - newColumn) < 1e-9) {
                    return;
                }
            }

            this.taskQueueStore.generateBobbinDifferentThicknesses(this.masStore.mas.magnetic.core, this.localData.bobbinWallThickness, this.localData.bobbinColumnThickness).then((bobbin) => {
                this.masStore.mas.magnetic.coil.bobbin = bobbin;
                this.coilUpdated();
            })
            .catch(error => {
                this.tryingToSend = false;
                console.error(error);
            });
        },
        showParasiticsView() {
            this.$stateStore.magneticBuilder.mode.coil = this.$stateStore.MagneticBuilderModes.Advanced;
        },
        toggleTemperaturePlot() {
            const currentMode = this.$stateStore.magnetic2DVisualizerState.plotMode;
            if (currentMode === 'temperature_field') {
                this.$emit('plotModeChange', 'basic');
            } else {
                this.$emit('plotModeChange', 'temperature_field');
            }
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="coil-config-panel">
            <div class="coil-config-header">
                <div class="coil-config-header-left">
                    <i class="fa-solid fa-gears"></i>
                    <span>Coil Configuration</span>
                </div>
                <div class="coil-config-header-right">
                    <button
                        v-if="!$stateStore.hasCurrentApplicationMirroredWindings()"
                        type="button"
                        :disabled="!enableSubmenu || loading"
                        :class="['coil-config-header-btn', showAlignmentOptions ? 'coil-config-header-btn-primary' : 'coil-config-header-btn-outline']"
                        @click="swapShowAlignmentOptions(!showAlignmentOptions)"
                    >
                        <i class="fa-solid fa-align-center"></i>
                        <span>Alignment</span>
                    </button>
                    <button
                        type="button"
                        :disabled="!enableSubmenu || loading"
                        :class="['coil-config-header-btn', showInsulationOptions ? 'coil-config-header-btn-primary' : 'coil-config-header-btn-outline']"
                        @click="swapShowInsulationOptions(!showInsulationOptions)"
                    >
                        <i class="fa-solid fa-shield-halved"></i>
                        <span>Insulation</span>
                    </button>
                </div>
            </div>
            <div class="coil-config-body">
                <div
                    v-if="useVisualizers && masStore.mas.magnetic != null && masStore.mas.magnetic.core != null && masStore.mas.magnetic.core.functionalDescription.shape != ''"
                    class="row mb-3"
                    :style="(imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;') + ' max-height: 50vh;'"
                >
                    <Magnetic2DVisualizer
                        :modelValue="masStore.mas"
                        :forceUpdate="forceUpdateVisualizer"
                        :operatingPointIndex="operatingPointIndex"
                        :enableZoom="false"
                        :enableOptions="false"
                        :enableHideOnFitting="enableSimulation"
                        :coilFits="true"
                        :plotModeInit="$stateStore.magnetic2DVisualizerState.plotMode"
                        :includeFringingInit="$stateStore.magnetic2DVisualizerState.includeFringing"
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color'] || $styleStore.magneticBuilder.main['background'] || '#1a1a1a'"
                        :textColor="$styleStore.magneticBuilder.inputTextColor?.color || 'var(--bs-white)'"
                        :buttonStyle="$styleStore.magneticBuilder.coilVisualizerButton"
                        @plotModeChange="$emit('plotModeChange', $event)"
                        @swapIncludeFringing="$emit('swapIncludeFringing', $event)"
                        @errorInImage="$emit('errorInImage')"
                        :loadingGif="$settingsStore.loadingGif"
                    />
                </div>

                <div class="builder-actions">
                    <button
                        v-if="enableSimulation"
                        :disabled="masStore.mas.magnetic == null || masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''"
                        :data-cy="dataTestLabel + '-Coil-ShowParasiticsView-button'"
                        class="builder-action-btn builder-action-btn-outline"
                        @click="showParasiticsView"
                    >
                        <i class="fa-solid fa-wave-square me-2"></i>Advanced Parasitics
                    </button>

                    <button
                        v-if="enableSimulation"
                        :disabled="masStore.mas.magnetic == null || masStore.mas.magnetic.core == null || masStore.mas.magnetic.core.functionalDescription.shape == ''"
                        :data-cy="dataTestLabel + '-Coil-ToggleTemperaturePlot-button'"
                        :class="['builder-action-btn', $stateStore.magnetic2DVisualizerState.plotMode === 'temperature_field' ? 'builder-action-btn-primary' : 'builder-action-btn-ghost']"
                        @click="toggleTemperaturePlot"
                    >
                        <i class="fa-solid fa-temperature-half me-2 temp-icon"></i>{{ $stateStore.magnetic2DVisualizerState.plotMode === 'temperature_field' ? 'Hide Temperature' : 'Show Temperature' }}
                    </button>
                </div>

                <div class="coil-config-grid">
                    <div v-if="masStore.mas.magnetic.core.functionalDescription.shape.family != 't'" class="coil-config-cell coil-config-cell-wide">
                        <Dimension 
                            :disabled="readOnly"
                            class="text-start"
                            :name="'bobbinWallThickness'"
                            :replaceTitle="'Wall Thickness'"
                            :unit="'m'"
                            :defaultZeroUnit="0.001"
                            :dataTestLabel="dataTestLabel + '-BobbinWallThickness'"
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
                    <div v-if="masStore.mas.magnetic.core.functionalDescription.shape.family != 't'" class="coil-config-cell coil-config-cell-wide">
                        <Dimension 
                            :disabled="readOnly"
                            class="text-start"
                            :name="'bobbinColumnThickness'"
                            :replaceTitle="'Column Thickness'"
                            :unit="'m'"
                            :defaultZeroUnit="0.001"
                            :dataTestLabel="dataTestLabel + '-BobbinColumnThickness'"
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
                    <div v-if="!loading && masStore.mas.magnetic.coil.functionalDescription.length > 1" class="coil-config-cell coil-config-cell-wide">
                        <img :data-cy="dataTestLabel + '-BasicCoilSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
                        <ListOfCharacters
                            v-tooltip="tooltipsMagneticBuilder.sectionsInterleaving"
                            :disabled="readOnly"
                            class="text-start"
                            :dataTestLabel="dataTestLabel + '-SectionsInterleaving'"
                            :modelValue="localData.pattern" 
                            @updateModelValue="localData.pattern = $event"
                            :name="'pattern'"
                            :replaceTitle="'Interleaving Order'"
                            :allowConsecutive="true"
                            :allowedCharacters="windingIndexesCharacters"
                            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                            :textColor="$styleStore.magneticBuilder.inputTextColor"
                            @update="coilUpdated"
                        />
                    </div>

                </div>

                <CoilInfo
                    v-if="!loading && enableSimulation"
                    ref="coilInfo"
                    :dataTestLabel="dataTestLabel + '-BasicCoreInfo'"
                    :advancedMode="$settingsStore.magneticBuilderSettings.advancedMode"
                    :masStore="masStore"
                    :operatingPointIndex="operatingPointIndex"
                    :enableAutoSimulation="enableAutoSimulation"
                    :fillingFactors="localData.fillingFactors"
                    :sectionsOrientation="localData.sectionsOrientation"
                />

                <BasicCoilSubmenu
                    v-if="enableSubmenu"
                    :readOnly="readOnly"
                    class="col-12 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-BasicCoreSubmenu'"
                    :enableCustomize="false"
                    @customizeCore="customizeCoil"
                />
            </div>
        </div>
               
        <BasicCoilSectionAlignmentSelector
            v-if="!$stateStore.hasCurrentApplicationMirroredWindings()"
            :data="localData"
            :showAlignmentOptions="showAlignmentOptions"
            :masStore="masStore"
            :readOnly="readOnly"
            @coilUpdated="coilUpdated"
            @closeAlignment="swapShowAlignmentOptions(false)"
        />

        <BasicCoilSectionInsulationSelector
            :data="localData"
            :showInsulationOptions="showInsulationOptions"
            :masStore="masStore"
            :readOnly="readOnly"
            @marginUpdated="marginUpdated"
            @closeInsulation="swapShowInsulationOptions(false)"
        />
    </div>
</template>

<style scoped>
.coil-config-panel {
    background: linear-gradient(145deg, rgba(var(--bs-primary-rgb), 0.06) 0%, rgba(var(--bs-primary-rgb), 0.02) 100%);
    border: 1px solid rgba(var(--bs-primary-rgb), 0.15);
    border-radius: 14px;
    padding: 0;
    margin: 0.15rem 0 0.25rem 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    overflow: hidden;
}

.coil-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.9rem;
    background: rgba(var(--bs-primary-rgb), 0.1);
    border-bottom: 1px solid rgba(var(--bs-primary-rgb), 0.12);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--bs-primary);
    letter-spacing: 0.02em;
}

.coil-config-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.coil-config-header-left i {
    font-size: 0.95rem;
    filter: drop-shadow(0 0 4px rgba(var(--bs-primary-rgb), 0.35));
}

.coil-config-header-right {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.coil-config-header-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: filter 0.15s, box-shadow 0.2s, transform 0.1s, background 0.15s, color 0.15s;
    white-space: nowrap;
}

.coil-config-header-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.coil-config-header-btn:not(:disabled):hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
}

.coil-config-header-btn-primary {
    background: linear-gradient(135deg,
        color-mix(in srgb, var(--bs-primary) 115%, transparent 0%) 0%,
        var(--bs-primary) 55%,
        rgb(var(--bs-primary-rgb) / 0.85) 100%);
    color: var(--bs-white);
    border: 1px solid color-mix(in srgb, var(--bs-primary) 70%, var(--bs-white) 30%);
    box-shadow:
        0 0 0 1px rgb(var(--bs-primary-rgb) / 0.35),
        0 2px 8px rgb(var(--bs-primary-rgb) / 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
}

.coil-config-header-btn-outline {
    background: rgb(var(--bs-primary-rgb) / 0.2);
    border: 1px solid rgb(var(--bs-primary-rgb) / 0.55);
    color: var(--bs-primary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.coil-config-header-btn-outline:hover {
    background: rgb(var(--bs-primary-rgb) / 0.3);
    border-color: rgb(var(--bs-primary-rgb) / 0.75);
    box-shadow: 0 2px 6px rgb(var(--bs-primary-rgb) / 0.25);
}

.coil-config-body {
    padding: 0.5rem 0.6rem;
}

.coil-config-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.15rem;
    background: var(--bs-dark);
    border-radius: 10px;
    padding: 0.35rem;
}

@media (max-width: 576px) {
    .coil-config-grid {
        grid-template-columns: 1fr;
    }
}

.coil-config-cell {
    border-radius: 10px;
    padding: 0.1rem 0.35rem 0.1rem 0.35rem;
}

.coil-config-cell-wide {
    grid-column: 1 / -1;
}

.coil-config-cell :deep(.form-label),
.coil-config-cell :deep(label) {
    padding-left: 0.35rem !important;
}

.builder-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    padding: 0 4px 12px;
}

.builder-action-btn {
    flex: 1 1 auto;
    min-width: fit-content;
    max-width: 260px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: filter 0.15s, box-shadow 0.2s, transform 0.1s, background 0.15s, color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.builder-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.builder-action-btn:not(:disabled):hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
}

.builder-action-btn-primary {
    background: linear-gradient(135deg,
        color-mix(in srgb, var(--bs-success) 115%, transparent 0%) 0%,
        var(--bs-success) 55%,
        rgb(var(--bs-success-rgb) / 0.85) 100%);
    color: var(--bs-white);
    border: 2px solid color-mix(in srgb, var(--bs-success) 70%, var(--bs-white) 30%);
    box-shadow:
        0 0 0 2px rgb(var(--bs-success-rgb) / 0.35),
        0 4px 14px rgb(var(--bs-success-rgb) / 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.builder-action-btn-outline {
    background: rgb(var(--bs-primary-rgb) / 0.2);
    border: 1px solid rgb(var(--bs-primary-rgb) / 0.55);
    color: var(--bs-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.builder-action-btn-ghost {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.temp-icon {
    color: var(--bs-danger);
}
</style>
