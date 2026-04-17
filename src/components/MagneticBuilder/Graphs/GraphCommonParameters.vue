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
    <div class="gcp-grid">
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
        :titleSameRow="false"
        :justifyContent="false"
        v-model="$stateStore.graphParameters"
        :options="availableModes"
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
        :name="'yAxisMode'"
        :titleSameRow="false"
        :justifyContent="false"
        v-model="$stateStore.graphParameters"
        :options="availableModes"
        :labelWidthProportionClass="'col-12'"
        :selectStyleClass="'col-12'"
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
}

.gcp-cell {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 9px;
    padding: 0.4rem 0.55rem 0.5rem 0.55rem;
    transition: background 0.15s, border-color 0.15s;
    text-align: start;
}

.gcp-cell:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(var(--bs-primary-rgb), 0.25);
}

.gcp-cell :deep(.row) {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

/* Uppercase pill caption above each input */
.gcp-cell :deep(.dim-label),
.gcp-cell :deep(.efl-label),
.gcp-cell :deep(label) {
    color: rgba(242, 242, 242, 0.65) !important;
    font-size: 0.66rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
    line-height: 1.1;
    background: transparent !important;
}

.gcp-cell :deep(input[type="number"]),
.gcp-cell :deep(.dim-input),
.gcp-cell :deep(.efl-select) {
    font-size: 0.88rem !important;
    font-weight: 600;
    height: 1.8rem !important;
}
</style>