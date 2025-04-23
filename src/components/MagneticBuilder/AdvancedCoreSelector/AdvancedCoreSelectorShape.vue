<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import { useHistoryStore } from '../../../stores/history'
import { deepCopy, isMobile } from '/WebSharedComponents/assets/js/utils.js'
import Core3DVisualizer from '/WebSharedComponents/Common/Core3DVisualizer.vue'
import Core2DVisualizer from '/WebSharedComponents/Common/Core2DVisualizer.vue'
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
        allowFamilyChange: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const localData = {};
        const localCoreToDraw = deepCopy(this.core);
        const errorMessages = {};
        const loading = false;
        const imageUpToDate = true;
        const dataUptoDate = true;
        const availableFamilies = {};
        const availableFamilySubtypes = [];
        const dimensionsExceptionsPerFamily = {
            "ec": ["r"],
            "pq": ["J", "L"],
            "p": ["M", "N", "r1"],
            "planar el": ["R"],
            "pm": ["e"],
            "pq": ["J", "L"],
            "rm": ["R"],
            "u": ["R1", "R2"],
        }

        this.assignLocalData(this.core.functionalDescription.shape);
        this.getDimensionKeys();

        this.core.functionalDescription.shape.name = this.core.functionalDescription.shape.name.startsWith("Custom")? this.core.functionalDescription.shape.name : "Custom " + this.core.functionalDescription.shape.name;

        return {
            localData,
            localCoreToDraw,
            imageUpToDate,
            dataUptoDate,
            errorMessages,
            loading,
            availableFamilies,
            availableFamilySubtypes,
            dimensionsExceptionsPerFamily,
        }
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.getFamilies();
        this.getFamilySubtypes();
        this.$stateStore.$onAction((action) => {
            if (action.name == "redraw") {
                this.redraw();
            }
        })
    },
    methods: {
        computeErrorMessages() {
            this.errorMessages = {}
            Object.keys(this.localData.dimensions).forEach((key) => {
                if (this.localData.dimensions[key] == null) {
                    if (key == 'G' || key == 'H') {
                        this.localData.dimensions[key] = 0;
                    }
                    else {
                        this.errorMessages[key] = key + ' cannot be empty';
                    }
                }
                else if (this.localData.dimensions[key] == 0) {
                    if ((key != 'H' || this.localData.family == 'ur') &&
                        (key != 'G') &&
                        (key == 'C' && this.localData.family != 'p')) {
                        this.errorMessages[key] = key + ' must be greater than 0';
                    }
                }
                else {
                    if (key == 'B'){
                        if (this.localData.dimensions['D'] >= this.localData.dimensions['B']){
                            this.errorMessages[key] = 'B must be greater than D';
                        }
                    }
                    else if (key == 'D'){
                        if (this.localData.dimensions['D'] >= this.localData.dimensions['B']){
                            this.errorMessages[key] = 'D must be smaller than B';
                        }
                    }

                    if (key == 'A'){
                        if (this.localData.dimensions['E'] >= this.localData.dimensions['A']){
                            this.errorMessages[key] = 'A must be greater than E';
                        }
                    }
                    else if (key == 'E'){
                        if (this.localData.dimensions['E'] >= this.localData.dimensions['A']){
                            this.errorMessages[key] = 'E must be smaller than A';
                        }
                    }

                    if (!(this.localData.family == "ur")) {
                        if (key == 'E'){
                            if (this.localData.dimensions['F'] >= this.localData.dimensions['E']){
                                this.errorMessages[key] = 'E must be greater than F';
                            }
                        }
                        else if (key == 'F'){
                            if (this.localData.dimensions['F'] >= this.localData.dimensions['E']){
                                this.errorMessages[key] = 'F must be smaller than E';
                            }
                        }
                    }

                    if (key == 'E'){
                        if (this.localData.dimensions['G'] > this.localData.dimensions['E']){
                            this.errorMessages[key] = 'E must be greater than G';
                        }
                    }
                    else if (key == 'G'){
                        if (this.localData.dimensions['G'] > this.localData.dimensions['E']){
                            this.errorMessages[key] = 'G must be smaller than E';
                        }
                    }

                    if (this.localData.family == "er") {
                        if (this.localData.dimensions['G'] > 0) {
                            if (key == 'F'){
                                if (this.localData.dimensions['G'] < this.localData.dimensions['F']){
                                    this.errorMessages[key] = 'F must be smaller than G';
                                }
                            }
                            else if (key == 'G'){
                                if (this.localData.dimensions['G'] < this.localData.dimensions['F']){
                                    this.errorMessages[key] = 'G must be greater than F';
                                }
                            }
                        }
                    }

                    if (!(this.localData.family == "rm" && this.localData.familySubtype == "2") && !(this.localData.family == "p" && this.localData.familySubtype != "2") && !(this.localData.family == "efd") && !(this.localData.family == "planar er") && !(this.localData.family == "ut") && this.localData.dimensions['C'] > 0) {
                        var c_f_condition = false;
                        if (this.localData.family != "e") {
                            if (this.localData.family != "er" && this.localData.family != "etd" && this.localData.family != "ec") {
                                c_f_condition = this.localData.dimensions['F'] >= this.localData.dimensions['C'];
                            }
                            else {
                                c_f_condition = this.localData.dimensions['F'] > this.localData.dimensions['C'];
                            }
                        }
                        if (key == 'C'){
                            if (c_f_condition){
                                this.errorMessages[key] = 'C must be greater than F';
                            }
                        }
                        else if (key == 'F'){
                            if (c_f_condition){
                                this.errorMessages[key] = 'F must be smaller than C';
                            }
                        }
                    }

                    if (key == 'J'){
                        if (this.localData.dimensions['E'] > this.localData.dimensions['J']){
                            this.errorMessages[key] = 'J must be greater than E';
                        }
                    }
                    else if (key == 'E'){
                        if (this.localData.dimensions['E'] > this.localData.dimensions['J']){
                            this.errorMessages[key] = 'E must be smaller than J';
                        }
                    }
                    if (this.localData.family !== "efd" && this.localData.family !== "epx") {
                        if (key == 'K'){
                            if (this.localData.dimensions['F'] / 2 > this.localData.dimensions['K']){
                                this.errorMessages[key] = 'K must be greater than F/2';
                            }
                            else if (this.localData.dimensions['F'] / 2 + this.localData.dimensions['K'] > this.localData.dimensions['C'] ){
                                this.errorMessages[key] = 'C must be greater than F/2 + K';
                            }
                        }
                    }
                }
            })
        },
        assignLocalData(shape) {
            this.$mkf.ready.then(_ => {
                const localData = {
                    family: shape.family,
                    familySubtype: shape.familySubtype,
                    dimensions: {},
                };
                Object.keys(shape.dimensions).forEach((key) => {
                    localData.dimensions[key] = this.$mkf.resolve_dimension_with_tolerance(JSON.stringify(shape.dimensions[key]));
                })

                this.localData = localData;
            })
        },
        getFamilies() {
            this.$mkf.ready.then(_ => {
                const coreShapeFamiliesHandle = this.$mkf.get_available_core_shape_families();
                this.availableFamilies = {};
                for (var i = 0; i < coreShapeFamiliesHandle.size(); i++) {
                    const shapeFamily = coreShapeFamiliesHandle.get(i);
                    if (!shapeFamily.includes("pqi") && !shapeFamily.includes("ut") &&
                        !shapeFamily.includes("ui") && !shapeFamily.includes("h") && !shapeFamily.includes("drum")) {
                        this.availableFamilies[shapeFamily] = shapeFamily.toUpperCase();
                    }
                }
            })
        },
        getFamilySubtypes() {
            this.$mkf.ready.then(_ => {
                const coreShapeFamiliesHandle = this.$mkf.get_shape_family_subtypes(this.localData.family);
                this.availableFamilySubtypes = [];
                for (var i = 0; i < coreShapeFamiliesHandle.size(); i++) {
                    const shapeFamily = coreShapeFamiliesHandle.get(i);
                    if (!shapeFamily.includes("pqi") && !shapeFamily.includes("ut") &&
                        !shapeFamily.includes("ui") && !shapeFamily.includes("h") && !shapeFamily.includes("drum")) {
                        this.availableFamilySubtypes.push(shapeFamily);
                    }
                }

                if (this.availableFamilySubtypes.length == 0) {
                    this.localData.familySubtype = null;
                }
                else if (!(this.localData.familySubtype in this.availableFamilySubtypes)) {
                    this.localData.familySubtype = this.availableFamilySubtypes[0];
                }

                this.getDimensionKeys();

            })
        },
        getDimensionKeys() {

            this.$mkf.ready.then(_ => {
                var familySubtype = "";
                if ("familySubtype" in this.localData && this.localData.familySubtype != null) {
                    familySubtype = this.localData.familySubtype;
                }

                const dimensionsHandle = this.$mkf.get_shape_family_dimensions(this.localData.family, familySubtype);
                const newDimensions = {};
                for (var i = 0; i < dimensionsHandle.size(); i++) {
                    const key = dimensionsHandle.get(i);
                    if (this.localData.family in this.dimensionsExceptionsPerFamily) {
                        if (this.dimensionsExceptionsPerFamily[this.localData.family].includes(key)) {
                            continue;
                        }
                    }
                    if (key in this.localData.dimensions) {
                        newDimensions[key] = this.localData.dimensions[key];
                    }
                    else {
                        newDimensions[key] = 0;
                    }
                }
                this.localData.dimensions = deepCopy(newDimensions);
            })
        },
        familyUpdated() {
            this.imageUpToDate = false;
            this.dataUptoDate = false;
            this.core.functionalDescription.shape.family = deepCopy(this.localData.family);
            this.getFamilySubtypes();
        },
        familySubtypeUpdated() {
            this.imageUpToDate = false;
            this.dataUptoDate = false;
            this.core.functionalDescription.shape.familySubtype = deepCopy(this.localData.familySubtype);
            this.getDimensionKeys();
        },
        dimensionUpdated() {
            this.imageUpToDate = false;
            this.dataUptoDate = false;
            this.core.functionalDescription.shape.dimensions = {};
            Object.keys(this.localData.dimensions).forEach((key) => {
                this.core.functionalDescription.shape.dimensions[key] = {};
                this.core.functionalDescription.shape.dimensions[key]["nominal"] = this.localData.dimensions[key];
            })

            this.calculateCoreEffectiveParameters();
            this.computeErrorMessages();
        },
        redraw() {
            this.errorMessage = "";
            this.localCoreToDraw.functionalDescription.shape.dimensions = deepCopy(this.localData.dimensions);
            this.localCoreToDraw.functionalDescription.shape.family = deepCopy(this.localData.family);
            this.localCoreToDraw.functionalDescription.shape.familySubtype = deepCopy(this.localData.familySubtype);
            this.imageUpToDate = true;
        },
        calculateCoreEffectiveParameters() {
            if (this.core['functionalDescription']['shape'] != "") {
                this.$mkf.ready.then(_ => {
                    const coreJson = this.$mkf.calculate_core_data(JSON.stringify(this.core), false);
                    if (coreJson.startsWith("Exception")) {
                        console.error(coreJson);
                        return;
                    }
                    else {
                        this.core.processedDescription = JSON.parse(coreJson).processedDescription;
                    }
                    this.dataUptoDate = true;

                }).catch(error => {
                    console.error(error);
                });
            }
        },
    }
}
</script>

