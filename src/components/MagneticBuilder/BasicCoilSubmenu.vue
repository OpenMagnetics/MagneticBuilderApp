<script setup>
</script>

<script>
export default {
    emits: ["showAlignmentOptions", "customizeCoil", "showMarginOptions"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        enableAlignmentOptions: {
            type: Boolean,
            default: true,
        },
        enableMarginOptions: {
            type: Boolean,
            default: true,
        },
        enableCustomize: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const showAlignmentOptions = false;
        const showMarginOptions = false;
        return {
            showAlignmentOptions,
            showMarginOptions,
        }
    },
    computed: {
    },
    watch: { 
    },
    mounted () {
    },
    methods: {
        swapShowAlignmentOptions() {
            this.showAlignmentOptions = !this.showAlignmentOptions;
            this.$emit('showAlignmentOptions', this.showAlignmentOptions);
        },
        swapShowMarginOptions() {
            this.showMarginOptions = !this.showMarginOptions;
            this.$emit('showMarginOptions', this.showMarginOptions);
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <button
                :style="showAlignmentOptions? $styleStore.magneticBuilder.hideAlignmentOptionsButton: $styleStore.magneticBuilder.showAlignmentOptionsButton"
                :disabled="!enableAlignmentOptions"
                :data-cy="dataTestLabel + '-Coil-ShowAlignmentOptions-button'"
                :class="readOnly? 'col-6' : 'col-4'"
                class="btn mx-auto d-block mt-1"
                @click="swapShowAlignmentOptions"
            >
                {{showAlignmentOptions? 'Hide alignment options' : 'Show alignment options'}}
            </button>
            <button
                :style="showMarginOptions? $styleStore.magneticBuilder.hideMarginOptionsButton: $styleStore.magneticBuilder.showMarginOptionsButton"
                :disabled="!enableMarginOptions"
                :data-cy="dataTestLabel + '-Coil-ShowMarginOptions-button'"
                :class="readOnly? 'col-6' : 'col-4'"
                class="btn mx-auto d-block mt-1"
                @click="swapShowMarginOptions"
            >
                {{showMarginOptions? 'Hide margin options' : 'Show margin options'}}
            </button>
            <button
                :style="$styleStore.magneticBuilder.customizeButton"
                v-if="!readOnly"
                :disabled="!enableCustomize"
                :data-cy="dataTestLabel + '-Coil-Customize-button'"
                class="btn mx-auto d-block mt-1"
                @click="$emit('customizeCoil')"
            >
                {{'Customize'}}
            </button>
        </div>
    </div>
</template>
