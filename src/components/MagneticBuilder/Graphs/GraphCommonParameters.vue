<script setup>
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { removeTrailingZeroes, deepCopy, isMobile, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'

</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        frequencyDependent: {
            type: Boolean,
            default: true,
        },
        temperatureDependent: {
            type: Boolean,
            default: false,
        },
        dcBiasDependent: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const availableGraphs = {
            'impedanceOverFrequency': 'Impedance Over Frequency',
            'qFactorOverFrequency': 'Q Factor Over Frequency',
            'resistancesOverFrequency': 'Total Resistance Over Frequency',
            'windingResistancesOverFrequency': 'Resistances Per Winding Over Frequency',
            'coreLossesOverFrequency': 'Core Losses Over Frequency',
            'windingLossesOverFrequency': 'Winding Losses Over Frequency',
            'lossesOverFrequency': 'Total Losses Over Frequency',
            'magnetizingInductanceOverFrequency': 'Magnetizing Inductance Over Frequency',
            'magnetizingInductanceOverTemperature': 'Magnetizing Inductance Over Temperature',
            'magnetizingInductanceOverDcBias': 'Magnetizing Inductance Over DC Bias',
        }
        const availableModes = {
            'log': 'Log',
            'linear': 'Linear',
        }

        return {
            availableGraphs,
            availableModes,
        }
    }
}
</script>

<template>
    <div
        class="gcp-grid"
        :style="{
            '--gcp-value-font-size': $styleStore.magneticBuilder.inputFontSize?.['font-size'] ?? $styleStore.magneticBuilder.inputFontSize?.fontSize,
            /* Labels (uppercase+bold) read too big at the title token; use the
             * value token (inputFontSize, 1rem) so labels and inputs match. */
            '--gcp-label-font-size': $styleStore.magneticBuilder.inputFontSize?.['font-size'] ?? $styleStore.magneticBuilder.inputFontSize?.fontSize,
        }"
    >
    <ElementFromList
        class="gcp-cell"
        :dataTestLabel="dataTestLabel + '-GraphsSelector'"
        :name="'graph'"
        :titleSameRow="false"
        :justifyContent="false"
        v-model="$stateStore.graphParameters"
        :options="availableGraphs"
        :labelWidthProportionClass="'col-12'"
        :selectStyleClass="'col-12'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <ElementFromList
        class="gcp-cell"
        :dataTestLabel="dataTestLabel + '-GraphsSelector'"
        :name="'xAxisMode'"
        :titleSameRow="true"
        :justifyContent="true"
        v-model="$stateStore.graphParameters"
        :options="availableModes"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :selectStyleClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <ElementFromList
        class="gcp-cell"
        :dataTestLabel="dataTestLabel + '-GraphsSelector'"
        :name="'yAxisMode'"
        :titleSameRow="true"
        :justifyContent="true"
        v-model="$stateStore.graphParameters"
        :options="availableModes"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :selectStyleClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        v-if="frequencyDependent"
        :name="'minimumFrequency'"
        :replaceTitle="'Minimum Frequency'"
        :unit="'Hz'"
        :dataTestLabel="dataTestLabel + '-MinimumFrequency'"
        :min="1"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="false"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :valueWidthProportionClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        v-if="frequencyDependent"
        :name="'maximumFrequency'"
        :replaceTitle="'Maximum Frequency'"
        :unit="'Hz'"
        :dataTestLabel="dataTestLabel + '-MaximumFrequency'"
        :min="1"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="false"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :valueWidthProportionClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        v-if="temperatureDependent"
        :name="'minimumTemperature'"
        :replaceTitle="'Minimum Temperature'"
        :unit="'°C'"
        :dataTestLabel="dataTestLabel + '-MinimumTemperature'"
        :min="0.0001"
        :max="1000"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="true"
        :allowZero="true"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :valueWidthProportionClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        v-if="temperatureDependent"
        :name="'maximumTemperature'"
        :replaceTitle="'Maximum Temperature'"
        :unit="'°C'"
        :dataTestLabel="dataTestLabel + '-MaximumTemperature'"
        :min="0.0001"
        :max="1000"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="true"
        :allowZero="true"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :valueWidthProportionClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        v-if="dcBiasDependent"
        :name="'minimumDcBias'"
        :replaceTitle="'Minimum DC Bias'"
        :unit="'A'"
        :dataTestLabel="dataTestLabel + '-MinimumDcBias'"
        :min="0"
        :max="1000"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="true"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :valueWidthProportionClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        v-if="dcBiasDependent"
        :name="'maximumDcBias'"
        :replaceTitle="'Maximum DC Bias'"
        :unit="'A'"
        :dataTestLabel="dataTestLabel + '-MaximumDcBias'"
        :min="0"
        :max="1000"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="true"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12 md:col-7'"
        :valueWidthProportionClass="'col-12 md:col-5'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    <Dimension class="gcp-cell"
        :name="'numberPoints'"
        :replaceTitle="'No. Points'"
        :unit="null"
        :dataTestLabel="dataTestLabel + '-NumberPoints'"
        :min="0"
        :justifyContent="false"
        :defaultValue="1"
        :allowNegative="false"
        :allowZero="false"
        :modelValue="$stateStore.graphParameters"
        :labelWidthProportionClass="'col-12'"
        :valueWidthProportionClass="'col-12'"
        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
        :textColor="$styleStore.magneticBuilder.inputTextColor"
    />
    </div>
