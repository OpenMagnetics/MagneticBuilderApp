<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import PropertyTool from '/WebSharedComponents/Common/PropertyTool.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import Text from '/WebSharedComponents/DataInput/Text.vue'

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
    },
    data() {
        const initialPermeabilityVersusTemperatureIndexes = [];
        const initialPermeabilityVersusFrequencyIndexes = [];
        const initialPermeabilityVersusMagneticFieldDcBiasIndexes = [];
        const errorMessages = {};
        const loading = false;
        const dataUptoDate = true;
        const configurations = {
            initialPermeability: {
                    xAxisLabel: 'temperature',
                    yAxisLabel: 'value',
                    xAxisReplaceLabel: 'Temp.',
                    yAxisReplaceLabel: 'Perm.',
                    xAxisMode: 'linear',
                    yAxisMode: 'linear',
                    xAxisUnit: '°C',
                    yAxisUnit: null,
                    xAxisAllowNegative: true,
                    yAxisAllowNegative: false,
                    xAxisMin: -100,
                    yAxisMin: 1,
                    xAxisMax: 300,
                    yAxisMax: 1e12,
            },
            complexPermeability: {
                    xAxisLabel: 'frequency',
                    yAxisLabel: 'value',
                    xAxisReplaceLabel: 'Temp.',
                    yAxisReplaceLabel: 'Perm.',
                    xAxisMode: 'linear',
                    yAxisMode: 'linear',
                    xAxisUnit: 'Hz',
                    yAxisUnit: null,
                    xAxisAllowNegative: false,
                    yAxisAllowNegative: false,
                    xAxisMin: 1,
                    yAxisMin: 1,
                    xAxisMax: 1e9,
                    yAxisMax: 1e12,
            },
        }

        this.assignLocalData(this.core.functionalDescription.material);

        return {
            initialPermeabilityVersusTemperatureIndexes,
            initialPermeabilityVersusFrequencyIndexes,
            initialPermeabilityVersusMagneticFieldDcBiasIndexes,
            dataUptoDate,
            errorMessages,
            loading,
            configurations,
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
    },
    methods: {
        assignLocalData(material) {
            this.$mkf.ready.then(_ => {
                if (typeof(material) == "string") {
                    const materialJson = this.$mkf.get_material_data(material);
                    if (materialJson.startsWith("Exception")) {
                        console.error(materialJson);
                        return;
                    }
                    else {
                        this.core.functionalDescription.material = JSON.parse(materialJson);
                    }
                }
                if (typeof(this.core.functionalDescription.material.permeability.initial) == "object") {
                    const stringVector = [];
                    this.core.functionalDescription.material.permeability.initial.forEach((elem) => {
                        stringVector.push(JSON.stringify(elem));
                    })
                    var handle = this.$mkf.get_only_temperature_dependent_indexes(JSON.stringify(stringVector));

                    this.initialPermeabilityVersusTemperatureIndexes = [];
                    for (var i = handle.size() - 1; i >= 0; i--) {
                        const aux = handle.get(i);
                        this.initialPermeabilityVersusTemperatureIndexes.push(aux);
                    }
                }

                if (typeof(this.core.functionalDescription.material.permeability.initial) == "object") {
                    const stringVector = [];
                    this.core.functionalDescription.material.permeability.initial.forEach((elem) => {
                        stringVector.push(JSON.stringify(elem));
                    })
                    var handle = this.$mkf.get_only_frequency_dependent_indexes(JSON.stringify(stringVector));

                    this.initialPermeabilityVersusFrequencyIndexes = [];
                    for (var i = handle.size() - 1; i >= 0; i--) {
                        const aux = handle.get(i);
                        this.initialPermeabilityVersusFrequencyIndexes.push(aux);
                    }
                }

                if (typeof(this.core.functionalDescription.material.permeability.initial) == "object") {
                    const stringVector = [];
                    this.core.functionalDescription.material.permeability.initial.forEach((elem) => {
                        stringVector.push(JSON.stringify(elem));
                    })
                    var handle = this.$mkf.get_only_magnetic_field_dc_bias_dependent_indexes(JSON.stringify(stringVector));

                    this.initialPermeabilityVersusMagneticFieldDcBiasIndexes = [];
                    for (var i = handle.size() - 1; i >= 0; i--) {
                        const aux = handle.get(i);
                        this.initialPermeabilityVersusMagneticFieldDcBiasIndexes.push(aux);
                    }
                }

            })
        },
        onRemovePoint() {
            this.assignLocalData(this.core.functionalDescription.material);
        },
        onAddPoint() {
            this.assignLocalData(this.core.functionalDescription.material);
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-12 col-md-4">
                <PropertyTool
                    v-if="core.functionalDescription.material.permeability != null"
                    :dataTestLabel="dataTestLabel + '-PropertyTool'"
                    :title="'Initial Permea. vs Temperature'"
                    :indexesToUse="initialPermeabilityVersusTemperatureIndexes"
                    :properties="[core.functionalDescription.material.permeability.initial]"
                    :propertiesConfiguration="configurations.initialPermeability"
                    :chartStyle="'height: 30vh'"
                    :smoothLine="true"
                    @onRemovePoint="onRemovePoint"
                    @onAddPoint="onAddPoint"
                />
            </div>
        </div>
    </div>
</template>
