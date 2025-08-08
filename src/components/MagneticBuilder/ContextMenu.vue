<script setup>
import { toDashCase, toPascalCase, toTitleCase } from '/WebSharedComponents/assets/js/utils.js'

</script>

<script>
export default {
    emits: ["editMagnetic", "viewMagnetic", "toolSelected"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'right'
            return {
                theme: {
                    placement: relative_placement,
                    width: '150px',
                    "text-align": "end",
                },
            }
        },
    },
    watch: {
    },
    mounted () {
    },
    methods: {
        coreSubmodeShape() {
            this.$stateStore.magneticBuilder.submode.core = this.$stateStore.MagneticBuilderCoreSubmodes.Shape;
        },
        coreSubmodeGapping() {
            this.$stateStore.magneticBuilder.submode.core = this.$stateStore.MagneticBuilderCoreSubmodes.Gapping;
        },
        coreSubmodeMaterial() {
            this.$stateStore.magneticBuilder.submode.core = this.$stateStore.MagneticBuilderCoreSubmodes.Material;
        },
        coreAdvancedModeConfirmChanges() {
            this.$stateStore.applyChanges();
        },
        coreAdvancedModeCancelChanges() {
            this.$stateStore.cancelChanges();
        },
    }
}
</script>

<template>
    <div class="pb-2 p-0 container" v-tooltip="styleTooltip" :style="$styleStore.contextMenu.main">
        <div class="row px-3">
            <button
                :style="$styleStore.contextMenu.customizeCoreSectionButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.getCurrentToolState().subsection == 'magneticBuilder' && $stateStore.magneticBuilder.submode.core != $stateStore.MagneticBuilderCoreSubmodes.Shape"  
                :data-cy="dataTestLabel + '-change-tool-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreSubmodeShape"
            >
                {{'Edit shape'}}
            </button>
            <button
                :style="$styleStore.contextMenu.customizeCoreSectionButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.getCurrentToolState().subsection == 'magneticBuilder' && $stateStore.magneticBuilder.submode.core != $stateStore.MagneticBuilderCoreSubmodes.Gapping"  
                :data-cy="dataTestLabel + '-change-tool-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreSubmodeGapping"
            >
                {{'Edit gapping'}}
            </button>
            <button
                :style="$styleStore.contextMenu.customizeCoreSectionButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.getCurrentToolState().subsection == 'magneticBuilder' && $stateStore.magneticBuilder.submode.core != $stateStore.MagneticBuilderCoreSubmodes.Material"  
                :data-cy="dataTestLabel + '-change-tool-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreSubmodeMaterial"
            >
                {{'Edit material'}}
            </button>
            <button
                :style="$styleStore.contextMenu.confirmButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.getCurrentToolState().subsection == 'magneticBuilder'"  
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreAdvancedModeConfirmChanges"
            >
                {{'Apply'}}
            </button>
            <button
                :style="$styleStore.contextMenu.cancelButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.getCurrentToolState().subsection == 'magneticBuilder'"  
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreAdvancedModeCancelChanges"
            >
                {{'Cancel'}}
            </button>
        </div>
    </div>
</template>

