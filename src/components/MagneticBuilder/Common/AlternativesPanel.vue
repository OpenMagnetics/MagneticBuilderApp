<script setup>
import ScatterChartComparator from '/WebSharedComponents/Common/ScatterChartComparator.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
</script>

<script>
import { useTaskQueueStore } from '../../../stores/taskQueue'
import { useHistoryStore } from '../../../stores/history'
import { applyAdvisedCore } from '../Core/applyAdvisedCore.js'
import { formatUnit, toCamelCase } from '/WebSharedComponents/assets/js/utils.js'

/**
 * What else this design could be built on (ABT #1121).
 *
 * The candidates come from the core adviser — the same call the Advise button
 * makes, asked for several results instead of one — and are drawn against the
 * design in the shared scatter comparator. Clicking one adopts it through
 * applyAdvisedCore, so a core picked here lands exactly as an advised one does.
 *
 * A host with the cross-referencer engine (the site ships it, the embedded
 * builder does not) can pass its own candidates through the `candidates` prop
 * instead, and the panel draws those. That is why the rows are a prop and not
 * something this component insists on fetching.
 *
 * The axes are properties of the candidate's own core, resolved by the engine
 * when the candidate was built, so nothing here recomputes magnetics.
 */

const AXES = {
    volume: { label: 'Core volume', unit: 'm³', of: (core) => core?.processedDescription?.effectiveParameters?.effectiveVolume },
    effectiveArea: { label: 'Effective area', unit: 'm²', of: (core) => core?.processedDescription?.effectiveParameters?.effectiveArea },
    effectiveLength: { label: 'Effective length', unit: 'm', of: (core) => core?.processedDescription?.effectiveParameters?.effectiveLength },
    windowArea: { label: 'Window area', unit: 'm²', of: (core) => core?.processedDescription?.windingWindows?.[0]?.area },
    width: { label: 'Width', unit: 'm', of: (core) => core?.processedDescription?.width },
    height: { label: 'Height', unit: 'm', of: (core) => core?.processedDescription?.height },
};

const HOW_MANY = 12;

export default {
    emits: ['coreAdopted', 'error'],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
            required: true,
        },
        /**
         * Candidates to draw, each `{mas, scoringPerFilter, weightedTotalScoring}`
         * as the core adviser returns them. Null asks the panel to fetch its own
         * from the adviser.
         */
        candidates: {
            type: Array,
            default: null,
        },
        /** Fetch on mount rather than waiting for the user to press Find. */
        autoLoad: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: 'Alternative cores',
        },
    },
    data() {
        return {
            taskQueueStore: useTaskQueueStore(),
            historyStore: useHistoryStore(),
            availableAxes: Object.fromEntries(Object.entries(AXES).map(([key, axis]) => [key, axis.label])),
            axes: { x: 'volume', y: 'effectiveArea' },
            ownCandidates: null,
            loading: false,
            errorMessage: '',
        }
    },
    computed: {
        /** The candidates on screen: the host's if given, else the ones we fetched. */
        shownCandidates() {
            return this.candidates ?? this.ownCandidates;
        },
        currentCore() {
            return this.masStore.mas?.magnetic?.core;
        },
        /** The design itself, drawn as the reference point. */
        referencePoint() {
            const core = this.currentCore;
            if (core?.processedDescription == null) return null;
            return {
                name: this.coreName(core),
                x: this.axisValue(core, this.axes.x),
                y: this.axisValue(core, this.axes.y),
            };
        },
        points() {
            if (this.shownCandidates == null) return null;
            const points = [];
            for (const candidate of this.shownCandidates) {
                const core = candidate?.mas?.magnetic?.core;
                const x = this.axisValue(core, this.axes.x);
                const y = this.axisValue(core, this.axes.y);
                if (x == null || y == null) continue;   // a candidate the engine did not process
                points.push({ name: this.coreName(core), x, y, candidate });
            }
            return points;
        },
        /**
         * ScatterChartComparator reads each row as `row[toCamelCase(xLabel)]`, so
         * the keys come from the axis labels, and the reference is one such row.
         */
        xKey() {
            return toCamelCase(this.xLabel);
        },
        yKey() {
            return toCamelCase(this.yLabel);
        },
        chartData() {
            return (this.points ?? []).map((point) => ({
                [this.xKey]: point.x,
                [this.yKey]: point.y,
                name: point.name,
            }));
        },
        chartReference() {
            const reference = this.referencePoint;
            if (reference == null) return null;
            return {
                [this.xKey]: reference.x,
                [this.yKey]: reference.y,
                name: reference.name,
            };
        },
        /** Comparator limits are computed once at mount; a new key remounts it. */
        chartKey() {
            return `${this.axes.x}-${this.axes.y}-${(this.points ?? []).length}`;
        },
        xLabel() {
            return AXES[this.axes.x].label;
        },
        yLabel() {
            return AXES[this.axes.y].label;
        },
    },
    mounted() {
        if (this.autoLoad && this.candidates == null) {
            this.findAlternatives();
        }
    },
    methods: {
        coreName(core) {
            const shape = core?.functionalDescription?.shape;
            const shapeName = typeof shape === 'string' ? shape : shape?.name;
            const material = core?.functionalDescription?.material;
            const materialName = typeof material === 'string' ? material : material?.name;
            return `${shapeName ?? '—'} · ${materialName ?? '—'}`;
        },
        axisValue(core, key) {
            const value = AXES[key].of(core);
            return value == null || Number.isNaN(value) ? null : value;
        },
        axisFormatter(value) {
            const shown = formatUnit(value, AXES[this.axes.x].unit);
            return `${shown.label} ${shown.unit}`;
        },
        /**
         * The comparator asks for the axis captions and calls this without a
         * default, so it must always be passed; ours names the axis and its unit.
         */
        labelFormatter(label) {
            const axis = Object.values(AXES).find((entry) => entry.label === label);
            return axis == null ? label : `${label} (${axis.unit})`;
        },
        /** The adviser settings the Core panel uses, so both ask the same question. */
        adviserSettings() {
            return {
                ...this.$settingsStore.adviserSettings,
                allowToroidalCores: this.$settingsStore.magneticBuilderSettings.allowToroidalCores,
                allowDistributedGaps: this.$settingsStore.magneticBuilderSettings.allowDistributedGaps,
                allowStacks: this.$settingsStore.magneticBuilderSettings.allowStacks,
                useOnlyCoresInStock: this.$settingsStore.magneticBuilderSettings.useOnlyCoresInStock,
            };
        },
        async findAlternatives() {
            if (this.loading) return;
            if ((this.masStore.mas?.inputs?.operatingPoints?.length ?? 0) === 0) {
                this.errorMessage = 'Set an operating point first: the adviser ranks cores against it.';
                return;
            }
            this.loading = true;
            this.errorMessage = '';
            try {
                this.ownCandidates = await this.taskQueueStore.adviseCoreCandidates(
                    this.masStore.mas.inputs,
                    this.masStore.coreAdviserWeights,
                    this.adviserSettings(),
                    HOW_MANY,
                );
            }
            catch (error) {
                this.errorMessage = error.message;
                this.$emit('error', error);
            }
            finally {
                this.loading = false;
            }
        },
        async pointClicked(event) {
            // Series 1 is the reference — the design itself, nothing to adopt.
            if (event?.componentIndex === 1) return;
            const point = (this.points ?? [])[event?.dataIndex];
            if (point == null) return;
            this.errorMessage = '';
            try {
                await applyAdvisedCore({
                    masStore: this.masStore,
                    taskQueueStore: this.taskQueueStore,
                    historyStore: this.historyStore,
                    magnetic: point.candidate.mas.magnetic,
                });
                this.$emit('coreAdopted', point.candidate);
            }
            catch (error) {
                this.errorMessage = error.message;
                this.$emit('error', error);
            }
        },
    },
}
</script>

