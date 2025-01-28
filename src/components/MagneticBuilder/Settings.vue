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
            visualizersEnabled: magneticBuilderSettingsStore.visualizersEnabled? '1' : '0',
            simulationEnabled: magneticBuilderSettingsStore.simulationEnabled? '1' : '0',
            submenuEnabled: magneticBuilderSettingsStore.submenuEnabled? '1' : '0',
            graphsEnabled: magneticBuilderSettingsStore.graphsEnabled? '1' : '0',
        }

        const settingsChanged = false;
        return {
            localData,
            settingsChanged,
            magneticBuilderSettingsStore,
        }
    },
    methods: {
        onSettingChanged(event, setting) {
            this.magneticBuilderSettingsStore[setting] = event.target.value == '1';
            this.settingsChanged = true;
        },
        onSettingsUpdated(event) {
            console.log("onSettingsUpdated");
            console.log(this.$refs.closeSettingsModalRef);
            this.$refs.closeSettingsModalRef.click();
            this.$emit('onSettingsUpdated');
        },
    },
    computed: {
    },
    mounted() {
    },
    created() {
    }
}
</script>


<template>
    <div class="modal fade" :id="modalName" tabindex="-1" :aria-labelledby="modalName + '-settingsModalLabel'" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable settings">
            <div class="modal-content bg-dark text-white">
                <div class="modal-header">
                    <p :data-cy="dataTestLabel + '-settingsModal-notification-text'" class="modal-title fs-5" :id="modalName + '-settingsModalLabel'">Magnetic Builder Settings</p>
                    <button ref="closeSettingsModalRef" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="settingsModalClose"></button>
                </div>
                <div class="modal-body container">
                    <div class="row">
                        <h5 class="offset-0 col-6 text-end">Enable Visualization</h5>
                        <div class="col-sm-6 col-md-6 col-lg-4">
                            <label class="fs-6 p-0 ps-3 pe-3 text-end text-white col-4 ">Disable</label>
                            <input :data-cy="dataTestLabel + '-Settings-Modal-enable-visualization-button'" v-model="localData.visualizersEnabled" @change="onSettingChanged($event, 'visualizersEnabled')" type="range" class="form-range col-1 pt-2" min="0" max="1" step="1" style="width: 30px">
                            <label class="fs-6 p-0 ps-3 text-white col-6 text-start">Enable</label>
                        </div>
                    </div>
                    <div class="row">
                        <h5 class="offset-0 col-6 text-end">Enable Simulation</h5>
                        <div class="col-sm-6 col-md-6 col-lg-4">
                            <label class="fs-6 p-0 ps-3 pe-3 text-end text-white col-4 ">Disable</label>
                            <input :data-cy="dataTestLabel + '-Settings-Modal-enable-visualization-button'" v-model="localData.simulationEnabled" @change="onSettingChanged($event, 'simulationEnabled')" type="range" class="form-range col-1 pt-2" min="0" max="1" step="1" style="width: 30px">
                            <label class="fs-6 p-0 ps-3 text-white col-6 text-start">Enable</label>
                        </div>
                    </div>
                    <div class="row">
                        <h5 class="offset-0 col-6 text-end">Enable Submenu</h5>
                        <div class="col-sm-6 col-md-6 col-lg-4">
                            <label class="fs-6 p-0 ps-3 pe-3 text-end text-white col-4 ">Disable</label>
                            <input :data-cy="dataTestLabel + '-Settings-Modal-enable-visualization-button'" v-model="localData.submenuEnabled" @change="onSettingChanged($event, 'submenuEnabled')" type="range" class="form-range col-1 pt-2" min="0" max="1" step="1" style="width: 30px">
                            <label class="fs-6 p-0 ps-3 text-white col-6 text-start">Enable</label>
                        </div>
                    </div>
                    <div class="row">
                        <h5 class="offset-0 col-6 text-end">Enable Graphs</h5>
                        <div class="col-sm-6 col-md-6 col-lg-4">
                            <label class="fs-6 p-0 ps-3 pe-3 text-end text-white col-4 ">Disable</label>
                            <input :data-cy="dataTestLabel + '-Settings-Modal-enable-visualization-button'" v-model="localData.graphsEnabled" @change="onSettingChanged($event, 'graphsEnabled')" type="range" class="form-range col-1 pt-2" min="0" max="1" step="1" style="width: 30px">
                            <label class="fs-6 p-0 ps-3 text-white col-6 text-start">Enable</label>
                        </div>
                    </div>
                    <button :disabled="!settingsChanged" :data-cy="dataTestLabel + '-Settings-Modal-update-settings-button'" class="btn btn-success mx-auto d-block mt-4" data-bs-dismiss="modal" @click="onSettingsUpdated" >Close</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style>

    .settings {
        z-index: 9999;
    }
</style>