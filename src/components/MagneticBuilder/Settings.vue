<script setup >
import { Modal } from "bootstrap";
import { useMagneticBuilderSettingsStore } from '../../stores/magneticBuilderSettings'
</script>

<script>

export default {
    emits: ["onSettingsUpdated"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        modalName: {
            type: String,
            default: 'SettingsModal',
        },
    },
    data() {
        const magneticBuilderSettingsStore = useMagneticBuilderSettingsStore();
        const localData = {
            enableVisualizers: magneticBuilderSettingsStore.enableVisualizers,
            enableSimulation: magneticBuilderSettingsStore.enableSimulation,
            enableSubmenu: magneticBuilderSettingsStore.enableSubmenu,
            enableGraphs: magneticBuilderSettingsStore.enableGraphs,
        }

        const settingsChanged = false;
        return {
            localData,
            settingsChanged,
            magneticBuilderSettingsStore,
        }
    },
    methods: {
        onSettingChanged(setting) {
            this.localData[setting] = !this.localData[setting];
            this.magneticBuilderSettingsStore[setting] = this.localData[setting];
            this.settingsChanged = true;
        },
        onSettingsUpdated(event) {
            this.$refs.closeSettingsModalRef.click();
            this.$emit('onSettingsUpdated');
        }
    }
}
</script>


<template>
    <div class="modal fade" :id="modalName" tabindex="-1" :aria-labelledby="modalName + '-settingsModalLabel'" aria-hidden="true">
        <div class="modal-dialog modal-md modal-dialog-centered settings">
            <div class="modal-content bg-dark border-0 shadow-lg">
                <div class="modal-header border-bottom border-secondary px-4 py-3">
                    <div class="d-flex align-items-center">
                        <i class="fa-solid fa-gear text-primary me-2 fs-5"></i>
                        <h5 :data-cy="dataTestLabel + '-settingsModal-notification-text'" class="modal-title text-white mb-0" :id="modalName + '-settingsModalLabel'">Settings</h5>
                    </div>
                    <button ref="closeSettingsModalRef" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="settingsModalClose"></button>
                </div>
                <div class="modal-body px-4 py-4">
                    <!-- Visualization Setting -->
                    <div class="setting-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                        <div>
                            <h6 class="text-white mb-1">3D Visualization</h6>
                            <small class="text-secondary">Show 3D preview of magnetic components</small>
                        </div>
                        <div class="form-check form-switch">
                            <input 
                                :data-cy="dataTestLabel + '-Settings-Modal-enable-visualization-button'" 
                                class="form-check-input custom-switch" 
                                type="checkbox" 
                                role="switch"
                                :checked="localData.enableVisualizers"
                                @change="onSettingChanged('enableVisualizers')"
                            >
                        </div>
                    </div>

                    <!-- Simulation Setting -->
                    <div class="setting-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                        <div>
                            <h6 class="text-white mb-1">Auto Simulation</h6>
                            <small class="text-secondary">Automatically run simulations on changes</small>
                        </div>
                        <div class="form-check form-switch">
                            <input 
                                :data-cy="dataTestLabel + '-Settings-Modal-enable-simulation-button'" 
                                class="form-check-input custom-switch" 
                                type="checkbox" 
                                role="switch"
                                :checked="localData.enableSimulation"
                                @change="onSettingChanged('enableSimulation')"
                            >
                        </div>
                    </div>

                    <!-- Submenu Setting -->
                    <div class="setting-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                        <div>
                            <h6 class="text-white mb-1">Sidebar Menu</h6>
                            <small class="text-secondary">Show navigation submenu in sidebar</small>
                        </div>
                        <div class="form-check form-switch">
                            <input 
                                :data-cy="dataTestLabel + '-Settings-Modal-enable-submenu-button'" 
                                class="form-check-input custom-switch" 
                                type="checkbox" 
                                role="switch"
                                :checked="localData.enableSubmenu"
                                @change="onSettingChanged('enableSubmenu')"
                            >
                        </div>
                    </div>

                    <!-- Graphs Setting -->
                    <div class="setting-item d-flex justify-content-between align-items-center py-3">
                        <div>
                            <h6 class="text-white mb-1">Interactive Graphs</h6>
                            <small class="text-secondary">Display interactive charts and graphs</small>
                        </div>
                        <div class="form-check form-switch">
                            <input 
                                :data-cy="dataTestLabel + '-Settings-Modal-enable-graphs-button'" 
                                class="form-check-input custom-switch" 
                                type="checkbox" 
                                role="switch"
                                :checked="localData.enableGraphs"
                                @change="onSettingChanged('enableGraphs')"
                            >
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-top border-secondary px-4 py-3">
                    <button
                        :data-cy="dataTestLabel + '-Settings-Modal-update-settings-button'"
                        class="btn btn-primary px-4"
                        data-bs-dismiss="modal"
                        @click="onSettingsUpdated"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings {
    z-index: 9999;
}

.custom-switch {
    width: 3em;
    height: 1.5em;
    cursor: pointer;
}

.custom-switch:checked {
    background-color: #0d6efd;
    border-color: #0d6efd;
}

.custom-switch:focus {
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.setting-item:hover {
    background-color: rgba(255, 255, 255, 0.03);
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: 0.5rem;
}
</style>