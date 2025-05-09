import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/custom.css'
import 'bootstrap';
import router from "./router";
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VueCookies from 'vue3-cookies'
import tooltip from "./directives/tooltip.js";
import "/src/assets/css/tooltip.css";
import axios from "axios";
import { useUserStore } from '/src/stores/user'
import { useSettingsStore } from '/src/stores/settings'
import { useStateStore } from '/src/stores/state'
import Module from '/src/assets/js/libMKF.wasm.js';
import { useStyleStore } from '/src/stores/style'



const axiosInstance = axios.create()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App);
app.use(router);
app.use(pinia)
app.use(VueCookies, { expires: '7d'})
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


    var loadData = true;


    if (loadData) {
        if (app.config.globalProperties.$mkf == null && to.name != "EngineLoader") {
            app.config.globalProperties.$stateStore.loadingPath = to.path
            router.push('/engine_loader')
        }
        else if (app.config.globalProperties.$mkf == null && (to.name == "EngineLoader")) {
            const loadAllParts = true;
            setTimeout(() => 
                {

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

                    app.config.globalProperties.$mkf = {
                        ready: new Promise(resolve => {
                            Module({
                                onRuntimeInitialized () {
                                    app.config.globalProperties.$mkf = Object.assign(this, {
                                        ready: Promise.resolve()
                                    });

                                    app.config.globalProperties.$mkf.ready.then(_ => {
                                        console.warn("Loading core materials in simulator")
                                        fetch("/core_materials.ndjson")
                                        .then((data) => data.text())
                                        .then((data) => {
                                                if (loadAllParts) {
                                                    app.config.globalProperties.$mkf.load_core_materials("");
                                                }
                                            })
                                        console.warn("Loading core shapes in simulator")
                                        fetch("/core_shapes.ndjson")
                                        .then((data) => data.text())
                                        .then((data) => {
                                                if (loadAllParts) {
                                                    app.config.globalProperties.$mkf.load_core_shapes("");
                                                }
                                        })
                                        console.warn("Loading wires in simulator")
                                        fetch("/wires.ndjson")
                                        .then((data) => data.text())
                                        .then((data) => {
                                            if (loadAllParts) {
                                                app.config.globalProperties.$mkf.load_wires("");
                                            }
                                        })
                                        router.push(app.config.globalProperties.$stateStore.loadingPath)
                                    }).error((error) => {
                                        console.error(error)
                                    })

                                    resolve(); 
                                }
                            });
                        })
                    };

                }
                , 100);

        }
    }

    next();
})