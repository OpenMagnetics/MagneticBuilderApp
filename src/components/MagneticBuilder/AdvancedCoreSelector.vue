<script setup>
import AdvancedCoreSelectorShape from './AdvancedCoreSelector/AdvancedCoreSelectorShape.vue'
import AdvancedCoreSelectorGapping from './AdvancedCoreSelector/AdvancedCoreSelectorGapping.vue'
import AdvancedCoreSelectorMaterial from './AdvancedCoreSelector/AdvancedCoreSelectorMaterial.vue'
import { useHistoryStore } from '../../stores/history'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'

</script>

<script>

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
        enableSimulation: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        const localData = {};
        const errorMessage = "";
        const loading = false;
        const forceUpdate = 0;
        const localCore = deepCopy(this.masStore.mas.magnetic.core);

        return {
            historyStore,
            localData,
            errorMessage,
            loading,
            forceUpdate,
            localCore,
        }
    },
    computed: {
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.$stateStore.$onAction((action) => {
            if (action.name == "applyChanges") {
                this.applyChanges();
            }
            if (action.name == "cancelChanges") {
                this.cancelChanges();
            }
        })
    },
    methods: {
        customizedCore(customCore) {
            this.masStore.mas.magnetic.core = customCore;
        },
        applyChanges() {
            this.localCore.functionalDescription.shape.type = "custom";
            this.localCore.name = "Custom";

            this.masStore.mas.magnetic.core = deepCopy(this.localCore);
            this.$stateStore.magneticBuilder.mode.core = this.$stateStore.MagneticBuilderModes.Basic;
        },
        cancelChanges() {
            this.$stateStore.magneticBuilder.mode.core = this.$stateStore.MagneticBuilderModes.Basic;
        },
        errorInDimensions() {
            this.errorMessage = "There is an error in the dimensions, please review them";
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <img :data-cy="dataTestLabel + '-BasicCoreSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <AdvancedCoreSelectorShape
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Shape"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorShape'"
                :core="localCore"
                :enableSimulation="true"
                @errorInDimensions="errorInDimensions"
            />
            <AdvancedCoreSelectorGapping
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Gapping"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorGapping'"
                :core="localCore"
                :inputs="masStore.mas.inputs"
                :enableSimulation="true"
            />
            <AdvancedCoreSelectorMaterial
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Material"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorMaterial'"
                :core="localCore"
                :enableSimulation="true"
            />
        </div>
        <label class="text-danger col-12 pt-1" style="font-size: 1em">{{errorMessage}}</label>
    </div>
</template>
