import { defineStore } from 'pinia'
import { waitForMkf } from '/WebSharedComponents/assets/js/mkfRuntime'
import { checkAndFixMas, clean, toTitleCase} from '/WebSharedComponents/assets/js/utils.js'

export const useTaskQueueStore = defineStore('taskQueue', {
    state: () => ({
        task_standard_response_delay: 20
    }),
    actions: {
        masCheckedAndFixed(success = true, dataOrMessage = '') {
        },

        async checkAndFixMas(mas) {
            const mkf = await waitForMkf();
            await mkf.ready;

            checkAndFixMas(mas, mkf).then(response => {
                setTimeout(() => {this.masCheckedAndFixed(true, response)}, this.task_standard_response_delay);
            })
            .catch(error => {
                setTimeout(() => {this.masCheckedAndFixed(false, error)}, this.task_standard_response_delay);
            });
        },

        coreShapeProcessed(success = true, dataOrMessage = '') {
        },

        async processCoreShape(coreShapeName) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const shapeResult = mkf.get_shape_data(coreShapeName)
            if (shapeResult.startsWith('Exception')) {
                setTimeout(() => {this.coreShapeProcessed(false, shapeResult)}, this.task_standard_response_delay);
            }
            else {
                setTimeout(() => {this.coreShapeProcessed(true, JSON.parse(shapeResult))}, this.task_standard_response_delay);
            }
        },

        coreMaterialProcessed(success = true, dataOrMessage = '') {
        },

        async processCoreMaterial(coreMaterialName) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const materialResult = mkf.get_material_data(coreMaterialName)
            if (materialResult.startsWith('Exception')) {
                setTimeout(() => {this.coreMaterialProcessed(false, materialResult)}, this.task_standard_response_delay);
            }
            else {
                setTimeout(() => {this.coreMaterialProcessed(true, JSON.parse(materialResult))}, this.task_standard_response_delay);
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
                setTimeout(() => {this.coreProcessed(false, coreResult);}, this.task_standard_response_delay);
            }
            else {
                const auxCore = JSON.parse(coreResult);
                core.functionalDescription = auxCore.functionalDescription;
                core.processedDescription = auxCore.processedDescription;
                core.geometricalDescription = auxCore.geometricalDescription;
                
                setTimeout(() => {this.coreProcessed(true, core);}, this.task_standard_response_delay);
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

            setTimeout(() => {this.coreShapeFamiliesGotten(true, coreShapeFamilies);}, this.task_standard_response_delay);
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

            setTimeout(() => {this.coreShapeFamilySubtypesGotten(true, availableFamilySubtypes);}, this.task_standard_response_delay);
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
            setTimeout(() => {this.coreShapeFamilyDimensionsGotten(true, dimensions);}, this.task_standard_response_delay);
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
            setTimeout(() => {this.coreShapesGotten(true, coreShapeNames);}, this.task_standard_response_delay);
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
                        setTimeout(() => {this.coreLossesCalculated(false, result);}, this.task_standard_response_delay);
                    }
                    else {
                        coreTemperatureDependantParametersData = JSON.parse(result);
                    }
                }

                {
                    const result = mkf.calculate_inductance_from_number_turns_and_gapping(JSON.stringify(magnetic.core), JSON.stringify(magnetic.coil), JSON.stringify(inputs.operatingPoints[operatingPointIndex]), JSON.stringify(modelsData));
                    if (result == -1) {
                        setTimeout(() => {this.coreLossesCalculated(false, result);}, this.task_standard_response_delay);
                    }
                    else {
                        magnetizingInductance = JSON.parse(result);
                    }
                }

                {
                    const result = mkf.calculate_core_losses(JSON.stringify(magnetic.core), JSON.stringify(magnetic.coil), JSON.stringify(inputs), JSON.stringify(modelsData), operatingPointIndex);
                    if (result.startsWith("Exception")) {
                        setTimeout(() => {this.coreLossesCalculated(false, result);}, this.task_standard_response_delay);
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

                setTimeout(() => {this.coreLossesCalculated(true, data);}, this.task_standard_response_delay);
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
            setTimeout(() => {this.coreMaterialChanged(true, core);}, this.task_standard_response_delay);
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
                setTimeout(() => {this.bobbinFromCoreShapeGenerated(false, bobbinResult);}, this.task_standard_response_delay);
            }
            else {
                setTimeout(() => {this.bobbinFromCoreShapeGenerated(true, JSON.parse(bobbinResult));}, this.task_standard_response_delay);
            }
        },

        coreAdvised(success = true, dataOrMessage = '') {
        },

        async adviseCore(inputs, hasCurrentApplicationMirroredWindings, coreAdviserWeights, adviserSettings) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const settings = JSON.parse(mkf.get_settings());

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
            if (result.startsWith("Exception")) {
                setTimeout(() => {this.coreAdvised(false, result);}, this.task_standard_response_delay);
            }

            const aux = JSON.parse(result);

            var log = aux["log"];
            var data = aux["data"];
            if (data.length > 0) {
                setTimeout(() => {this.coreAdvised(true, data[0].mas.magnetic);}, this.task_standard_response_delay);
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

            setTimeout(() => {this.numberTurnsCalculated(true, numberTurns);}, this.task_standard_response_delay);
        },

        complexPermeabilityGotten(success = true, dataOrMessage = '') {
        },

        async getComplexPermeability(material) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const complexPermeabilityResult = mkf.calculate_complex_permeability(JSON.stringify(material));

            if (complexPermeabilityResult.startsWith("Exception")) {
                setTimeout(() => {this.complexPermeabilityGotten(false, complexPermeabilityResult);}, this.task_standard_response_delay);
            }
            else {
                setTimeout(() => {this.complexPermeabilityGotten(true, JSON.parse(complexPermeabilityResult));}, this.task_standard_response_delay);
            }
        },

        defaultGotten(success = true, dataOrMessage = '') {
        },

        async getDefaults() {
            const mkf = await waitForMkf();
            await mkf.ready;

            const result = mkf.get_defaults();
            setTimeout(() => {this.defaultGotten(true, result);}, this.task_standard_response_delay);
            return result;
        },

        onlyFrequencyDependentIndexesGotten(success = true, dataOrMessage = '') {
        },

        async getOnlyFrequencyDependentIndexes(data) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const stringVector = [];
            data.forEach((elem) => {
                stringVector.push(JSON.stringify(elem));
            })
            var handle = mkf.get_only_frequency_dependent_indexes(JSON.stringify(stringVector));

            const indexes = [];
            for (var i = 0; i < handle.size(); i++) {
                const aux = handle.get(i);
                if (data[aux].frequency != null) {
                    indexes.push(aux);
                }
            }

            this.onlyFrequencyDependentIndexesGotten(true, indexes);
            return indexes;
        },

        onlyMagneticFieldDcBiasDependentIndexesGotten(success = true, dataOrMessage = '') {
        },

        async getOnlyMagneticFieldDcBiasDependentIndexes(data) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const stringVector = [];
            data.forEach((elem) => {
                stringVector.push(JSON.stringify(elem));
            })
            var handle = mkf.get_only_magnetic_field_dc_bias_dependent_indexes(JSON.stringify(stringVector));

            const indexes = [];
            for (var i = 0; i < handle.size(); i++) {
                const aux = handle.get(i);
                if (data[aux].magneticFieldDcBias != null) {
                    indexes.push(aux);
                }
            }

            this.onlyMagneticFieldDcBiasDependentIndexesGotten(true, indexes);
            return indexes;
        },

        onlyTemperatureDependentIndexesGotten(success = true, dataOrMessage = '') {
        },

        async getOnlyTemperatureDependentIndexes(data) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const stringVector = [];
            data.forEach((elem) => {
                stringVector.push(JSON.stringify(elem));
            })
            var handle = mkf.get_only_temperature_dependent_indexes(JSON.stringify(stringVector));

            const indexes = [];
            for (var i = 0; i < handle.size(); i++) {
                const aux = handle.get(i);
                indexes.push(aux);
            }

            this.onlyMagneticFieldDcBiasDependentIndexesGotten(true, indexes);
            return indexes;
        },

        initialPermeabilityEquationsGotten(success = true, dataOrMessage = '') {
        },

        async getInitialPermeabilityEquations(data) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const handle = mkf.get_initial_permeability_equations(JSON.stringify(data));

            this.initialPermeabilityEquationsGotten(true, handle);
            return handle;
        },

        coreVolumetricLossesEquationsGotten(success = true, dataOrMessage = '') {
        },

        async getCoreVolumetricLossesEquations(data) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const handle = mkf.get_core_volumetric_losses_equations(JSON.stringify(data));

            this.coreVolumetricLossesEquationsGotten(true, handle);
            return handle;
        },

        requirementChecked(success = true, dataOrMessage = '') {
        },

        async checkRequirement(requirement, value) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const requirementCheckResult = mkf.check_requirement(JSON.stringify(requirement), value);

            this.coreVolumetricLossesEquationsGotten(true, requirementCheckResult);
            return requirementCheckResult;
        },

        wireDataCalculated(success = true, dataOrMessage = '') {
        },

        async calculateWireData(coil, operatingPoints, windingIndex) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wire = this.masStore.mas.magnetic.coil.functionalDescription[windingIndex].wire;

            const wireString = JSON.stringify(wire);
            const currentString = JSON.stringify(operatingPoints.excitationsPerWinding[windingIndex].current);
            var wireMaterial = wireMaterialDefault;
            if (wire.material != null) {
                wireMaterial = wire.material;
            }

            data = {};

            data.turnsRatio = coil.functionalDescription[0].numberTurns / coil.functionalDescription[windingIndex].numberTurns;
            data.dcResistancePerMeter = mkf.calculate_dc_resistance_per_meter(wireString, operatingPoints.conditions.ambientTemperature);
            data.skinAcResistancePerMeter = mkf.calculate_skin_ac_resistance_per_meter(wireString, currentString, operatingPoints.conditions.ambientTemperature);
            data.skinAcFactor = mkf.calculate_skin_ac_factor(wireString, currentString, operatingPoints.conditions.ambientTemperature);
            data.dcLossesPerMeter = mkf.calculate_dc_losses_per_meter(wireString, currentString, operatingPoints.conditions.ambientTemperature);
            data.skinAcLossesPerMeter = mkf.calculate_skin_ac_losses_per_meter(wireString, currentString, operatingPoints.conditions.ambientTemperature);
            const outerDimensionsHandle = mkf.get_outer_dimensions(wireString);
            data.outerDimensions = [outerDimensionsHandle.get(0), outerDimensionsHandle.get(1)];
            data.effectiveCurrentDensity = mkf.calculate_effective_current_density(wireString, currentString, operatingPoints.conditions.ambientTemperature) / 1000000 / coil.functionalDescription[windingIndex].numberParallels;
            data.effectiveSkinDepth = mkf.calculate_effective_skin_depth(wireMaterial, currentString, operatingPoints.conditions.ambientTemperature);        

            this.wireDataCalculated(true, data);
        },

        wireProcessed(success = true, dataOrMessage = '') {
        },

        async processWire(winding) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wireResult = mkf.get_wire_data(JSON.stringify(winding))

            if (wireResult.startsWith('Exception')) {
                setTimeout(() => {this.wireProcessed(false, wireResult);}, this.task_standard_response_delay);
            }
            else {
                const wire = JSON.parse(wireResult);

                setTimeout(() => {this.wireProcessed(true, wire);}, this.task_standard_response_delay);
            }
        },

        wireCoatingLabelGotten(success = true, dataOrMessage = '') {
        },

        async getWireCoatingLabel(wire) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const coatingLabel = mkf.get_coating_label(JSON.stringify(wire));
            setTimeout(() => {this.wireCoatingLabelGotten(true, coatingLabel);}, this.task_standard_response_delay);
            return coatingLabel;
        },

        wireByNameGotten(success = true, dataOrMessage = '') {
        },

        async getWireByName(wireName) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wire = mkf.get_wire_data_by_name(JSON.stringify(wireName));
            setTimeout(() => {this.wireDataByNameGotten(true, wire);}, this.task_standard_response_delay);
            return wire;
        },

        newWireCreated(success = true, dataOrMessage = '') {
        },

        async createNewWire(newWireDataDict, oldWire) {
            const mkf = await waitForMkf();
            await mkf.ready;

            // So the outer diameter gets updated for Litz
            if (newWireDataDict["type"] == "litz") {
                if (typeof(oldWire) != "string") {
                    oldWire.strand = newWireDataDict["litzStrandConductingDiameter"];
                    oldWire.outerDiameter = null;
                }
            }

            var wire = {};

            if (oldWire != "" && oldWire != "Dummy") {
                wire = oldWire;
            }
            var coating = null;
            if (newWireDataDict["coating"] != null) {
                coating = JSON.parse(mkf.get_wire_coating_by_label(newWireDataDict["coating"]));
            }

            wire.standard = "IEC 60317";

            if (newWireDataDict["type"] == "round") {

                if (newWireDataDict["standard"] != null) {
                    wire.standard = newWireDataDict["standard"];
                }
                wire = JSON.parse(mkf.get_wire_data_by_standard_name(newWireDataDict["roundConductingDiameter"]));
            }
            else if (newWireDataDict["type"] == "litz") {
                if (newWireDataDict["standard"] != null) {
                    wire.standard = newWireDataDict["standard"];
                }
                wire.type = "litz";

                if (typeof(wire.strand) == "string" || wire.strand == null || (wire.strand != null && wire.strand.coating == null)) {
                    wire.strand = JSON.parse(mkf.get_wire_data_by_standard_name(newWireDataDict["litzStrandConductingDiameter"]));
                }
                wire.numberConductors = newWireDataDict["numberConductors"];
                if (coating != null) {
                    if (wire.outerDiameter == null) {
                        wire.outerDiameter = {};
                    }

                    if (wire.outerDiameter.nominal == null && (wire.outerDiameter.minimum != null || wire.outerDiameter.maximum != null)) {
                        wire.outerDiameter.nominal = mkf.resolve_dimension_with_tolerance(JSON.stringify(wire.outerDiameter));  
                    }
                    if (wire.outerDiameter.nominal == null && wire.outerDiameter.minimum == null && wire.outerDiameter.maximum == null) {
                        var strandConductingDiameter = mkf.resolve_dimension_with_tolerance(JSON.stringify(wire.strand.conductingDiameter));  
                        if (coating.type == "bare") {
                            wire.outerDiameter.nominal = mkf.get_wire_outer_diameter_bare_litz(strandConductingDiameter, wire.numberConductors, wire.strand.coating.grade, wire.standard);
                        }
                        if (coating.type == "served") {
                            wire.outerDiameter.nominal = mkf.get_wire_outer_diameter_served_litz(strandConductingDiameter, wire.numberConductors, wire.strand.coating.grade, coating.numberLayers, wire.standard);
                        }
                        if (coating.type == "insulated") {
                            wire.outerDiameter.nominal = mkf.get_wire_outer_diameter_insulated_litz(strandConductingDiameter, wire.numberConductors, coating.numberLayers, coating.thicknessLayers, wire.strand.coating.grade, wire.standard);
                        }
                    }

                }
            }
            else if (newWireDataDict["type"] == "rectangular") {
                wire.type = "rectangular";
                if (wire.conductingHeight == null) {
                    wire.conductingHeight = {};
                }
                if (wire.conductingWidth == null) {
                    wire.conductingWidth = {};
                }
                wire.conductingHeight.nominal = newWireDataDict["rectangularConductingHeight"];
                wire.conductingWidth.nominal = newWireDataDict["rectangularConductingWidth"];
                wire.numberConductors = 1;
                if (coating != null) {
                    if (wire.outerHeight == null) {
                        wire.outerHeight = {};
                    }
                    if (wire.outerWidth == null) {
                        wire.outerWidth = {};
                    }
                    wire.outerHeight.nominal = mkf.get_wire_outer_height_rectangular(newWireDataDict["rectangularConductingHeight"], coating.grade, wire.standard);
                    wire.outerWidth.nominal = mkf.get_wire_outer_width_rectangular(newWireDataDict["rectangularConductingWidth"], coating.grade, wire.standard);
                }
            }
            else if (newWireDataDict["type"] == "foil") {
                wire.type = "foil";
                if (wire.conductingHeight == null) {
                    wire.conductingHeight = {};
                }
                if (wire.conductingWidth == null) {
                    wire.conductingWidth = {};
                }
                wire.conductingHeight.nominal = newWireDataDict["foilConductingHeight"];
                wire.conductingWidth.nominal = newWireDataDict["foilConductingWidth"];
                wire.numberConductors = 1;
                if (coating != null) {
                    if (wire.outerHeight == null) {
                        wire.outerHeight = {};
                    }
                    if (wire.outerWidth == null) {
                        wire.outerWidth = {};
                    }
                    wire.outerHeight.nominal = wire.conductingHeight.nominal;
                    wire.outerWidth.nominal = wire.conductingWidth.nominal;
                }
            }

            wire.coating = coating;
            wire.material = "copper";
            wire = clean(wire);
            setTimeout(() => {this.newWireCreated(true, wire);}, this.task_standard_response_delay);
        },

        availableWiresGotten(success = true, dataOrMessage = '') {
        },

        async getAvailableWires() {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wireTypes = {};
            const wireTypesHandle = mkf.get_available_wire_types();
            for (var i = wireTypesHandle.size() - 1; i >= 0; i--) {
                const type = wireTypesHandle.get(i);
                wireTypes[type] = toTitleCase(type);
            }

            setTimeout(() => {this.availableWiresGotten(true, wireTypes);}, this.task_standard_response_delay);
            return wireTypes;
        },

        availableStandardsGotten(success = true, dataOrMessage = '') {
        },

        async getAvailableWireStandards() {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wireStandardsHandle = mkf.get_available_wire_standards();
            const wireStandards = [];
            for (var i = wireStandardsHandle.size() - 1; i >= 0; i--) {
                const standard = wireStandardsHandle.get(i);
                wireStandards.push(standard);
            }

            setTimeout(() => {this.availableStandardsGotten(true, wireStandards);}, this.task_standard_response_delay);
            return wireStandards;
        },

        uniqueWireDiametersGotten(success = true, dataOrMessage = '') {
        },

        async getUniqueWireDiameters(standard) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const aux = {};
            const wireConductingDiametersHandle = mkf.get_unique_wire_diameters(JSON.stringify(standard));
            for (var i = wireConductingDiametersHandle.size() - 1; i >= 0; i--) {
                const wireDiameter = wireConductingDiametersHandle.get(i);
                const key = Number(wireDiameter.split(" ")[0]);
                aux[key] = wireDiameter;
            }
            let orderedKeys = Object.keys(aux).sort(function(a, b) {
                return a - b;
            })
            const wireConductingDiameters = [];
            orderedKeys.forEach((key) => {
                wireConductingDiameters.push(aux[key]);
            });

            setTimeout(() => {this.uniqueWireDiametersGotten(true, wireConductingDiameters);}, this.task_standard_response_delay);
            return wireConductingDiameters;
        },

        coatingLabelsByTypeGotten(success = true, dataOrMessage = '') {
        },

        async getCoatingLabelsByType(wireType) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wireCoatingsHandle = mkf.get_coating_labels_by_type(JSON.stringify(wireType));

            const wireCoatings = [];
            for (var i = wireCoatingsHandle.size() - 1; i >= 0; i--) {
                const wireCoating = wireCoatingsHandle.get(i);
                wireCoatings.push(wireCoating);
            }

            setTimeout(() => {this.coatingLabelsByTypeGotten(true, wireCoatings);}, this.task_standard_response_delay);
            return wireCoatings;
        },

        equivalentWireCalculated(success = true, dataOrMessage = '') {
        },

        async calculateEquivalentWire(oldWire, newType, effectiveFrequency) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const wireString = this.$mkf.get_equivalent_wire(JSON.stringify(oldWire), JSON.stringify(newType), effectiveFrequency);

            if (wireString.startsWith("Exception")) {
                setTimeout(() => {this.equivalentWireCalculated(false, wireString);}, this.task_standard_response_delay);
                return wireString;
            }
            else {
                const wire = JSON.parse(wireString);
                setTimeout(() => {this.equivalentWireCalculated(true, wire);}, this.task_standard_response_delay);
                return wire;
            }
        },

        equivalentWireCalculated(success = true, dataOrMessage = '') {
        },

        async calculateEquivalentWire(mas) {
            const mkf = await waitForMkf();
            await mkf.ready;

            const resultMasWithCoil = mkf.calculate_advised_coil(JSON.stringify(mas));
            if (resultMasWithCoil.startsWith("Exception")) {
                this.errorMessage = "Our advisers could not find a wire. Sorry, you are on your own!";
                setTimeout(() => {this.errorMessage = ""}, 10000);
                this.loading = false;
                console.error(resultMasWithCoil);
                return;
            }
            const masWithCoil = JSON.parse(resultMasWithCoil);

            if (wireString.startsWith("Exception")) {
                setTimeout(() => {this.equivalentWireCalculated(false, wireString);}, this.task_standard_response_delay);
                return wireString;
            }
            else {
                const wire = JSON.parse(wireString);
                setTimeout(() => {this.equivalentWireCalculated(true, wire);}, this.task_standard_response_delay);
                return wire;
            }
        },
    }
})
