<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
</script>

<script>
// Read-only effective parameters of the selected core (le, Ae, Ve) as the engine computed them, and for a tape-wound
// core the fill factor k_f already applied to Ae and Ve, with its source. Shown without running a simulation, so a
// host that only defines the magnetic (CoreDataX) lets its user check the Ae their flux density is based on.
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
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        return {
            taskQueueStore,
            fillFactor: null,
            fillFactorError: null,
            fillFactorRequest: 0,
        }
    },
    computed: {
        core() {
            return this.masStore.mas.magnetic.core;
        },
        effectiveParameters() {
            return this.core?.processedDescription?.effectiveParameters ?? null;
        },
        // Changes when the material or the shape changes: the only inputs of the fill factor.
        fillFactorKey() {
            const description = this.core?.functionalDescription;
            if (description == null || description.material == null || description.shape == null) {
                return null;
            }
            return JSON.stringify([description.material, description.shape]);
        },
    },
    watch: {
        fillFactorKey: {
            handler() {
                this.updateFillFactor();
            },
            immediate: true,
        },
    },
    methods: {
        async updateFillFactor() {
            const request = ++this.fillFactorRequest;
            this.fillFactor = null;
            this.fillFactorError = null;
            if (this.fillFactorKey == null) {
                return;
            }
            try {
                const fillFactor = await this.taskQueueStore.getTapeWoundFillFactor(this.core);
                if (request === this.fillFactorRequest) {
                    this.fillFactor = fillFactor;
                }
            }
            catch (error) {
                if (request === this.fillFactorRequest) {
                    this.fillFactorError = String(error.message ?? error).replace(/^Exception:\s*/, '');
                    console.error(error);
                }
            }
        },
    },
}
</script>

<template>
    <div class="core-effective-parameters" :data-cy="dataTestLabel + '-container'" v-if="effectiveParameters != null">
        <div class="core-effective-parameters-title">Effective parameters</div>
        <div class="core-effective-parameters-grid">
            <DimensionReadOnly
                v-tooltip="tooltipsMagneticBuilder.effectiveLength"
                class="text-left"
                :name="'l'"
                :subscriptName="'e'"
                :unit="'m'"
                :power="1"
                :dataTestLabel="dataTestLabel + '-EffectiveLength'"
                :numberDecimals="2"
                :value="effectiveParameters.effectiveLength"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.infoValueFontSize"
                :labelFontSize="$styleStore.magneticBuilder.infoLabelFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly
                v-tooltip="tooltipsMagneticBuilder.effectiveArea"
                class="text-left"
                :name="'A'"
                :subscriptName="'e'"
                :unit="'m²'"
                :power="2"
                :dataTestLabel="dataTestLabel + '-EffectiveArea'"
                :numberDecimals="2"
                :value="effectiveParameters.effectiveArea"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.infoValueFontSize"
                :labelFontSize="$styleStore.magneticBuilder.infoLabelFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
            <DimensionReadOnly
                v-tooltip="tooltipsMagneticBuilder.effectiveVolume"
                class="text-left"
                :name="'V'"
                :subscriptName="'e'"
                :unit="'m³'"
                :power="3"
                :dataTestLabel="dataTestLabel + '-EffectiveVolume'"
                :numberDecimals="2"
                :value="effectiveParameters.effectiveVolume"
                :disableShortenLabels="true"
                :labelWidthProportionClass="'col-4'"
                :valueWidthProportionClass="'col-8'"
                :valueFontSize="$styleStore.magneticBuilder.infoValueFontSize"
                :labelFontSize="$styleStore.magneticBuilder.infoLabelFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
            />
        </div>
        <div v-if="fillFactor != null" class="core-effective-parameters-fill" :data-cy="dataTestLabel + '-FillFactor'">
            <span class="core-effective-parameters-fill-value">k<sub>f</sub> = {{ fillFactor.fillFactor.toFixed(3) }}</span>
            <span class="core-effective-parameters-fill-note">tape-wound: A<sub>e</sub> and V<sub>e</sub> include it</span>
            <span class="core-effective-parameters-fill-source" :data-cy="dataTestLabel + '-FillFactorSource'">{{ fillFactor.source }}</span>
        </div>
        <div v-if="fillFactorError != null" class="core-effective-parameters-error text-danger" :data-cy="dataTestLabel + '-FillFactorError'">
            Fill factor: {{ fillFactorError }}
        </div>
    </div>
</template>

<style scoped>
.core-effective-parameters {
    margin: 0.4rem 0;
    padding: 0.3rem 0.4rem;
    border-top: 1px solid rgba(128, 128, 128, 0.25);
}
.core-effective-parameters-title {
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.75;
    margin-bottom: 0.2rem;
}
.core-effective-parameters-fill {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.15rem 0.6rem;
    margin-top: 0.3rem;
    font-size: 0.8rem;
}
.core-effective-parameters-fill-value {
    font-weight: 600;
}
.core-effective-parameters-fill-note {
    opacity: 0.75;
}
.core-effective-parameters-fill-source {
    flex-basis: 100%;
    font-size: 0.72rem;
    opacity: 0.65;
}
.core-effective-parameters-error {
    font-size: 0.75rem;
    margin-top: 0.3rem;
}
</style>
