import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'

export const useMagneticBuilderSettingsStore = defineStore("magneticBuilderSettings", () => {
    const enableVisualizers = ref(true);
    const enableSimulation = ref(true);
    const enableSubmenu = ref(true);
    const enableGraphs = ref(false);

    function reset() {
        this.enableVisualizers = true;
        this.enableSimulation = true;
        this.enableSubmenu = true;
        this.enableGraphs = false;
    }

    return {
        enableVisualizers,
        enableSimulation,
        enableSubmenu,
        enableGraphs,
        reset,
    }
},
{
    persist: true,
})
