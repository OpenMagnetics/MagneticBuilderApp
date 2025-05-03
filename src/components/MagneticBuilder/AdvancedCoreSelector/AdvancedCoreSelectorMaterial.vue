<script setup>
import InitialPermeabilityVersusTemperature from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusTemperature.vue'
import InitialPermeabilityVersusFrequency from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusFrequency.vue'
import InitialPermeabilityVersusMagneticFieldDcBias from './AdvancedCoreSelectorMaterial/InitialPermeabilityVersusMagneticFieldDcBias.vue'
import ComplexPermeabilityVersusFrequency from './AdvancedCoreSelectorMaterial/ComplexPermeabilityVersusFrequency.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import Text from '/WebSharedComponents/DataInput/Text.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'

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
    },
    data() {
        return {
        }
    },
    watch: { 
    },
    created () {
        console.warn(deepCopy(this.core.functionalDescription.material))
        if (typeof(this.core.functionalDescription.material) == "string") {
            this.loadMaterialData();
        }
    },
    mounted () {
    },
    methods: {
        loadMaterialData() {
            this.$mkf.ready.then(_ => {
                const materialJson = this.$mkf.get_material_data(this.core.functionalDescription.material);
                if (materialJson.startsWith("Exception")) {
                    console.error(materialJson);
                    return;
                }
                else {
                    this.core.functionalDescription.material = JSON.parse(materialJson);
                }
                console.log("this.core.functionalDescription.material.permeability.initial.length")
                console.log(this.core.functionalDescription.material.permeability.initial.length)
            })
        }
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-12 col-md-4">
                <Text
                    v-if="core.functionalDescription.material.name != null"
                    class="col-10 offset-1 mb-1 text-start"
                    :name="'name'"
                    v-model="core.functionalDescription.material"
                    :defaultValue="'Material name'"
                    :dataTestLabel="dataTestLabel + '-MaterialName'"
                    :canBeEmpty="false"
                    :labelWidthProportionClass="'col-sm-12 col-md-5'"
                    :valueWidthProportionClass="'col-sm-12 col-md-7'"
                    :valueFontSize="$styleStore.operatingPoints.inputFontSize"
                    :titleFontSize="$styleStore.operatingPoints.inputTitleFontSize"
                    :labelBgColor="$styleStore.operatingPoints.titleLabelBgColor"
                    :valueBgColor="$styleStore.operatingPoints.inputValueBgColor"
                    :textColor="$styleStore.operatingPoints.titleTextColor"
                />

<!--         <Dimension 
            v-if="!readOnly && gap != null && gap.coordinates != null"
            :name="'1'"
            :replaceTitle="'Height'"
            :unit="'m'"
            class="col-12 mb-1 text-start"
            :dataTestLabel="dataTestLabel + '-Length'"
            :justifyContent="true"
            :allowNegative="true"
            :allowZero="true"
            :min="0.000001"
            :max="1"
            :modelValue="gap.coordinates"
            :forceUpdate="forceUpdate"
            :labelWidthProportionClass="'col-sm-12 col-md-4'"
            :valueWidthProportionClass="'col-sm-12 col-md-8'"
            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
            :labelBgColor="{'background': 'transparent'}"
            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
            :textColor="$styleStore.magneticBuilder.inputTextColor"
            @update="$emit('gapHeightChanged', $event)"
        /> -->
            </div>
            <div class="col-sm-12 col-md-4">
                <InitialPermeabilityVersusTemperature
                    v-if="core.functionalDescription.material.permeability != null"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusTemperature'"
                    :data="core.functionalDescription.material.permeability.initial"
                />
            </div>
            <div class="col-sm-12 col-md-4">
                <InitialPermeabilityVersusFrequency
                    v-if="core.functionalDescription.material.permeability != null"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusFrequency'"
                    :data="core.functionalDescription.material.permeability.initial"
                />
            </div>
            <div class="col-sm-12 col-md-4">
                <InitialPermeabilityVersusMagneticFieldDcBias
                    v-if="core.functionalDescription.material.permeability != null"
                    :dataTestLabel="dataTestLabel + '-InitialPermeabilityVersusMagneticFieldDcBias'"
                    :data="core.functionalDescription.material.permeability.initial"
                />
            </div>
            <div class="col-sm-12 col-md-4">
                <ComplexPermeabilityVersusFrequency
                    v-if="core.functionalDescription.material.permeability != null && core.functionalDescription.material.permeability.complex != null"
                    :dataTestLabel="dataTestLabel + '-ComplexPermeabilityVersusFrequency'"
                    :data="core.functionalDescription.material.permeability.complex"
                />
            </div>
        </div>
    </div>
</template>