</template>

<style scoped>
.gcp-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.1rem;
    background-color: var(--p-dark);
}

.gcp-cell {
    background: transparent;
    border: 0;
    border-radius: 9px;
    padding: 0.4rem 0.55rem 0.5rem 0.55rem;
    transition: background 0.15s, border-color 0.15s;
    text-align: start;
}

.gcp-cell:hover {
    background: rgba(var(--p-white-rgb), 0.05);
    border-color: rgba(var(--p-primary-rgb), 0.25);
}

.gcp-cell :deep(.row) {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

/* Uppercase pill caption above each input — label font size driven by the
 * host style store (inputTitleFontSize) via --gcp-label-font-size, matching
 * how the Core Configuration panel sizes its field labels. */
.gcp-cell :deep(.dim-label),
.gcp-cell :deep(.efl-label),
.gcp-cell :deep(label) {
    color: rgba(var(--p-white-rgb), 0.65) !important;
    font-size: var(--gcp-label-font-size, 1.25rem) !important;
    font-weight: 700 !important;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
    line-height: 1.1;
    background: transparent !important;
}

.gcp-cell :deep(.p-select-label),
.gcp-cell :deep(.p-select .p-select-label),
.gcp-cell :deep(.p-inputnumber-input),
.gcp-cell :deep(.p-inputnumber input),
.gcp-cell :deep(input.p-inputtext),
.gcp-cell :deep(.dwt-unit-addon),
.gcp-cell :deep(.dim-unit),
.gcp-cell :deep(.dim-input),
.gcp-cell :deep(.dim-input input),
.gcp-cell :deep(.efl-select) {
    /* Value/input font size driven by the host style store (inputFontSize)
     * via --gcp-value-font-size, matching the Core Configuration panel's
     * --core-config-value-font-size. */
    font-size: var(--gcp-value-font-size, 1rem) !important;
    font-weight: 600;
    min-height: 1.95rem;
}

/* Fix unit-dropdown width so the InputNumber's right edge lines up
 * between rows regardless of unit string length (kHz vs MHz). */
.gcp-cell :deep(.dwt-unit-addon),
.gcp-cell :deep(.dim-unit) {
    width: 3.5rem !important;
    min-width: 3.5rem !important;
    max-width: 3.5rem !important;
    flex: 0 0 3.5rem !important;
}

/* Keep cell content inside the panel and align Dimension value groups
 * (input + unit selector) to the right edge of the cell so they line up
 * with the X/Y axis-mode dropdowns above. */
.gcp-cell { overflow: hidden; }
.gcp-cell :deep([class*="col-"]) {
    box-sizing: border-box;
    min-width: 0;
}
/* Right-align the value column's content so the input + unit dropdown
 * stops at the cell's right edge instead of starting at the col's left. */
.gcp-cell :deep(.col-5),
.gcp-cell :deep(.md\:col-5) {
    display: flex;
    justify-content: flex-end;
}
.gcp-cell :deep(.p-inputgroup) {
    max-width: 100%;
    flex-wrap: nowrap;
}
.gcp-cell :deep(.p-inputgroup .p-inputnumber) {
    flex: 1 1 0;
    min-width: 0;
}
.gcp-cell :deep(.p-inputgroup .p-inputnumber input) {
    width: 100%;
    min-width: 0;
}
.gcp-cell :deep(.p-inputgroup-addon),
.gcp-cell :deep(.dwt-unit-addon) {
    flex: 0 0 auto;
    max-width: 4.5rem;
}
</style>