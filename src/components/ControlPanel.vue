<script setup>
import { useMasStore } from '/src/stores/mas'
import { useHistoryStore } from '/src/stores/history'
import { checkAndFixMas, download } from '/WebSharedComponents/assets/js/utils.js'
import Settings from './MagneticBuilder/Settings.vue'
</script>


<script>

export default {
    emits: ["toolSelected"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        const masStore = useMasStore();
        const historyStore = useHistoryStore();
        const masExported = false;
        const loading = false;
        return {
            masStore,
            historyStore,
            masExported,
            loading,
        }
    },
    computed: {
    },
    watch: { 
    },
    mounted () {
    },
    methods: {
        undo() {
            const newMas = this.historyStore.back();
            this.masStore.mas = newMas;
            this.historyStore.historyPointerUpdated();
            this.historyStore.blockAdditions();
            setTimeout(() => {this.historyStore.unblockAdditions();}, 2000);
        },
        redo() {
            const newMas = this.historyStore.forward();
            this.masStore.mas = newMas;
            this.historyStore.historyPointerUpdated();
            this.historyStore.blockAdditions();
            setTimeout(() => {this.historyStore.unblockAdditions();}, 2000);
        },
        load() {
            this.loading = true;
            this.$refs.masFileReader.click()
            setTimeout(() => {this.loading = false;}, 2000);
        },
        exportMAS() {
            download(JSON.stringify(this.masStore.mas, null, 4), "custom_magnetic.json", "text/plain");
            this.masExported = true
            setTimeout(() => this.masExported = false, 2000);
        },
        openSettings() {
            this.masExported = true
            setTimeout(() => this.masExported = false, 2000);
        },
        onSettingsUpdated() {
        },
        readMASFile(event) {
            const fr = new FileReader();

            fr.onload = e => {
                const newMas = JSON.parse(e.target.result);
                if (newMas.magnetic != null) {
                    checkAndFixMas(newMas, this.$mkf).then(response => {
                        this.masStore.mas = response;
                        this.masStore.importedMas();
                        this.$userStore.toolboxStates[this.$userStore.selectedApplication].magneticBuilder.subsection = "magneticBuilder";
                        this.$stateStore.operatingPoints.modePerPoint = []
                        for (var i = 0; i < this.masStore.mas.inputs.operatingPoints.length; i++) {
                            this.$stateStore.operatingPoints.modePerPoint.push(this.$stateStore.OperatingPointsMode.Manual);
                        }
                        this.historyStore.addToHistory(this.masStore.mas);
                        this.historyStore.blockAdditions();
                        this.$emit('toolSelected', "magneticBuilder");
                    })
                    .catch(error => {
                        console.error(error)
                    });
                }
            }
            fr.readAsText(this.$refs['masFileReader'].files.item(0), "ISO-8859-1");
        },
    }
}
</script>

<template>
    <Settings 
        :modalName="'MagneticBuilderConfigurationModal'"
        @onSettingsUpdated="onSettingsUpdated"
    />
    <div class="container" :style="$styleStore.controlPanel.main">
        <div class="row ">
            <button
                :style="$styleStore.controlPanel.button"
                :disabled="!historyStore.isBackPossible()"
                class="btn offset-sm-0 offset-lg-1 col-2 col-lg-1"
                @click="undo"
            >
                <i class="fa-solid fa-arrow-rotate-left"></i>
            </button>
            <button
                :style="$styleStore.controlPanel.button"
                :disabled="!historyStore.isForwardPossible()"
                class="btn col-2 col-lg-1"
                @click="redo"
            >
                <i class="fa-solid fa-arrow-rotate-right"></i>
            </button>
            <input data-cy="CoreImport-MAS-file-button" type="file" ref="masFileReader" @change="readMASFile()" class="btn mt-1 rounded-3" hidden />
            <button
                :style="$styleStore.controlPanel.button"
                v-if="!loading"
                class="btn offset-1 col-3"
                @click="load"
            >
                {{'Load MAS'}}
            </button>
            <button
                v-else
                :style="$styleStore.controlPanel.button"
                class="btn offset-1 col-3"
                @click="load"
            >
                {{'Loading'}}
            </button>
            <button
                :style="$styleStore.controlPanel.button"
                class="btn col-3"
                @click="exportMAS"
            >
                {{'Export MAS'}}
            </button>
            <button 
                :style="$styleStore.controlPanel.button"
                class="btn offset-md-0 offset-lg-1 col-1 px-md-0"
                data-bs-toggle="modal"
                data-bs-target="#MagneticBuilderConfigurationModal"
                @click="openSettings" 
                >
                <i class="fa-solid fa-gear"></i>
            </button>


        </div>
    </div>
</template>
