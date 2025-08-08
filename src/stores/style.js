import { defineStore } from 'pinia'
import { ref, watch, computed  } from 'vue'

export const useStyleStore = defineStore("style", () => {
    const style = getComputedStyle(document.body);

    const theme = {
        primary: style.getPropertyValue('--bs-primary'),
        secondary: style.getPropertyValue('--bs-secondary'),
        success: style.getPropertyValue('--bs-success'),
        info: style.getPropertyValue('--bs-info'),
        warning: style.getPropertyValue('--bs-warning'),
        danger: style.getPropertyValue('--bs-danger'),
        light: style.getPropertyValue('--bs-light'),
        dark: style.getPropertyValue('--bs-dark'),
        white: style.getPropertyValue('--bs-white'),
        transparent: style.getPropertyValue('--bs-transparent'),
    };

    const engineLoader = ref({
        main: {
            "background": theme["dark"] + ' !important',
            "color": theme["white"],
        },
    });

    const storyline = ref({
        main: {
            "background": "transparent",
            "color": theme["white"],
        },
        activeButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        availableButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        pendingButton: {
            "background": "transparent",
            "color": theme["white"],
        },
        continueButton: {
            "background": theme["success"],
            "color": theme["dark"],
        }
    });


    const designRequirements = ref({
        main: {
            "background": theme["dark"],
            "color": theme["white"],
            "border-color": theme["primary"],
        },
        requiredButton: {
            "background": theme["light"],
            "color": theme["white"],
            "border-color": theme["light"],
        },
        addButton: {
            "background": theme["info"],
            "color": theme["dark"],
        },
        removeButton: {
            "background": theme["danger"],
            "color": theme["dark"],
        },
        requirementButton: {
            "background": theme["primary"],
            "color": theme["dark"],
            "border-color": theme["primary"],
        },
        inputFontSize: {
            // "font-size": '2rem',
            "font-size": '1rem',
        },
        inputTitleFontSize: {
            // "font-size": '2.5rem',
            "font-size": '1.25rem',
        },
        inputLabelBgColor:{
            "background": theme["dark"],
        },
        inputValueBgColor:{
            "background": theme["light"],
        },
        inputTextColor:{
            "color": theme["white"],
        },
        addElementButtonColor: {
            "color": theme["secondary"],
        },
        removeElementButtonColor: {
            "color": theme["danger"],
        },
    });


    const operatingPoints = ref({
        main: {
            "background": theme["dark"],
            "color": theme["white"],
            "border-color": theme["primary"],
        },
        unselectedUnprocessedWindingButton: {
            "background": theme["danger"],
            "color": theme["dark"],
        },
        unselectedProcessedWindingButton: {
            "background": theme["danger"],
            "color": theme["dark"],
        },
        selectedWindingButton: {
            "background": theme["success"],
            "color": theme["dark"],
        },
        reflectWindingButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        addOperatingPointButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        selectOperatingPointButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        removeOperatingPointButton: {
            "background": theme["danger"],
            "color": theme["dark"],
        },
        modifyNumberWindingsButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        goBackSelectingButton: {
            "background": theme["success"],
            "border-color": theme["success"],
            "color": theme["dark"],
        },
        confirmColumnsButton: {
            "background": theme["success"],
            "border-color": theme["success"],
            "color": theme["dark"],
        },
        typeButton: {
            "background": theme["secondary"],
            "border-color": theme["secondary"],
            "color": theme["white"],
            "font-size": '1.25rem',
        },

        titleLabelBgColor:{
            "background": theme["dark"],
        },
        titleTextColor:{
            "color": theme["white"],
        },
        commonParameterTextColor:{
            "color": theme["white"],
        },
        commonParameterBgColor:{
            "color": theme["white"],
        },
        currentTextColor:{
            "color": theme["info"],
        },
        voltageTextColor:{
            "color": theme["primary"],
        },
        currentBgColor:{
            "background": theme["info"],
        },
        voltageBgColor:{
            "background": theme["primary"],
        },


        inputFontSize: {
            // "font-size": '2rem',
            "font-size": '1rem',
        },
        inputTitleFontSize: {
            // "font-size": '2.5rem',
            "font-size": '1.25rem',
        },
        inputLabelBgColor:{
            "background": theme["dark"],
        },
        inputValueBgColor:{
            "background": theme["light"],
        },
        inputTextColor:{
            "color": theme["white"],
        },
        addElementButtonColor: {
            "color": theme["secondary"],
        },
        removeElementButtonColor: {
            "color": theme["danger"],
        },

    });

    const magneticBuilder = ref({
        main: {
            "background": theme["dark"],
            "color": theme["white"],
            "border-color":  theme["primary"] + ' !important',
        },
        customizeButton: {
            "background": theme["success"],
            "color": theme["dark"],
        },
        loadFromLibraryButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        adviseButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        showAlignmentOptionsButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        showInsulationOptionsButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        hideAlignmentOptionsButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        hideInsulationOptionsButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        coilVisualizerButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        wireVisualizerButton: {
            "background": "transparent",
            "color": theme["white"],
            "display": ['-webkit-slider-thumb']
        },
        graphBgColor:{
            "background": theme["light"],
        },
        graphLineColor:{
            "color": theme["white"],
        },
        graphPointsColor:{
            "color": theme["danger"],
        },

        propertyBgColor:{
            "color": theme["dark"],
        },


        inputFontSize: {
            // "font-size": '2rem',
            "font-size": '1rem',
        },
        inputTitleFontSize: {
            // "font-size": '2.5rem',
            "font-size": '1.25rem',
        },
        inputLabelBgColor:{
            "background": theme["dark"] + ' !important',
            "background-image": "none !important",
        },
        inputLabelDangerBgColor:{
            "color": theme["danger"],
        },
        inputValueBgColor:{
            "background": theme["light"],
        },
        inputTextColor:{
            "color": theme["white"],
        },
        inputSelectedTextColor:{
            "color": theme["success"],
        },
        inputErrorTextColor:{
            "color": theme["danger"],
        },
        addButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        utilityButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        removeButton: {
            "background": theme["danger"],
            "color": theme["dark"],
        },
        addElementButtonColor: {
            "color": theme["secondary"],
        },
        removeElementButtonColor: {
            "color": theme["danger"],
        },
    });

    const controlPanel = ref({
        main: {
            "background": theme["dark"],
            "color": theme["white"],
        },
        button: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        activeButton: {
            "background": theme["info"],
            "color": theme["white"],
        },
        setting: {
            "background": theme["dark"],
            "color": theme["white"],
        },
        closeButton: {
            "background": theme["primary"],
            "color": theme["dark"],
            "border-color":  theme["primary"] + ' !important',
        },
    });

    const contextMenu = ref({
        main: {
            "background": theme["dark"],
            "color": theme["white"],
            "border-color":  theme["primary"] + ' !important',
        },
        settingsButton: {
            "background": theme["info"],
            "color": theme["dark"],
        },
        editButton: {
            "background": theme["success"],
            "color": theme["dark"],
        },
        redrawButton: {
            "background": theme["success"],
            "color": theme["dark"],
        },
        confirmButton: {
            "background": theme["success"],
            "color": theme["dark"],
        },
        cancelButton: {
            "background": theme["danger"],
            "color": theme["dark"],
        },
        changeToolButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        customizeCoreSectionButton: {
            "background": theme["secondary"],
            "color": theme["white"],
        },
        orderButton: {
            "background": theme["primary"],
            "color": theme["dark"],
        },
        setting: {
            "background": theme["dark"],
            "color": theme["white"],
        },
        closeButton: {
            "background": theme["primary"],
            "color": theme["dark"],
            "border-color":  theme["primary"] + ' !important',
        },
    });


    return {
        engineLoader,
        storyline,
        designRequirements,
        operatingPoints,
        magneticBuilder,
        controlPanel,
        contextMenu,
    }
},
{
    persist: false,
})
