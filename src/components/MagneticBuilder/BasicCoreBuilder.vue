<script setup>
import Core3DVisualizer from '/WebSharedComponents/Common/Core3DVisualizer.vue'
import BasicCoreSelector from './BasicCoreSelector.vue'
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
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        simulationEnabled: {
            type: Boolean,
            default: true,
        },
        submenuEnabled: {
            type: Boolean,
            default: true,
        },
        adviseEnabled: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
        }
    },
    computed: {
    },
    watch: {
    },
    mounted () {
    },
    methods: {
    }
}
</script>

<template>
    <div class="container">
        <div v-if="useVisualizers" class="row" style="height: 30vh">
            <Core3DVisualizer 
                :dataTestLabel="`${dataTestLabel}-Core3DVisualizer`"
                :core="masStore.mas.magnetic.core"
                :fullCoreModel="true"
                :loadingGif="$settingsStore.loadingGif"
                :backgroundColor="$styleStore.magneticBuilder.main.background"
            />
        </div>
        <h4 v-else class="mb-5" > {{"Core Description"}} </h4>
        <div class="row">
            <BasicCoreSelector 
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :simulationEnabled="simulationEnabled"
                :submenuEnabled="submenuEnabled"
                :adviseEnabled="adviseEnabled"
            />
        </div>
    </div>
</template>
