<script>
export default {
    emits: ["showAlignmentOptions", "customizeCoil", "showInsulationOptions"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        enableAlignmentOptions: {
            type: Boolean,
            default: true,
        },
        enableInsulationOptions: {
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
        const showInsulationOptions = false;
        return {
            showAlignmentOptions,
            showInsulationOptions,
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
        swapShowInsulationOptions() {
            this.showInsulationOptions = !this.showInsulationOptions;
            this.$emit('showInsulationOptions', this.showInsulationOptions);
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <button
                v-if="!$stateStore.hasCurrentApplicationMirroredWindings()"
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
                :style="showInsulationOptions? $styleStore.magneticBuilder.hideInsulationOptionsButton: $styleStore.magneticBuilder.showInsulationOptionsButton"
                :disabled="!enableInsulationOptions"
                :data-cy="dataTestLabel + '-Coil-ShowInsulationOptions-button'"
                :class="readOnly? 'col-6' : 'col-4'"
                class="btn mx-auto d-block mt-1"
                @click="swapShowInsulationOptions"
            >
                {{showInsulationOptions? 'Hide insulation options' : 'Show insulation options'}}
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
