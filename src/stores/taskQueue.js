import { defineStore } from 'pinia'
import { waitForMkf } from '/WebSharedComponents/assets/js/mkfRuntime'

export const useTaskQueueStore = defineStore('taskQueue', {
    actions: {
        coreShapeProcessed(success = true, dataOrMessage = '') {
        },

        async processCoreShape(coreShapeName) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const shapeResult = mkf.get_shape_data(coreShapeName)
            if (shapeResult.startsWith('Exception')) {
                setTimeout(() => {this.coreShapeProcessed(false, shapeResult)}, 100);
            }
            else {
                setTimeout(() => {this.coreShapeProcessed(true, JSON.parse(shapeResult))}, 100);
            }
        },

        coreMaterialProcessed(success = true, dataOrMessage = '') {
        },

        async processCoreMaterial(coreMaterialName) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const materialResult = mkf.get_material_data(coreMaterialName)
            if (materialResult.startsWith('Exception')) {
                setTimeout(() => {this.coreMaterialProcessed(false, materialResult)}, 100);
            }
            else {
                setTimeout(() => {this.coreMaterialProcessed(true, JSON.parse(materialResult))}, 100);
            }
        },

        coreProcessed(success = true, dataOrMessage = '') {
        },

        async processCore(core) {
            const mkf = await waitForMkf();
            await mkf.ready;

            core.geometricalDescription = null;
            core.processedDescription = null;
            const coreResult = mkf.calculate_core_data(JSON.stringify(core), false)
            if (coreResult.startsWith('Exception')) {
                setTimeout(() => {this.coreProcessed(false, coreResult);}, 100);
            }
            else {
                const auxCore = JSON.parse(coreResult);
                core.functionalDescription = auxCore.functionalDescription;
                core.processedDescription = auxCore.processedDescription;
                core.geometricalDescription = auxCore.geometricalDescription;
                
                setTimeout(() => {this.coreProcessed(true, core);}, 100);
            }
        },

        coreFromShapeProcessed(success = true, dataOrMessage = '') {
        },

        async processCoreFromShape(shapeName) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const shapeResult = mkf.get_shape_data(shapeName);
            const coreResult = mkf.calculate_core_data_from_shape(shapeResult);
            if (coreResult.startsWith('Exception')) {
                this.coreFromShapeProcessed(false, coreResult);
            }
            else {
                const core = JSON.parse(coreResult);                
                this.coreFromShapeProcessed(true, core);
            }
        },

        coreShapeFamiliesGotten(success = true, dataOrMessage = '') {
        },

        async getCoreShapeFamilies(wiringTechnology=null) {
            const mkf = await waitForMkf();
            await mkf.ready;

            var coreShapeFamilies = [];

            const coreShapeFamiliesHandle = mkf.get_available_core_shape_families();
            for (var i = coreShapeFamiliesHandle.size() - 1; i >= 0; i--) {
                const shapeFamily = coreShapeFamiliesHandle.get(i);
                if (!shapeFamily.includes("pqi") && !shapeFamily.includes("ut") &&
                    !shapeFamily.includes("ui") && !shapeFamily.includes("h") && !shapeFamily.includes("drum")) {
                    if (wiringTechnology == null || wiringTechnology == 'Wound' || shapeFamily != 'T') {
                        coreShapeFamilies.push(shapeFamily);
                    }
                }
            }

            coreShapeFamilies = coreShapeFamilies.sort();

            setTimeout(() => {this.coreShapeFamiliesGotten(true, coreShapeFamilies);}, 100);
        },

        coreShapeFamilySubtypesGotten(success = true, dataOrMessage = '') {
        },

        async getCoreShapeFamilySubtype(family) {
            const mkf = await waitForMkf();
            await mkf.ready;
            const availableFamilySubtypes = [];

            const coreShapeFamilSubtypesHandle = mkf.get_shape_family_subtypes(family);
            for (var i = 0; i < coreShapeFamilSubtypesHandle.size(); i++) {
                const shapeFamilySubtype = coreShapeFamilSubtypesHandle.get(i);
                if (!shapeFamilySubtype.includes("pqi") && !shapeFamilySubtype.includes("ut") &&
                    !shapeFamilySubtype.includes("ui") && !shapeFamilySubtype.includes("h") && !shapeFamilySubtype.includes("drum")) {
                    availableFamilySubtypes.push(shapeFamilySubtype);
                }
            }

            setTimeout(() => {this.coreShapeFamilySubtypesGotten(true, availableFamilySubtypes);}, 100);
        },

        coreShapeFamilyDimensionsGotten(success = true, dataOrMessage = '') {
        },

        async getCoreShapeFamilyDimensions(family, familySubtype, dimensionsExceptionsPerFamily) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const dimensionsHandle = mkf.get_shape_family_dimensions(family, familySubtype);
            const dimensions = {};
            for (var i = 0; i < dimensionsHandle.size(); i++) {
                const key = dimensionsHandle.get(i);
                if (family in dimensionsExceptionsPerFamily) {
                    if (dimensionsExceptionsPerFamily[family].includes(key)) {
                        continue;
                    }
                }
            }
            setTimeout(() => {this.coreShapeFamilyDimensionsGotten(true, dimensions);}, 100);
        },

        coreShapesGotten(success = true, dataOrMessage = '') {
        },

        async getCoreShapes(mas, onlyManufacturer) {
            const mkf = await waitForMkf();
            await mkf.ready;

            var coreShapeFamilies = [];
            var coreShapeNames = {};

            const coreShapeFamiliesHandle = mkf.get_available_core_shape_families();
            for (var i = coreShapeFamiliesHandle.size() - 1; i >= 0; i--) {
                const shapeFamily = coreShapeFamiliesHandle.get(i);
                if (!shapeFamily.includes("pqi") && !shapeFamily.includes("ut") &&
                    !shapeFamily.includes("ui") && !shapeFamily.includes("h") && !shapeFamily.includes("drum")) {
                    if (mas.inputs.designRequirements.wiringTechnology == null || mas.inputs.designRequirements.wiringTechnology == 'Wound' || shapeFamily != 'T') {
                        coreShapeFamilies.push(shapeFamily);
                    }
                }
            }

            coreShapeFamilies = coreShapeFamilies.sort();

            if (onlyManufacturer != '' && onlyManufacturer != null) {
                var coreShapeNamesHandle = mkf.get_available_core_shapes_by_manufacturer(onlyManufacturer);

                coreShapeFamilies.forEach((shapeFamily) => {
                    if (!shapeFamily.includes("pqi") && !shapeFamily.includes("ut") &&
                        !shapeFamily.includes("ui") && !shapeFamily.includes("h") && !shapeFamily.includes("drum")) {


                        coreShapeNames[shapeFamily] = [];
                        
                        var numberShapes = 0;
                        for (var i = coreShapeNamesHandle.size() - 1; i >= 0; i--) {
                            const aux = coreShapeNamesHandle.get(i);
                            if (aux.startsWith(shapeFamily + " ")) {
                                numberShapes += 1;
                                coreShapeNames[shapeFamily].push(aux);
                            }
                        }
                        if (numberShapes == 0) {
                            coreShapeNames[shapeFamily].pop();
                        }

                    }
                })
            }
            else {
                coreShapeFamilies.forEach((shapeFamily) => {
                    if (!shapeFamily.includes("pqi") && !shapeFamily.includes("ut") &&
                        !shapeFamily.includes("ui") && !shapeFamily.includes("h") && !shapeFamily.includes("drum")) {
                        coreShapeNames[shapeFamily] = [];
                        var coreShapeNamesHandle = mkf.get_available_core_shapes_by_family(shapeFamily.toLowerCase())

                        var numberShapes = 0;
                        for (var i = coreShapeNamesHandle.size() - 1; i >= 0; i--) {
                            const aux = coreShapeNamesHandle.get(i);
                            numberShapes += 1;
                            coreShapeNames[shapeFamily].push(aux);
                        }
                        if (numberShapes == 0) {
                            coreShapeNames[shapeFamily].pop();
                        }

                    }
                })
            }

            if (mas.magnetic.core.functionalDescription.shape.type == "custom") {
                coreShapeNames[mas.magnetic.core.functionalDescription.shape.family.toUpperCase()].unshift(mas.magnetic.core.functionalDescription.shape.name);
            }
            setTimeout(() => {this.coreShapesGotten(true, coreShapeNames);}, 100);
        },

        coreMaterialsGotten(success = true, dataOrMessage = '') {
        },

        async getCoreMaterials(onlyManufacturer) {
            const mkf = await waitForMkf();
            await mkf.ready;

            var coreMaterialManufacturers = [];
            var coreMaterialNames = {};

            const coreMaterialManufacturersHandle = mkf.get_available_core_manufacturers();
            for (var i = coreMaterialManufacturersHandle.size() - 1; i >= 0; i--) {
                const manufacturer = coreMaterialManufacturersHandle.get(i);
                coreMaterialManufacturers.push(manufacturer);
            }

            coreMaterialManufacturers = coreMaterialManufacturers.sort();

            coreMaterialManufacturers.forEach((manufacturer) => {
                coreMaterialNames[manufacturer] = []
                if (!(onlyManufacturer != '' && onlyManufacturer != null && manufacturer != onlyManufacturer)) {
                    const coreMaterialNamesHandle = mkf.get_available_core_materials(manufacturer);
                    for (var i = coreMaterialNamesHandle.size() - 1; i >= 0; i--) {
                        coreMaterialNames[manufacturer].push(coreMaterialNamesHandle.get(i));
                    }
                }
                // coreMaterialNames[manufacturer] = coreMaterialNames[manufacturer].sort();
            })
            setTimeout(() => {this.coreMaterialsGotten(true, coreMaterialNames);}, 10);
        },

        coreLossesCalculated(success = true, dataOrMessage = '') {
        },

        async calculateCoreLosses(magnetic, inputs, operatingPointIndex, modelsData) {
            if (magnetic.core['functionalDescription']['shape'] != "" && magnetic.core['functionalDescription']['material'] != "") {
                const mkf = await waitForMkf();
                await mkf.ready;

                var coreTemperatureDependantParametersData;
                var magnetizingInductance;
                var coreLossesData;
                var magnetizingInductanceCheck;

                {
                    const result = mkf.get_core_temperature_dependant_parameters(JSON.stringify(magnetic.core), inputs.operatingPoints[operatingPointIndex].conditions.ambientTemperature);
                    if (result.startsWith("Exception")) {
                        setTimeout(() => {this.coreLossesCalculated(false, result);}, 100);
                    }
                    else {
                        coreTemperatureDependantParametersData = JSON.parse(result);
                    }
                }

                {
                    const result = mkf.calculate_inductance_from_number_turns_and_gapping(JSON.stringify(magnetic.core), JSON.stringify(magnetic.coil), JSON.stringify(inputs.operatingPoints[operatingPointIndex]), JSON.stringify(modelsData));
                    if (result == -1) {
                        setTimeout(() => {this.coreLossesCalculated(false, result);}, 100);
                    }
                    else {
                        magnetizingInductance = JSON.parse(result);
                    }
                }

                {
                    const result = mkf.calculate_core_losses(JSON.stringify(magnetic.core), JSON.stringify(magnetic.coil), JSON.stringify(inputs), JSON.stringify(modelsData), operatingPointIndex);
                    if (result.startsWith("Exception")) {
                        setTimeout(() => {this.coreLossesCalculated(false, result);}, 100);
                    }
                    else {
                        coreLossesData = JSON.parse(result);
                    }
                }

                {
                    magnetizingInductanceCheck = mkf.check_requirement(JSON.stringify(inputs.designRequirements.magnetizingInductance), magnetizingInductance);

                }
                const data = {
                    coreTemperatureDependantParametersData: coreTemperatureDependantParametersData,
                    magnetizingInductance: magnetizingInductance,
                    coreLossesData: coreLossesData,
                    magnetizingInductanceCheck: magnetizingInductanceCheck,
                };

                setTimeout(() => {this.coreLossesCalculated(true, data);}, 100);
            }
        },

        coreMaterialChanged(success = true, dataOrMessage = '') {
        },

        async changeCoreMaterial(materialName, core) {
            core.functionalDescription.material = materialName;
            core.name = "Custom";
            core.manufacturerInfo = null;
            core.geometricalDescription.forEach((elem) => {
                if (elem.type == "half set") {
                    elem.material = materialName;
                }
            })
            setTimeout(() => {this.coreMaterialChanged(true, core);}, 100);
        },

        bobbinFromCoreShapeGenerated(success = true, dataOrMessage = '') {
        },

        async generateBobbinFromCoreShape(core, wiringTechnology) {
            const mkf = await waitForMkf();
            await mkf.ready;

            var bobbinResult = "";
            if (wiringTechnology == "Printed") {
                bobbinResult = mkf.create_simple_bobbin_from_core_with_custom_thickness(JSON.stringify(core), 0);
            }
            else {
                bobbinResult = mkf.create_simple_bobbin_from_core(JSON.stringify(core));
            }
            if (bobbinResult.startsWith("Exception")) {
                setTimeout(() => {this.bobbinFromCoreShapeGenerated(false, bobbinResult);}, 100);
            }
            else {
                setTimeout(() => {this.bobbinFromCoreShapeGenerated(true, JSON.parse(bobbinResult));}, 100);
            }
        },

        coreAdvised(success = true, dataOrMessage = '') {
        },

        async adviseCore(inputs, hasCurrentApplicationMirroredWindings, coreAdviserWeights, adviserSettings) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const settings = JSON.parse(mkf.get_settings());
                console.log("Mierda 1")

            if (hasCurrentApplicationMirroredWindings) {
                settings["coreIncludeDistributedGaps"] = false;
                settings["coreIncludeMargin"] = true;
                settings["coreIncludeStacks"] = true;
                settings["useToroidalCores"] = true;
                settings["useConcentricCores"] = false;
                settings["useOnlyCoresInStock"] = false;
            }
            else {
                settings["coreIncludeDistributedGaps"] = adviserSettings.allowDistributedGaps;
                settings["coreIncludeMargin"] = true;
                settings["coreIncludeStacks"] = adviserSettings.allowStacks;
                settings["useToroidalCores"] = adviserSettings.allowToroidalCores;
                settings["useOnlyCoresInStock"] = false;
            }
            mkf.set_settings(JSON.stringify(settings));

            const result = mkf.calculate_advised_cores(JSON.stringify(inputs), JSON.stringify(coreAdviserWeights), 1, adviserSettings.coreAdviseMode);
                console.log("Mierda 3")
            if (result.startsWith("Exception")) {
                setTimeout(() => {this.coreAdvised(false, result);}, 100);
            }

            const aux = JSON.parse(result);

            var log = aux["log"];
            var data = aux["data"];
            if (data.length > 0) {
                setTimeout(() => {this.coreAdvised(true, data[0].mas.magnetic);}, 100);
            }
        },

        dimensionWithToleranceResolved(success = true, dataOrMessage = '') {
        },

        async resolveDimensionWithTolerance(dimensionWithTolerance) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const dimension = mkf.resolve_dimension_with_tolerance(JSON.stringify(dimensionWithTolerance));

            this.dimensionWithToleranceResolved(true, dimension);
            return dimension;
        },

        numberTurnsCalculated(success = true, dataOrMessage = '') {
        },

        async calculateNumberTurns(numberTurnsPrimary, designRequirements) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const numberTurns = [];
            const numberTurnsHandle = mkf.calculate_number_turns(numberTurnsPrimary, JSON.stringify(designRequirements));

            for (var i = 0; i < numberTurnsHandle.size(); i++) {
                numberTurns.push(numberTurnsHandle.get(i));
            }

            setTimeout(() => {this.numberTurnsCalculated(true, numberTurns);}, 100);
        },

        complexPermeabilityGotten(success = true, dataOrMessage = '') {
        },

        async getComplexPermeability(material) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const complexPermeabilityResult = mkf.calculate_complex_permeability(JSON.stringify(material));

            if (complexPermeabilityResult.startsWith("Exception")) {
                setTimeout(() => {this.complexPermeabilityGotten(false, complexPermeabilityResult);}, 100);
            }
            else {
                setTimeout(() => {this.complexPermeabilityGotten(true, JSON.parse(complexPermeabilityResult));}, 100);
            }
        },

        defaultGotten(success = true, dataOrMessage = '') {
        },

        async getDefaults() {
            const mkf = await waitForMkf();
            await mkf.ready;

            const result = mkf.get_defaults();
            setTimeout(() => {this.defaultGotten(true, result);}, 100);
            return result;
        },
    }
})
