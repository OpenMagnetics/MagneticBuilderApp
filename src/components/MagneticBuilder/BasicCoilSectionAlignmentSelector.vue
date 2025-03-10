<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { toTitleCase, checkAndFixMas, deepCopy, range } from '/WebSharedComponents/assets/js/utils.js'
import ArrayProportions from '/WebSharedComponents/DataInput/ArrayProportions.vue'
import SectionSelector from './SectionSelector.vue'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        data: {
            type: Object,
            default: 0,
        },
        showAlignmentOptions: {
            type: Boolean,
            default: false,
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
        const windingOrientations = {};
        const coilAlignments = {};
        const forceUpdate = 0;
        const blockingRebounds = false;
        const sectionsOrientations = {};
        const selectedSectionIndex = 0;

        return {
            windingOrientations,
            coilAlignments,
            forceUpdate,
            blockingRebounds,
            sectionsOrientations,
            selectedSectionIndex,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
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
        shortenedNames() {
            const shortenedNames = {}

            var width = 0;
            if (this.$refs.coilSelectorContainer != null) {
                width = this.$refs.coilSelectorContainer.clientWidth / this.numberSections;
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
        showAlignmentOptions(newValue, oldValue) {
            this.forceUpdate += 1;
            this.blockingRebounds = true;
            setTimeout(() => this.blockingRebounds = false, 10);
        },
    },
    mounted () {
        this.getSectionOrientations();
        this.getWindingOrientations();
        this.getCoilAlignments();
    },
    methods: {
        getSectionOrientations() {
            this.$mkf.ready.then(_ => {
                const handle = this.$mkf.get_available_winding_orientations();
                for (var i = handle.size() - 1; i >= 0; i--) {
                    const type = handle.get(i);
                    this.sectionsOrientations[type] = toTitleCase(type);
                }
            });
        },
        getWindingOrientations() {
            this.$mkf.ready.then(_ => {
                const handle = this.$mkf.get_available_winding_orientations();
                for (var i = handle.size() - 1; i >= 0; i--) {
                    const type = handle.get(i);
                    this.windingOrientations[type] = toTitleCase(type);
                }
            });
        },
        getCoilAlignments() {
            this.$mkf.ready.then(_ => {
                const handle = this.$mkf.get_available_coil_alignments();
                for (var i = handle.size() - 1; i >= 0; i--) {
                    const type = handle.get(i);
                    this.coilAlignments[type] = toTitleCase(type);
                }
            });
        },
        coilUpdated() {
            if (!this.blockingRebounds) {
                this.$emit('coilUpdated');
            }
        },
        sectionIndexChanged(sectionIndex) {
            this.selectedSectionIndex = sectionIndex;
            this.forceUpdate += 1;
            this.blockingRebounds = true;
            setTimeout(() => this.blockingRebounds = false, 10);
        },
    }
}
</script>

<template>
    <div class="container p-0">
        <div class="row"  ref="coilSelectorContainer" v-tooltip="styleTooltip">

            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.windingsOrientation"
                v-if="showAlignmentOptions"
                :disabled="readOnly"
                class="col-12 mb-2 text-start"
                :dataTestLabel="dataTestLabel + '-sectionsOrientation'"
                :name="'sectionsOrientation'"
                :replaceTitle="'Windings Orientation'"
                :titleSameRow="true"
                :justifyContent="true"
                :modelValue="data"
                :options="sectionsOrientations"
                :labelWidthProportionClass="'col-7'"
                :selectStyleClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="coilUpdated"
                @update:modelValue="data = $event"
            />
            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.sectionsAlignment"
                v-if="showAlignmentOptions"
                :disabled="readOnly"
                class="col-12 mb-2 text-start"
                :dataTestLabel="dataTestLabel + '-SectionsAlignment'"
                :name="'sectionsAlignment'"
                :replaceTitle="'Section Alignment'"
                :titleSameRow="true"
                :justifyContent="true"
                :modelValue="data"
                :options="coilAlignments"
                :labelWidthProportionClass="'col-6'"
                :selectStyleClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="coilUpdated"
                @update:modelValue="data = $event"
            />

            <SectionSelector
                v-show="showAlignmentOptions" 
                :sectionIndex="selectedSectionIndex"
                :masStore="masStore"
                @sectionIndexChanged="sectionIndexChanged"
            />


<!--             <ElementFromList
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-LayersOrientation'"
                :name="'layersOrientation'"
                :replaceTitle="'Layers Orientation'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="data.dataPerSection[selectedSectionIndex]"
                :options="windingOrientations"
                :labelWidthProportionClass="'col-7'"
                :selectStyleClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="coilUpdated"
            /> -->

            <ElementFromList
                v-tooltip="tooltipsMagneticBuilder.turnsAlignment"
                v-if="showAlignmentOptions"
                :disabled="readOnly"
                class="col-12 mb-1 text-start"
                :dataTestLabel="dataTestLabel + '-TurnsAlignment'"
                :name="'turnsAlignment'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="data.dataPerSection[selectedSectionIndex]"
                :options="coilAlignments"
                :labelWidthProportionClass="'col-6'"
                :selectStyleClass="'col-5'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="coilUpdated"
            />

            <ArrayProportions
                v-tooltip="tooltipsMagneticBuilder.proportions"
                v-if="showAlignmentOptions && masStore.mas.magnetic.coil.functionalDescription.length > 1"
                :disabled="readOnly"
                class="col-12 my-1 text-start"
                :dataTestLabel="dataTestLabel + '-ProportionPerWinding'"
                :modelValue="data.proportionPerWinding"
                :name="'proportionPerWinding'"
                :replaceTitle="'Proportions'"
                :suffix="'W'"
                :unit="'%'"
                :max="100"
                :min="1"
                :disabledScaling="true"
                :maximumNumberElements="12"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="coilUpdated"
            />
        </div>
    </div>
</template>
