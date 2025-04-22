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
        const errorMessage = "";
        const errorMessages = {};
        const loading = false;
        const imageUpToDate = true;
        const engineConstants = {};
        const forceUpdate = 0;

        return {
            localData,
            imageUpToDate,
            engineConstants,
            errorMessage,
            errorMessages,
            forceUpdate,
            loading,
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.getEngineConstants();
    },
    methods: {
        async getEngineConstants() {
            this.$mkf.ready.then(_ => {
                var aux = this.$mkf.get_constants();
                this.engineConstants['residualGap'] = aux.get('residualGap');
                this.assignLocalData(this.core);
            });
        },
        computeErrorMessages() {},
        assignLocalData(core) {
            console.log(core.processedDescription.columns)
            console.log(core.functionalDescription.gapping)
            this.localData = [];
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
                    const distance = Math.pow(gap.coordinates[0] - column.coordinates[0], 2) + Math.pow(gap.coordinates[2] - column.coordinates[2], 2);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestColumnIndex = columnIndex;
                    }
                })
                this.localData[closestColumnIndex].gaps.push({
                    index: gapIndex,
                })
            })
            const groundGaps = [];
            this.localData.forEach((elem, index) => {
                if (elem.gaps.length > 1) {
                    elem.type = "Distributed";
                }
                else if (elem.gaps.length < 1) {
                    elem.type = "Ungapped";
                }
                else {
                    const index = elem.gaps[0].index;
                    if (core.functionalDescription.gapping[index].length <= this.engineConstants['residualGap']) {
                        elem.type = "Ungapped";
                    } 
                    else {
                        elem.type = "Ground";
                        groundGaps.push(core.functionalDescription.gapping[index].length);
                    }
                }
            })

            if (groundGaps.length == core.processedDescription.columns.length) {
                var allEqual = true;
                groundGaps.forEach((elem) => {
                    if ((groundGaps[0] - elem) / groundGaps[0] > 1e-6) {
                        allEqual = false;
                    }
                })
                if (allEqual) {
                    this.localData.forEach((elem, index) => {
                        elem.type = "Spacer";
                    })
                }
            }
        },
        errorInDimensions() {
            this.errorMessage = "There is an error in the dimensions, please review them";
        },
        gapTypeChanged(newType, columnIndex) {
            console.log(newType)
            console.log(columnIndex)
            if (newType == "Spacer") {
                const firstGapInColumnIndex = this.reorderedColumns[columnIndex].gaps[0].index;
                const firstGapInColumnLength = this.core.functionalDescription.gapping[firstGapInColumnIndex].length;
                this.setSpacer(firstGapInColumnLength);
            }
            else {
                this.reorderedColumns.forEach((elem) => {
                    if (elem.type == "Spacer") {
                        elem.type = "Ungapped";
                        this.core.functionalDescription.gapping[elem.gaps[0].index].length = this.engineConstants['residualGap'];
                        this.core.functionalDescription.gapping[elem.gaps[0].index].type = "substractive";
                    }
                })
            }
            this.processCore();
        },
        setSpacer(length) {
            this.reorderedColumns.forEach((elem) => {
                elem.type = "Spacer";
                for (var i = elem.gaps.length - 1; i >= 1; i--) {
                    this.removeGap(i);
                }
            })
            this.reorderedColumns.forEach((elem) => {
                this.core.functionalDescription.gapping[elem.gaps[0].index].length = length;
                this.core.functionalDescription.gapping[elem.gaps[0].index].type = "additive";
                this.core.functionalDescription.gapping[elem.gaps[0].index].coordinates[1] = 0;
            })

        },
        gapLengthChanged(newLength, gapIndex) {
            this.core.functionalDescription.gapping[gapIndex].length = newLength;
            this.processCore();
        },
        gapHeightChanged(newHeight, gapIndex) {
            this.core.functionalDescription.gapping[gapIndex].coordinates[1] = newHeight;
            this.processCore();
        },
        addGap(columnIndex) {
            const lastGapInColumnIndex = this.reorderedColumns[columnIndex].gaps[this.reorderedColumns[columnIndex].gaps.length - 1].index
            const lastGapInColumn = deepCopy(this.core.functionalDescription.gapping[lastGapInColumnIndex])
            this.core.functionalDescription.gapping.push(lastGapInColumn);
            console.log(this.core.functionalDescription.gapping)
            this.assignLocalData(this.core);
        },
        removeGap(gapIndex) {
            console.log(gapIndex)
            console.log(gapIndex)
            console.log(gapIndex)
            this.core.functionalDescription.gapping.splice(gapIndex, 1);
            this.assignLocalData(this.core);
            this.forceUpdate += 1;
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
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                        @update="gapTypeChanged($event, columnIndex)"
                    />
                    <div 
                        v-if="gapsPerColumn.type == 'Distributed'"
                        class="px-3 my-1 mb-3"
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
                        class="col-12 mb-1 px-2 text-start"
                    >
                        <AdvancedCoreSelectorGap 
                            :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorGap-' + gap.index"
                            :gap="core.functionalDescription.gapping[gap.index]"
                            :forceUpdate="forceUpdate"
                            :readOnly="reorderedColumns[columnIndex].type == 'Ungapped'"
                            :enableRemoveButton="gapsPerColumn.gaps.length > 1"
                            @gapLengthChanged="gapLengthChanged($event, gap.index)"
                            @gapHeightChanged="gapHeightChanged($event, gap.index)"
                            @removeGap="removeGap(gap.index)"
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
