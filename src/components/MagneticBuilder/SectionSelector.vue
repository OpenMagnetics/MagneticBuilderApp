<script setup>
import { combinedStyle } from '/WebSharedComponents/assets/js/utils.js'
import { toTitleCase, checkAndFixMas, deepCopy, range } from '/WebSharedComponents/assets/js/utils.js'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        sectionIndex: {
            type: Number,
            default: 0,
        },
        masStore: {
            type: Object,
            required: true,
        },
    },
    data() {

        return {
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
    },
    mounted () {
    },
    methods: {
    }
}
</script>

<template>
    <div class="container"  ref="coilSelectorContainer">
        <div v-if="numberSections > 1" class="row mb-2">
            <img :data-cy="dataTestLabel + '-BasicCoilBuilder-loading'" v-if="masStore.mas.magnetic.coil.sectionsDescription == null" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <div v-else class="accordion row m-0 p-0" id="coilBuilderAccordion bg-dark">
                <div :class="'col-lg-' + Number(12 / numberSections)" class="accordion-item border-0 m-0 p-0 bg-dark" v-for="key in range(0, numberSections)">
                    <h2 class="accordion-header" :id="'coreCalculatorheading-' + key">
                        <button
                        :style="combinedStyle([sectionIndex == key? $styleStore.magneticBuilder.inputSelectedTextColor : $styleStore.magneticBuilder.inputTextColor, $styleStore.magneticBuilder.inputFontSize, $styleStore.magneticBuilder.inputValueBgColor])"


                            :class="sectionIndex == key? 'collapsed' : ''"
                            class="accordion-button p-1"
                            type="button"
                            data-bs-toggle="collapse"
                            aria-expanded="false"
                            :aria-controls="'coilBuilderAccordionHeading' + key"
                            @click="$emit('sectionIndexChanged', key)">
                            {{shortenedNames[key]}}
                        </button>
                    </h2>
                </div>
            </div>

        </div>
    </div>
</template>