<template>
    <div class="alternatives-panel" :data-cy="dataTestLabel + '-Alternatives'">
        <div class="alternatives-bar">
            <ElementFromList
                class="alternatives-axis"
                :dataTestLabel="dataTestLabel + '-Alternatives-XAxis'"
                :name="'x'"
                :replaceTitle="'x'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="axes"
                :options="availableAxes"
                :labelWidthProportionClass="'col-2'"
                :selectStyleClass="'col-10'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <ElementFromList
                class="alternatives-axis"
                :dataTestLabel="dataTestLabel + '-Alternatives-YAxis'"
                :name="'y'"
                :replaceTitle="'y'"
                :titleSameRow="true"
                :justifyContent="true"
                v-model="axes"
                :options="availableAxes"
                :labelWidthProportionClass="'col-2'"
                :selectStyleClass="'col-10'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <button
                v-if="candidates == null"
                type="button"
                :data-cy="dataTestLabel + '-Alternatives-find-button'"
                class="alternatives-btn"
                :disabled="loading"
                @click="findAlternatives"
            >
                <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-sparkles'"></i>
                <span>{{ shownCandidates == null ? 'Find' : 'Refresh' }}</span>
            </button>
        </div>

        <p
            v-if="errorMessage"
            :data-cy="dataTestLabel + '-Alternatives-error'"
            class="alternatives-message alternatives-error"
        >{{ errorMessage }}</p>

        <p
            v-else-if="shownCandidates == null && !loading"
            :data-cy="dataTestLabel + '-Alternatives-empty'"
            class="alternatives-message"
        >Ask the adviser for the cores that also fit these requirements, and compare them with the one you have.</p>

        <p v-else-if="loading" class="alternatives-message">
            <i class="pi pi-spin pi-spinner mr-2"></i>Ranking cores against your requirements…
        </p>

        <p
            v-else-if="points != null && points.length === 0"
            :data-cy="dataTestLabel + '-Alternatives-none'"
            class="alternatives-message"
        >The adviser returned no core it could process for this comparison.</p>

        <p
            v-else-if="chartReference == null"
            :data-cy="dataTestLabel + '-Alternatives-noreference'"
            class="alternatives-message"
        >The current core has to be processed before it can be compared — set a shape and a material first.</p>

        <ScatterChartComparator
            v-else
            :key="chartKey"
            :dataTestLabel="dataTestLabel + '-Alternatives'"
            :data="chartData"
            :reference="chartReference"
            :xLabel="xLabel"
            :yLabel="yLabel"
            :axisFormatter="axisFormatter"
            :labelFormatter="labelFormatter"
            @click="pointClicked"
        />
    </div>
</template>

<style scoped>
.alternatives-panel {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-height: 0;
    height: 100%;
}

.alternatives-bar {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.alternatives-axis {
    flex: 1 1 9rem;
    min-width: 0;
}

.alternatives-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    color: var(--p-primary);
    border: 1px solid rgb(var(--p-primary-rgb) / 0.45);
}

.alternatives-btn:not(:disabled):hover {
    background: rgb(var(--p-primary-rgb) / 0.12);
}

.alternatives-btn:disabled {
    opacity: 0.6;
    cursor: default;
}

.alternatives-message {
    color: var(--p-gray-400);
    font-size: 0.8rem;
    margin: 0;
    padding: 1rem 0.25rem;
    text-align: center;
}

.alternatives-error {
    color: var(--p-danger);
}
</style>
