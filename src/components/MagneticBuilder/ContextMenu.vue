<script setup>
import { toDashCase, toPascalCase, toTitleCase } from '/WebSharedComponents/assets/js/utils.js'
import { useMagneticBuilderSettingsStore } from '../../stores/magneticBuilderSettings'
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
        const magneticBuilderSettingsStore = useMagneticBuilderSettingsStore();
        return {
            magneticBuilderSettingsStore,
        }
    },
    computed: {
        styleTooltip() {
            const relative_placement = 'right';
            return {
                theme: {
                    placement: relative_placement,
                    width: '150px',
                    "text-align": "end",
                },
            }
        },
        showResimulateButton() {
            return !this.magneticBuilderSettingsStore.enableSimulation && 
                   this.$stateStore.magneticBuilder.mode.core == this.$stateStore.MagneticBuilderModes.Basic && 
                   this.$stateStore.magneticBuilder.mode.coil == this.$stateStore.MagneticBuilderModes.Basic;
        },
    },
    watch: {
    },
    mounted () {
    },
    methods: {
        goToMagneticsAdviser() {
            this.$router.push('/magnetic_adviser');
        },
        resimulate() {
            this.$stateStore.resimulate();
        },
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
        coilAdvancedModeClose() {
            this.$stateStore.closeCoilAdvancedInfo();
        },
    }
}
</script>

<template>
    <div class="pb-2 p-0 container" v-tooltip="styleTooltip" :style="$styleStore.contextMenu.main">
        <div class="row px-3">
            <button
                :style="$styleStore.contextMenu.changeToolButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Basic && $stateStore.magneticBuilder.mode.coil == $stateStore.MagneticBuilderModes.Basic"
                :data-cy="dataTestLabel + '-magnetics-adviser-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="goToMagneticsAdviser"
            >
                {{'Magnetic Adviser'}}
            </button>
            <button
                :style="$styleStore.contextMenu.customizeCoreSectionButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.magneticBuilder.submode.core != $stateStore.MagneticBuilderCoreSubmodes.Shape"  
                :data-cy="dataTestLabel + '-change-tool-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreSubmodeShape"
            >
                {{'Edit shape'}}
            </button>
            <button
                :style="$styleStore.contextMenu.customizeCoreSectionButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.magneticBuilder.submode.core != $stateStore.MagneticBuilderCoreSubmodes.Gapping"  
                :data-cy="dataTestLabel + '-change-tool-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreSubmodeGapping"
            >
                {{'Edit gapping'}}
            </button>
            <button
                :style="$styleStore.contextMenu.customizeCoreSectionButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced && $stateStore.magneticBuilder.submode.core != $stateStore.MagneticBuilderCoreSubmodes.Material"  
                :data-cy="dataTestLabel + '-change-tool-button'"
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreSubmodeMaterial"
            >
                {{'Edit material'}}
            </button>
            <button
                :style="$styleStore.contextMenu.confirmButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced"  
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreAdvancedModeConfirmChanges"
            >
                {{'Apply'}}
            </button>
            <button
                :style="$styleStore.contextMenu.cancelButton"
                v-if="$stateStore.magneticBuilder.mode.core == $stateStore.MagneticBuilderModes.Advanced"  
                class="btn mx-auto d-block mt-1 col-2"
                @click="coreAdvancedModeCancelChanges"
            >
                {{'Cancel'}}
            </button>
            <button
                :style="$styleStore.contextMenu.cancelButton"
                v-if="$stateStore.magneticBuilder.mode.coil == $stateStore.MagneticBuilderModes.Advanced"  
                class="btn mx-auto d-block mt-1 col-2"
                @click="coilAdvancedModeClose"
            >
                {{'Close'}}
            </button>
        </div>
    </div>
</template>

