import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'

export const useMagneticBuilderSettingsStore = defineStore("magneticBuilderSettings", () => {
    const visualizersEnabled = ref(true);
    const simulationEnabled = ref(true);
    const submenuEnabled = ref(true);
    const graphsEnabled = ref(false);

    function reset() {
        this.visualizersEnabled = true;
        this.simulationEnabled = true;
        this.submenuEnabled = true;
        this.graphsEnabled = false;
    }

    return {
        visualizersEnabled,
        simulationEnabled,
        submenuEnabled,
        graphsEnabled,
        reset,
    }
},
{
    persist: true,
})
