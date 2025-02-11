<script setup>
</script>

<script>
export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        enableAdvise: {
            type: Boolean,
            default: true,
        },
        enableCustomize: {
            type: Boolean,
            default: true,
        },
        enableLoad: {
            type: Boolean,
            default: false,
        },
        allowAdvise: {
            type: Boolean,
            default: true,
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
        <div class="row">

            <button
                :style="$styleStore.magneticBuilder.adviseButton"
                v-if="allowAdvise"
                :disabled="!enableAdvise"
                :data-cy="dataTestLabel + '-Core-Advise-button'"
                :class="allowAdvise? 'col-4' : 'col-0' "
                class="btn mx-auto d-block mt-1 col-4"
                @click="$emit('adviseCore')"
            >
                {{'Advise core'}}
            </button>
            <button
                :style="$styleStore.magneticBuilder.customizeButton"
                :disabled="!enableCustomize"
                :data-cy="dataTestLabel + '-Core-Customize-button'"
                :class="allowAdvise? 'col-4' : 'col-6' "
                class="btn mx-auto d-block mt-1 col-4"
                @click="$emit('customizeCore')"
            >
                {{'Customize'}}
            </button>
            <button
                :style="$styleStore.magneticBuilder.loadFromLibraryButton"
                :disabled="!enableLoad"
                :data-cy="dataTestLabel + '-Core-Load-button'"
                :class="allowAdvise? 'col-4' : 'col-6' "
                class="btn mx-auto d-block mt-1 col-4"
                @click="$emit('loadCore')"
            >
                {{'Load core from library'}}
            </button>
        </div>
    </div>
</template>