<template>
    <div class="container">
        <div
            v-if="'dimensions' in localData"
            class="row"
        >
            <div class="col-md-3 col-sm-12">
                <h3 class= "mb-3"> {{'Dimensions'}} </h3>
                <ElementFromList
                    v-if="allowFamilyChange"
                    class="col-10 offset-1 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-ShapeFamilies'"
                    :name="'family'"
                    :titleSameRow="true"
                    :justifyContent="true"
                    v-model="localData"
                    :options="availableFamilies"
                    :labelWidthProportionClass="'col-sm-12 col-md-5'"
                    :valueWidthProportionClass="'col-sm-12 col-md-7'"
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
                    @update="familyUpdated"
                />
                <Text
                    class="col-10 offset-1 mb-1 text-start"
                    :name="'name'"
                    v-model="core.functionalDescription.shape"
                    :defaultValue="'Shape name'"
                    :dataTestLabel="dataTestLabel + '-ShapeName'"
                    :canBeEmpty="false"
                    :labelWidthProportionClass="'col-sm-12 col-md-5'"
                    :valueWidthProportionClass="'col-sm-12 col-md-7'"
                    :valueFontSize="$styleStore.operatingPoints.inputFontSize"
                    :titleFontSize="$styleStore.operatingPoints.inputTitleFontSize"
                    :labelBgColor="$styleStore.operatingPoints.titleLabelBgColor"
                    :valueBgColor="$styleStore.operatingPoints.inputValueBgColor"
                    :textColor="$styleStore.operatingPoints.titleTextColor"
                />
                <ElementFromList
                    v-if="availableFamilySubtypes.length > 0"
                    class="col-10 offset-1 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-ShapeFamilySubtypes'"
                    :name="'familySubtype'"
                    :replaceTitle="'Subtype'"
                    :titleSameRow="true"
                    :justifyContent="true"
                    v-model="localData"
                    :options="availableFamilySubtypes"
                    :labelWidthProportionClass="'col-sm-12 col-md-5'"
                    :valueWidthProportionClass="'col-sm-12 col-md-7'"
                    :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                    :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                    :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                    :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                    :textColor="$styleStore.magneticBuilder.inputTextColor"
                    @update="familySubtypeUpdated"
                />
                <div
                    v-for="key in Object.keys(localData.dimensions)"
                    class="col-10 offset-1 mb-1 text-start"
                >
                    <Dimension 
                        :name="key"
                        :replaceTitle="key"
                        :unit="key =='alpha'? '°' : 'm'"
                        :dataTestLabel="dataTestLabel + '-Dimension-' + key"
                        :justifyContent="true"
                        :allowNegative="key == 'K' && localData.family == 'efd'"
                        :allowZero="true"
                        :min="key =='alpha'? 1 : 0.000001"
                        :max="key =='alpha'? 360: 1"
                        :modelValue="localData.dimensions"
                        :labelWidthProportionClass="'col-4'"
                        :valueWidthProportionClass="'col-8'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                        :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                        :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                        :textColor="$styleStore.magneticBuilder.inputTextColor"
                        @update="dimensionUpdated"
                    />
                    <label
                        v-if="key in errorMessages && errorMessages[key] != ''"
                        class="text-danger"
                        style="font-size: 1em"
                    >
                        {{errorMessages[key]}}
                    </label>
                </div>

                <div class=" mt-5 mb-3 pb-3 border-bottom border-top pt-2 text-start" :style="$styleStore.magneticBuilder.main">
                    <div
                        v-if="core.processedDescription != null"
                        class="row"
                        :style="dataUptoDate? 'opacity: 100%;' : 'opacity: 20%;'"
                    >
                        <DimensionReadOnly 
                            class="col-12 pe-4 ps-5"
                            :name="'L'"
                            :subscriptName="'eff'"
                            :unit="'m'"
                            :power="1"
                            :dataTestLabel="dataTestLabel + '-EffectiveLength'"
                            :numberDecimals="2"
                            :value="core.processedDescription.effectiveParameters.effectiveLength"
                            :disableShortenLabels="true"
                            :labelWidthProportionClass="'col-3'"
                            :valueWidthProportionClass="'col-9'"
                            :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                            :textColor="$styleStore.magneticBuilder.inputTextColor"
                        />
                        <DimensionReadOnly 
                            class="col-12 pe-4 ps-5"
                            :name="'A'"
                            :subscriptName="'eff'"
                            :unit="'m²'"
                            :power="2"
                            :dataTestLabel="dataTestLabel + '-EffectiveArea'"
                            :numberDecimals="1"
                            :value="core.processedDescription.effectiveParameters.effectiveArea"
                            :disableShortenLabels="true"
                            :labelWidthProportionClass="'col-3'"
                            :valueWidthProportionClass="'col-9'"
                            :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                            :textColor="$styleStore.magneticBuilder.inputTextColor"
                        />
                        <DimensionReadOnly 
                            class="col-12 pe-4 ps-5"
                            :name="'V'"
                            :subscriptName="'eff'"
                            :unit="'m³'"
                            :power="3"
                            :dataTestLabel="dataTestLabel + '-EffectiveVolume'"
                            :numberDecimals="1"
                            :value="core.processedDescription.effectiveParameters.effectiveVolume"
                            :disableShortenLabels="true"
                            :labelWidthProportionClass="'col-3'"
                            :valueWidthProportionClass="'col-9'"
                            :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                            :textColor="$styleStore.magneticBuilder.inputTextColor"
                        />
                        <DimensionReadOnly 
                            :class="isMobile()? '' : 'border-start'"
                            class="col-12 pe-4 ps-5"
                            :name="'A'"
                            :subscriptName="'min'"
                            :unit="'m²'"
                            :power="2"
                            :dataTestLabel="dataTestLabel + '-MinimumArea'"
                            :numberDecimals="1"
                            :value="core.processedDescription.effectiveParameters.minimumArea"
                            :disableShortenLabels="true"
                            :labelWidthProportionClass="'col-3'"
                            :valueWidthProportionClass="'col-9'"
                            :valueFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                            :textColor="$styleStore.magneticBuilder.inputTextColor"
                        />
                    </div>
                </div>

            </div>
            <div class="col-md-5 col-sm-12">
                <h3 class= "mb-3"> {{'3D model'}} </h3>
                <div
                    v-if="core.functionalDescription != null"
                    class="row"
                    style="height: 30vh"
                    :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
                >
                    <Core3DVisualizer 
                        :dataTestLabel="`${dataTestLabel}-Core3DVisualizer`"
                        :core="localCoreToDraw"
                        :fullCoreModel="true"
                        :loadingGif="$settingsStore.loadingGif"
                        :backgroundColor="$styleStore.magneticBuilder.main.background"
                        @errorInDimensions="$emit('errorInDimensions')"
                    />
                </div>
            </div>
            <div class="col-md-4 col-sm-12">
                <h3 class= "mb-3"> {{'Technical Drawing'}} </h3>
                <div
                    v-if="core.functionalDescription != null"
                    class="row"
                    :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
                >
                    <Core2DVisualizer 
                        :dataTestLabel="`${dataTestLabel}-Core2DVisualizer`"
                        :core="localCoreToDraw"
                        :loadingGif="$settingsStore.loadingGif"
                        :backgroundColor="$styleStore.magneticBuilder.main.background"
                        @errorInDimensions="$emit('errorInDimensions')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
