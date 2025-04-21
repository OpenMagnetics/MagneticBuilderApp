<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { useHistoryStore } from '../../../stores/history'
import { combinedStyle, deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { gapTypes } from '/WebSharedComponents/assets/js/defaults.js'
import Core3DVisualizer from '/WebSharedComponents/Common/Core3DVisualizer.vue'
import Core2DVisualizer from '/WebSharedComponents/Common/Core2DVisualizer.vue'
import AdvancedCoreSelectorGap from './AdvancedCoreSelectorGap.vue'

</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        core: {
            type: Object,
            required: true,
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
        allowFamilyChange: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const localData = [];
        const localCore = deepCopy(this.core);
        const errorMessage = "";
        const errorMessages = {};
        const loading = false;
        const imageUpToDate = true;

        return {
            localData,
            localCore,
            imageUpToDate,
            errorMessage,
            errorMessages,
            loading,
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.assignLocalData(this.core);

        this.$stateStore.$onAction((action) => {
            if (action.name == "redraw") {
                this.redraw();
            }
            if (action.name == "applyChanges") {
                this.applyChanges();
            }
        })
    },
    methods: {
        computeErrorMessages() {
            this.errorMessages = {}
            Object.keys(this.localData.dimensions).forEach((key) => {
                if (this.localData.dimensions[key] == null) {
                    if (key == 'G' || key == 'H') {
                        this.localData.dimensions[key] = 0;
                    }
                    else {
                        this.errorMessages[key] = key + ' cannot be empty';
                    }
                }
                else if (this.localData.dimensions[key] == 0) {
                    if ((key != 'H' || this.localData.family == 'ur') &&
                        (key != 'G') &&
                        (key == 'C' && this.localData.family != 'p')) {
                        this.errorMessages[key] = key + ' must be greater than 0';
                    }
                }
                else {
                    if (key == 'B'){
                        if (this.localData.dimensions['D'] >= this.localData.dimensions['B']){
                            this.errorMessages[key] = 'B must be greater than D';
                        }
                    }
                    else if (key == 'D'){
                        if (this.localData.dimensions['D'] >= this.localData.dimensions['B']){
                            this.errorMessages[key] = 'D must be smaller than B';
                        }
                    }

                    if (key == 'A'){
                        if (this.localData.dimensions['E'] >= this.localData.dimensions['A']){
                            this.errorMessages[key] = 'A must be greater than E';
                        }
                    }
                    else if (key == 'E'){
                        if (this.localData.dimensions['E'] >= this.localData.dimensions['A']){
                            this.errorMessages[key] = 'E must be smaller than A';
                        }
                    }

                    if (!(this.localData.family == "ur")) {
                        if (key == 'E'){
                            if (this.localData.dimensions['F'] >= this.localData.dimensions['E']){
                                this.errorMessages[key] = 'E must be greater than F';
                            }
                        }
                        else if (key == 'F'){
                            if (this.localData.dimensions['F'] >= this.localData.dimensions['E']){
                                this.errorMessages[key] = 'F must be smaller than E';
                            }
                        }
                    }

                    if (key == 'E'){
                        if (this.localData.dimensions['G'] > this.localData.dimensions['E']){
                            this.errorMessages[key] = 'E must be greater than G';
                        }
                    }
                    else if (key == 'G'){
                        if (this.localData.dimensions['G'] > this.localData.dimensions['E']){
                            this.errorMessages[key] = 'G must be smaller than E';
                        }
                    }

                    if (this.localData.family == "er") {
                        if (this.localData.dimensions['G'] > 0) {
                            if (key == 'F'){
                                if (this.localData.dimensions['G'] < this.localData.dimensions['F']){
                                    this.errorMessages[key] = 'F must be smaller than G';
                                }
                            }
                            else if (key == 'G'){
                                if (this.localData.dimensions['G'] < this.localData.dimensions['F']){
                                    this.errorMessages[key] = 'G must be greater than F';
                                }
                            }
                        }
                    }

                    if (!(this.localData.family == "rm" && this.localData.familySubtype == "2") && !(this.localData.family == "p" && this.localData.familySubtype != "2") && !(this.localData.family == "efd") && !(this.localData.family == "planar er") && !(this.localData.family == "ut") && this.localData.dimensions['C'] > 0) {
                        var c_f_condition = false;
                        if (this.localData.family != "er" && this.localData.family != "e" && this.localData.family != "etd" && this.localData.family != "ec") {
                            c_f_condition = this.localData.dimensions['F'] >= this.localData.dimensions['C'];
                        }
                        else {
                            c_f_condition = this.localData.dimensions['F'] > this.localData.dimensions['C'];
                        }
                        if (key == 'C'){
                            if (c_f_condition){
                                this.errorMessages[key] = 'C must be greater than F';
                            }
                        }
                        else if (key == 'F'){
                            if (c_f_condition){
                                this.errorMessages[key] = 'F must be smaller than C';
                            }
                        }
                    }

                    if (key == 'J'){
                        if (this.localData.dimensions['E'] > this.localData.dimensions['J']){
                            this.errorMessages[key] = 'J must be greater than E';
                        }
                    }
                    else if (key == 'E'){
                        if (this.localData.dimensions['E'] > this.localData.dimensions['J']){
                            this.errorMessages[key] = 'E must be smaller than J';
                        }
                    }
                    if (this.localData.family !== "efd" && this.localData.family !== "epx") {
                        if (key == 'K'){
                            if (this.localData.dimensions['F'] / 2 > this.localData.dimensions['K']){
                                this.errorMessages[key] = 'K must be greater than F/2';
                            }
                            else if (this.localData.dimensions['F'] / 2 + this.localData.dimensions['K'] > this.localData.dimensions['C'] ){
                                this.errorMessages[key] = 'C must be greater than F/2 + K';
                            }
                        }
                    }
                }
            })
        },
        assignLocalData(core) {
            console.log(core.processedDescription.columns)
            console.log(core.functionalDescription.gapping)
            core.processedDescription.columns.forEach((elem, index) => {
                this.localData.push({
                    type: "Ungapped",
                    gaps: [],
                });
            })
            core.functionalDescription.gapping.forEach((gap, gapIndex) => {
                var closestColumnIndex;
                var closestDistance = Number.MAX_VALUE;
                core.processedDescription.columns.forEach((column, columnIndex) => {
                    const distance = Math.pow(gap.coordinates[0] - column.coordinates[0], 2) + Math.pow(gap.coordinates[1] - column.coordinates[1], 2) + Math.pow(gap.coordinates[2] - column.coordinates[2], 2);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestColumnIndex = columnIndex;
                    }
                })
                this.localData[closestColumnIndex].gaps.push({
                    index: gapIndex,
                })
            })
        },
        redraw() {
            this.errorMessage = "";
            this.localCore.functionalDescription.shape.dimensions = deepCopy(this.localData.dimensions);
            this.localCore.functionalDescription.shape.family = deepCopy(this.localData.family);
            this.localCore.functionalDescription.shape.familySubtype = deepCopy(this.localData.familySubtype);
        },
        applyChanges() {
            this.errorMessage = "";
            this.localCore.functionalDescription.shape.dimensions = {};
            Object.keys(this.localData.dimensions).forEach((key) => {
                this.localCore.functionalDescription.shape.dimensions[key] = {};
                this.localCore.functionalDescription.shape.dimensions[key]["nominal"] = this.localData.dimensions[key];
            })

            this.localCore.functionalDescription.shape.family = deepCopy(this.localData.family);
            this.localCore.functionalDescription.shape.familySubtype = deepCopy(this.localData.familySubtype);
            this.localCore.functionalDescription.shape.type = "custom";
            this.localCore.functionalDescription.shape.name = this.localData.name;
            this.localCore.geometricalDescription = null;
            this.localCore.processedDescription = null;
            this.localCore.distributorsInfo = null;
            this.localCore.manufacturerInfo = null;
            this.localCore.name = "Custom";

            this.$stateStore.magneticBuilder.mode.core = this.$stateStore.MagneticBuilderModes.Basic;
            this.$emit("customizedCore", deepCopy(this.localCore));
            // this.core = deepCopy(this.localCore);
        },
        errorInDimensions() {
            this.errorMessage = "There is an error in the dimensions, please review them";
        },
        gapTypeChanged() {
            this.processCore();
        },
        gapLengthChanged(newLength, gapIndex) {
            this.core.functionalDescription.gapping[gapIndex].length = newLength;
            this.processCore();
        },
        gapHeightChanged(newHeight, gapIndex) {
            this.core.functionalDescription.gapping[gapIndex].coordinates[1] = newHeight;
            this.processCore();
        },
        addGap() {
        },
        removeGap() {
        },
        processCore() {
            this.$mkf.ready.then(_ => {
                var core = deepCopy(this.core);
                core.geometricalDescription = null;
                core.processedDescription = null;

                const coreResult = this.$mkf.calculate_core_data(JSON.stringify(core), false);
                if (coreResult.startsWith("Exception")) {
                    console.error(coreResult);
                }
                else {
                    core = JSON.parse(coreResult);
                    this.core.functionalDescription = core.functionalDescription;
                    this.core.processedDescription = core.processedDescription;
                    this.core.geometricalDescription = core.geometricalDescription;
                }

                console.log(deepCopy(this.core))
            })
        }
    },
    computed: {
        reorderedColumns() {
            if (this.localData.length == 3) {
                return [this.localData[1], this.localData[0], this.localData[2]];
            }
            else {
                return this.localData;
            }
        },
        columnNames() {
            if (this.localData.length == 3) {
                return ["Left column", "Central column", "Right column"];
            }
            else {
                return ["Winding column", "Return column"];
            }
        },
        columnImages() {
            if (this.localData.length == 3) {
                return ["/images/columns/leftColumn.svg", "/images/columns/centralColumn.svg", "/images/columns/rightColumn.svg"];
            }
            else {
                return ["/images/columns/centralColumn.svg", "/images/columns/rightColumn.svg"];
            }
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div
                v-for="gapsPerColumn, columnIndex in reorderedColumns"
                class="column-container col-3 row mb-1 text-center"
                :style="{'background-image': `url(${columnImages[columnIndex]}`}"
            >
                <div>
                    <label
                        :style="combinedStyle([{'background': 'transparent'}, $styleStore.magneticBuilder.inputTitleFontSize])"
                        class="text-center"
                    >
                        {{columnNames[columnIndex]}}
                    </label>
                    <ElementFromList
                        class="col-12 px-4 mb-3 text-start"
                        :dataTestLabel="dataTestLabel + '-GapType'"
                        :name="'type'"
                        :titleSameRow="true"
                        :justifyContent="true"
                        v-model="reorderedColumns[columnIndex]"
                        :options="gapTypes"
                        :labelWidthProportionClass="'col-sm-12 col-md-4'"
                        :valueWidthProportionClass="'col-sm-12 col-md-8'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="{'background': 'transparent'}"
                        :valueBgColor="{'background': 'transparent'}"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                        @update="gapTypeChanged"
                    />
                    <div 
                        v-if="gapsPerColumn.type == 'Distributed'"
                        class="px-3 my-1"
                    >
                        <button
                            :style="$styleStore.magneticBuilder.addButton"
                            :data-cy="dataTestLabel + 'add-gap-button'"
                            class="btn col-sm-12 col-md-6"
                            @click="addGap(columnIndex)"

                        >
                            {{'Add gap'}}
                        </button>
                        <button
                            :style="$styleStore.magneticBuilder.utilityButton"
                            :data-cy="dataTestLabel + 'add-gap-button'"
                            class="btn col-sm-12 col-md-6"
                            @click="addGap(columnIndex)"

                        >
                            {{'Auto place'}}
                        </button>
                    </div>
                    <div
                        v-for="gap in gapsPerColumn.gaps"
                        class="col-12 mb-1 px-1 text-start"
                    >
                        <AdvancedCoreSelectorGap 
                            :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorGap-' + gap.index"
                            :gap="core.functionalDescription.gapping[gap.index]"
                            :enableRemoveButton="gapsPerColumn.gaps.length > 1"
                            @gapLengthChanged="gapLengthChanged($event, gap.index)"
                            @gapHeightChanged="gapHeightChanged($event, gap.index)"
                        />
                    </div>
                </div>
            </div>
            <label class="text-danger col-12 pt-1" style="font-size: 1em">{{errorMessage}}</label>

        </div>
    </div>
</template>

<style>
@media (min-width: 1200px) {
    .column-container {
        background-size: 80%; 
        background-repeat: no-repeat;
        background-position: center top;
        height: auto;
        min-height: 52vh;
    }
}
</style>
