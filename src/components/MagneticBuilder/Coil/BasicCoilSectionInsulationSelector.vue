<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { toTitleCase, checkAndFixMas, deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import SectionSelector from './SectionSelector.vue'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
</script>

<script>

export default {
    emits: ['marginUpdated', 'closeInsulation'],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        data: {
            type: Object,
            default: 0,
        },
        showInsulationOptions: {
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
        const taskQueueStore = useTaskQueueStore();
        const forceUpdate = 0;
        const blockingRebounds = false;
        const selectedSectionIndex = 0;
        const topOrLeftMarginErrorMessage = "";
        const bottomOrRightMarginErrorMessage = "";

        return {
            taskQueueStore,
            forceUpdate,
            blockingRebounds,
            selectedSectionIndex,
            topOrLeftMarginErrorMessage,
            bottomOrRightMarginErrorMessage,
        }
    },
    computed: {
        topOrLeftMarginTooltip() {
            if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == 'contiguous') {
                return tooltipsMagneticBuilder.leftMargin;
            }
            else {
                return tooltipsMagneticBuilder.topMargin;
            }
        },
        bottomOrRightMarginTooltip() {
            if (this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == 'contiguous') {
                return tooltipsMagneticBuilder.rightMargin;
            }
            else {
                return tooltipsMagneticBuilder.bottomMargin;
            }
        },
    },
    watch: {
    },
    mounted () {
    },
    methods: {
        interlayerThicknessUpdated(value) {
            if (!this.blockingRebounds) {
                this.$emit('marginUpdated');
            }
        },
        intersectionThicknessUpdated(value) {
            if (!this.blockingRebounds) {
                this.$emit('marginUpdated');
            }
        },
        topOrInnerMarginUpdated(sectionIndex) {
            if (!this.blockingRebounds) {
                const isMarginHorizontal = this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == "contiguous";

                this.taskQueueStore.checkIfFits(this.masStore.mas.magnetic.coil.bobbin, this.data.dataPerSection[sectionIndex].topOrLeftMargin, isMarginHorizontal).then((fits) => {
                    if (fits) {
                        this.$emit('marginUpdated', sectionIndex);
                        this.topOrLeftMarginErrorMessage = "";
                    }
                    else{
                        this.topOrLeftMarginErrorMessage = "Margin is larger than winding window";
                    }
                })
                .catch(error => {
                    console.error(error);
                });
            }
        },
        bottomOrOuterMarginUpdated(sectionIndex) {
            if (!this.blockingRebounds) {
                const isMarginHorizontal = this.masStore.mas.magnetic.coil.bobbin.processedDescription.windingWindows[0].sectionsOrientation == "contiguous";
                this.taskQueueStore.checkIfFits(this.masStore.mas.magnetic.coil.bobbin, this.data.dataPerSection[sectionIndex].topOrLeftMargin, isMarginHorizontal).then((fits) => {
                    if (fits) {
                        this.$emit('marginUpdated', sectionIndex);
                        this.bottomOrRightMarginErrorMessage = "";
                    }
                    else{
                        this.bottomOrRightMarginErrorMessage = "Margin is larger than winding window";
                    }
                })
                .catch(error => {
                    console.error(error);
                });
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
    <div v-show="showInsulationOptions && masStore.mas.magnetic.coil.sectionsDescription != null" class="insulation-panel">
        <div class="insulation-header">
            <div class="insulation-header-left">
                <i class="bi bi-shield-shaded"></i>
                <span>Insulation Settings</span>
            </div>
            <button
                type="button"
                class="insulation-close-btn"
                aria-label="Close insulation settings"
                @click="$emit('closeInsulation')"
            >
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <div class="insulation-body">
            <Dimension
                :disabled="readOnly"
                class="col-12 mb-2 text-start"
                :name="'interlayerThickness'"
                :replaceTitle="'Inter-layer ins. thickness'"
                :unit="'m'"
                :defaultZeroUnit="0.001"
                :dataTestLabel="dataTestLabel + '-InterlayerThickness'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="interlayerThicknessUpdated"
            />
            <Dimension
                :disabled="readOnly"
                class="col-12 mb-2 text-start"
                :name="'intersectionThickness'"
                :replaceTitle="'Inter-section ins. thickness'"
                :unit="'m'"
                :defaultZeroUnit="0.001"
                :dataTestLabel="dataTestLabel + '-IntersectionThickness'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="intersectionThicknessUpdated"
            />
            
            <SectionSelector
                :sectionIndex="selectedSectionIndex"
                :masStore="masStore"
                @sectionIndexChanged="sectionIndexChanged"
            />

            <Dimension
                v-tooltip="topOrLeftMarginTooltip"
                :disabled="readOnly"
                class="col-12 mb-2 text-start"
                :name="'topOrLeftMargin'"
                :replaceTitle="'Top Margin'"
                :unit="'m'"
                :defaultZeroUnit="0.001"
                :dataTestLabel="dataTestLabel + '-TopOrLeftMargin'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data.dataPerSection[selectedSectionIndex]"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="topOrInnerMarginUpdated(selectedSectionIndex)"
            />
            <label :data-cy="dataTestLabel + '-TopOrLeftMarginErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{topOrLeftMarginErrorMessage}}</label>

            <Dimension
                v-tooltip="bottomOrRightMarginTooltip"
                :disabled="readOnly"
                class="col-12 mb-2 text-start"
                :name="'bottomOrRightMargin'"
                :replaceTitle="'Bottom Margin'"
                :unit="'m'"
                :defaultZeroUnit="0.001"
                :dataTestLabel="dataTestLabel + '-BottomOrRightMargin'"
                :numberDecimals="6"
                :min="1e-6"
                :max="1"
                :allowNegative="false"
                :allowZero="true"
                :modelValue="data.dataPerSection[selectedSectionIndex]"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-3 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="bottomOrOuterMarginUpdated(selectedSectionIndex)"
            />
            <label :data-cy="dataTestLabel + '-BottomOrRightMarginErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{bottomOrRightMarginErrorMessage}}</label>
        </div>
    </div>
</template>

<style scoped>
.insulation-panel {
    background: linear-gradient(145deg, rgba(var(--bs-primary-rgb), 0.08) 0%, rgba(var(--bs-primary-rgb), 0.02) 100%);
    border: 1px solid rgba(var(--bs-primary-rgb), 0.2);
    border-radius: 14px;
    padding: 0;
    margin: 0.15rem 0 0.5rem 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    overflow: hidden;
    animation: slideDown 0.25s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.insulation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: rgba(var(--bs-primary-rgb), 0.12);
    border-bottom: 1px solid rgba(var(--bs-primary-rgb), 0.15);
    font-weight: 600;
    font-size: 0.92rem;
    color: var(--bs-primary);
    letter-spacing: 0.02em;
}

.insulation-header-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.insulation-header-left i {
    font-size: 1rem;
    filter: drop-shadow(0 0 4px rgba(var(--bs-primary-rgb), 0.4));
}

.insulation-close-btn {
    appearance: none;
    background: transparent;
    border: none;
    color: var(--bs-primary);
    font-size: 1rem;
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.insulation-close-btn:hover {
    background: rgba(var(--bs-primary-rgb), 0.15);
    color: var(--bs-white);
}

.insulation-body {
    padding: 0.5rem 0.6rem 0.5rem 1.15rem;
}

.insulation-body :deep(.form-label),
.insulation-body :deep(label) {
    padding-left: 0.35rem !important;
}
</style>
