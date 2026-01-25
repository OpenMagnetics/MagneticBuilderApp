import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'
import * as Utils from '/WebSharedComponents/assets/js/utils.js'
import * as Defaults from '/WebSharedComponents/assets/js/defaults.js'

export const useUserStore = defineStore("user", () => {

    const showWelcome = ref(true);



    const loggedIn = ref(false)
    const ipAddress = ref(0)
    const username = ref(null)
    const readNotifications = ref([])
    const idToDelete = ref(null)
    const userSubsection = ref("operationPoints")

    const simulationUseCurrentAsInput = ref(1)
    const selectedModels = ref({
        gapReluctance: Defaults.reluctanceModelDefault,
        coreLosses: Defaults.coreLossesModelDefault,
        coreTemperature: Defaults.coreTemperatureModelDefault,
    })
    const isLoggedIn = computed(() => {
        return loggedIn
    })
    const getUsername = computed(() => {
        return username
    })
    const getUserSubsection = computed(() => {
        return userSubsection
    })
    const getIdToDelete = computed(() => {
        return idToDelete
    })

    const dump = computed(() => {
        return {
            "loggedIn": loggedIn.value,
            "ipAddress": ipAddress.value,
            "username": username.value,
            "readNotifications": readNotifications.value,
            "globalOperationPoint": globalOperationPoint.value,
            "globalCore": globalCore.value,
            "userSubsection": userSubsection.value,
            "coreSubsection": coreSubsection.value,
            "coreSimulationSubsection": coreSimulationSubsection.value,
            "simulationCoreCalculatorSubsection": simulationCoreCalculatorSubsection.value,
            "simulationUseCurrentAsInput": simulationUseCurrentAsInput.value,
            "selectedModels": selectedModels.value,
        }
    })



    function reset() {

        this.wire2DVisualizerState = {
            plotCurrentDensity: false,
            plotCurrentViews: {},
            showAnyway: false,
        };

        this.magnetic2DVisualizerState = {
            PlotCurrentView: null,
            PlotMode: 'basic',
            IncludeFringing: true,
        };








        this.loggedIn = false
        this.username = null
        this.idToDelete = null
        this.userSubsection = "operationPoints"

        this.readNotifications = []
        this.loggedIn = false
        this.ipAddress = 0
        this.username = null
        this.idToDelete = null
        this.simulationUseCurrentAsInput = 1
        this.selectedModels = {
            gapReluctance: Defaults.reluctanceModelDefault,
            coreLosses: Defaults.coreLossesModelDefault,
            coreTemperature: Defaults.coreTemperatureModelDefault,
        }
    }

    function setUsername(username) {
        this.username = username
    }
    function setUserSubsection(userSubsection) {
        this.userSubsection = userSubsection
    }
    function setCoreSubsection(coreSubsection) {
        this.coreSubsection = coreSubsection
    }
    function setCoreSimulationSubsection(coreSimulationSubsection) {
        this.coreSimulationSubsection = coreSimulationSubsection
    }
    function login() {
        this.loggedIn = true
    }
    function logout() {
        this.loggedIn = false
    }
    function setIdToDelete(idToDelete) {
        this.idToDelete = idToDelete
    }
    function setSelectedModels(variable, model) {
        this.selectedModels[variable] = model
    }
    function setSimulationUseCurrentAsInput(simulationUseCurrentAsInput) {
        this.simulationUseCurrentAsInput = simulationUseCurrentAsInput
    }
    function armDeadManSwitch() {
    }
    function disarmDeadManSwitch() {
    }
    return {
        showWelcome,

        dump,
        armDeadManSwitch,
        disarmDeadManSwitch,
        loggedIn,
        ipAddress,
        username,
        readNotifications,
        isLoggedIn,
        getUsername,
        setUsername,
        login,
        logout,
        userSubsection,
        getUserSubsection,
        setUserSubsection,

        simulationUseCurrentAsInput,
        setSimulationUseCurrentAsInput,

        idToDelete,
        getIdToDelete,
        setIdToDelete,
        setSelectedModels,
        selectedModels,
        reset,
    }
},
{
    persist: true,
})
