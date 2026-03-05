import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'

export const useSettingsStore = defineStore("settings", () => {
    const loadingGif = ref("/images/loading.gif");
    const waitingTimeAfterChange = 200;
    const waitingTimeForPlottingAfterChange = 500;

    const catalogAdviserSettings = ref({
        advancedMode: true,
        useAllParts: false,
    })

    const coreAdviserSettings = ref({
        weights: null,
    })

    const adviserSettings = ref({
        useOnlyCoresInStock: true,
        allowDistributedGaps: true,
        allowStacks: true,
        allowToroidalCores: true,
    })

    const magneticBuilderSettings = ref({
        useOnlyCoresInStock: true,
        allowDistributedGaps: true,
        allowStacks: true,
        allowToroidalCores: true,
        advancedMode: true,
        autoRedraw: true,
    })

    const magneticAdviserSettings = ref({
        weights: null,
        maximumNumberResults: 6,
    })

    const operatingPointSettings = ref({
        advancedMode: true,
    })

    function reset() {
        this.adviserSettings ={
            useOnlyCoresInStock: true,
            allowDistributedGaps: true,
            allowStacks: true,
            allowToroidalCores: true,
        };
        this.magneticBuilderSettings = {
            useOnlyCoresInStock: true,
            allowDistributedGaps: true,
            allowStacks: true,
            allowToroidalCores: true,
            advancedMode: true,
            autoRedraw: true,
        };
        this.coreAdviserSettings ={
            weights: null
        };
        this.magneticAdviserSettings ={
            weights: null,
            maximumNumberResults: 6,
        };
        this.operatingPointSettings ={
            advancedMode: true,
        };


        this.catalogAdviserSettings = {
            advancedMode: true,
            useAllParts: null,
        };


    }

    return {
        adviserSettings,
        magneticBuilderSettings,
        coreAdviserSettings,
        magneticAdviserSettings,
        operatingPointSettings,

        catalogAdviserSettings,

        reset,

        loadingGif,
        waitingTimeAfterChange,
        waitingTimeForPlottingAfterChange,
    }
},
{
    persist: true,
})
