import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'

export const useMagneticBuilderSettingsStore = defineStore("magneticBuilderSettings", () => {
    const visualizersEnabled = ref(true);
    const enableSimulation = ref(true);
    const enableSubmenu = ref(true);
    const graphsEnabled = ref(false);

    function reset() {
        this.visualizersEnabled = true;
        this.enableSimulation = true;
        this.enableSubmenu = true;
        this.graphsEnabled = false;
    }

    return {
        visualizersEnabled,
        enableSimulation,
        enableSubmenu,
        graphsEnabled,
        reset,
    }
},
{
    persist: true,
})
