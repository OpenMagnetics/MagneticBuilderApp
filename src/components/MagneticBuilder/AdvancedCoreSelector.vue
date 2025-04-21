<script setup>
import AdvancedCoreSelectorShape from './AdvancedCoreSelector/AdvancedCoreSelectorShape.vue'
import AdvancedCoreSelectorGapping from './AdvancedCoreSelector/AdvancedCoreSelectorGapping.vue'
import { useHistoryStore } from '../../stores/history'

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

        return {
            historyStore,
            localData,
            errorMessage,
            loading,
            forceUpdate,
        }
    },
    computed: {
    },
    watch: { 
    },
    created () {
    },
    mounted () {
    },
    methods: {
        customizedCore(customCore) {
            this.masStore.mas.magnetic.core = customCore;
        }
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
                :core="masStore.mas.magnetic.core"
                :enableSimulation="true"
                @customizedCore="customizedCore"
            />
            <AdvancedCoreSelectorGapping
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Gapping"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorGapping'"
                :core="masStore.mas.magnetic.core"
                :enableSimulation="true"
                @customizedCore="customizedCore"
            />
        </div>
    </div>
</template>
