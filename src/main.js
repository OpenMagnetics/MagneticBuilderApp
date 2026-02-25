import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/custom.css'
import { Tooltip } from 'bootstrap';
import 'bootstrap';
import router from "./router";
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VueCookies from 'vue3-cookies'
import tooltip from "/WebSharedComponents/Common/TooltipDirective.vue";
import axios from "axios";
import { useUserStore } from '/src/stores/user'
import { useSettingsStore } from '/src/stores/settings'
import { useStateStore } from '/src/stores/state'
import { VueWindowSizePlugin } from 'vue-window-size/plugin';
import { useStyleStore } from '/src/stores/style'
import { initWorker } from '/WebSharedComponents/assets/js/mkfRuntime'
import VueLatex from 'vatex'
import { checkAndClearOutdatedStores, getVersionedWasmUrl } from '/src/stores/storeVersioning'

// Monkey-patch Bootstrap Tooltip to fix _activeTrigger null errors
const originalIsWithActiveTrigger = Tooltip.prototype._isWithActiveTrigger;
Tooltip.prototype._isWithActiveTrigger = function() {
    if (!this._activeTrigger || typeof this._activeTrigger !== 'object') {
        this._activeTrigger = {};
    }
    return originalIsWithActiveTrigger.call(this);
};

// Check and clear outdated stores BEFORE Pinia is initialized
// This ensures old store data with incompatible field names is cleared
checkAndClearOutdatedStores();

const axiosInstance = axios.create()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App);
app.use(router);
app.use(pinia)
app.use(VueCookies, { expires: '7d'})
app.use(VueWindowSizePlugin);
app.use(VueLatex);
app.directive("tooltip", tooltip);
app.config.globalProperties.$axios = axiosInstance
app.config.globalProperties.$userStore = useUserStore()
app.config.globalProperties.$settingsStore = useSettingsStore()
app.config.globalProperties.$stateStore = useStateStore()
app.config.globalProperties.$styleStore = useStyleStore()
app.mount("#app");

router.beforeEach((to, from, next) => {

    if (app.config.globalProperties.$mkf != null && (to.name == "EngineLoader" || to.name == "WEEngineLoader")) {
        // If WASM is loaded and we go to enginer loader, we just return to where we were
        setTimeout(() => {router.push(from.path);}, 500);
    }


    const loadData = true;


    if (loadData) {
        if (app.config.globalProperties.$mkf == null && to.name != "EngineLoader") {
            app.config.globalProperties.$stateStore.loadingPath = to.path
            router.push('/engine_loader')
        }
        else if (app.config.globalProperties.$mkf == null && (to.name == "EngineLoader")) {
            const loadAllParts = true;
            const minimumLoaderTime = 500; // Minimum time to show the engine loader in ms
            const loaderStartTime = Date.now();
            
            // Mark as loading to prevent re-entry
            app.config.globalProperties.$mkf = { ready: Promise.resolve(), _loading: true };
            
            (async () => {
                try {
                    console.warn("Loading core materials in backend")
                    fetch("/core_materials.ndjson")
                    .then((data) => data.text())
                    .then((data) => {
                            if (!data.startsWith("<")) {
                                const postData = {
                                    "coreMaterialsString": data
                                };
                                const url = import.meta.env.VITE_API_ENDPOINT + '/load_external_core_materials';

                                app.config.globalProperties.$axios.post(url, postData)
                                .then(response => {
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                            }
                        })

                    // Initialize MKF in Web Worker
                    console.warn("Initializing MKF in Web Worker...")
                    // WASM files are in public/wasm folder, served at /wasm/ in production
                    const wasmJsUrl = getVersionedWasmUrl('/wasm/libMKF.wasm.js');
                    const mkf = await initWorker(wasmJsUrl);
                    app.config.globalProperties.$mkf = mkf;

                    // Load materials, shapes, and wires in the background (non-blocking)
                    if (loadAllParts) {
                        console.warn("Loading core materials, shapes and wires...")
                        await Promise.all([
                            mkf.load_core_materials("").then(() => console.log("Core materials loaded")),
                            mkf.load_core_shapes("").then(() => console.log("Core shapes loaded")),
                            mkf.load_wires("").then(() => console.log("Wires loaded"))
                        ]);
                        console.warn("All data loaded");
                    }
                    
                    // Ensure minimum loader display time
                    const elapsedTime = Date.now() - loaderStartTime;
                    const remainingTime = Math.max(0, minimumLoaderTime - elapsedTime);
                    
                    setTimeout(() => {
                        const stateStore = useStateStore();
                        const loadingPath = stateStore.loadingPath || '/';
                        router.push(loadingPath);
                    }, remainingTime);
                } catch (error) {
                    console.error("Error initializing MKF:", error);
                }
            })();

        }
    }

    next();
})