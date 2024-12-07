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
        <div class="row" style="height: 30vh">
            <Core3DVisualizer 
                :dataTestLabel="`${dataTestLabel}-Core3DVisualizer`"
                :core="masStore.mas.magnetic.core"
                :fullCoreModel="true"
                :loadingGif="'/images/loading.gif'"
            />
        </div>
        <div class="row">
            <BasicCoreSelector 
                :masStore="masStore"
            />
        </div>
    </div>
</template>
