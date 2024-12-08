import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'
import * as Utils from '/WebSharedComponents/assets/js/utils.js'
import * as Defaults from '/WebSharedComponents/assets/js/defaults.js'

export const useUserStore = defineStore("user", () => {

    const anyDesignLoaded = ref(false);
    const wire2DVisualizerPlotCurrentDensity = ref(0);
    const wire2DVisualizerPlotCurrentViews = ref({});
    const wire2DVisualizerShowAnyway = ref(false);
    const magnetic2DVisualizerPlotCurrentView = ref(null);
    const magnetic2DVisualizerPlotMagneticField = ref(0);
    const magnetic2DVisualizerPlotFringingField = ref(1);

    function isAnyDesignLoaded() {
        return this.anyDesignLoaded;
    }

    function designLoaded() {
        this.anyDesignLoaded = true;
    }

    function resetMagneticTool() {
        this.anyDesignLoaded = false;
    }
    function armDeadManSwitch() {
    }
    function disarmDeadManSwitch() {
    }
    return {
        anyDesignLoaded,
        isAnyDesignLoaded,
        designLoaded,
        resetMagneticTool,
        armDeadManSwitch,
        disarmDeadManSwitch,
        wire2DVisualizerPlotCurrentDensity,
        wire2DVisualizerPlotCurrentViews,
        wire2DVisualizerShowAnyway,
        magnetic2DVisualizerPlotCurrentView,
        magnetic2DVisualizerPlotMagneticField,
        magnetic2DVisualizerPlotFringingField,
    }
},
{
    persist: true,
})
