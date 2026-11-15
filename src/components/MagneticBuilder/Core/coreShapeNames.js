// A design may name its core shape by a name the catalogue has since replaced: MAS renames a shape
// and keeps the old name as an alias (ABT #2413: the drum family took its makers' names). MKF
// resolves the alias, but the builder lists shapes by their current names, so a loaded design whose
// shape it cannot find in that list shows an empty shape (ABT #2410). On load, each catalogue shape of
// the core (its functional shape and the shape of each geometrical piece) is given its current name,
// as MKF resolves it (taskQueueStore.getCurrentShapeName, which throws for a name MKF does not know).
// A custom shape (type 'custom') is not in the catalogue and keeps its name.
//
// Returns the renames made, [{ from, to }], once per name.
export async function giveCoreShapesTheirCurrentNames(mas, taskQueueStore) {
    const core = mas?.magnetic?.core;
    if (core == null) return [];
    const renames = new Map();
    const currentName = async (name) => {
        if (!renames.has(name)) {
            renames.set(name, await taskQueueStore.getCurrentShapeName(name));
        }
        return renames.get(name);
    };
    const isCatalogueShape = (shape) => shape.type !== 'custom';

    const functionalDescription = core.functionalDescription;
    const shape = functionalDescription?.shape;
    if (typeof shape === 'string') {
        if (shape.trim() !== '') {
            functionalDescription.shape = await currentName(shape);
        }
    }
    else if (shape != null && typeof shape === 'object' && shape.name != null && isCatalogueShape(shape)) {
        shape.name = await currentName(shape.name);
    }

    for (const piece of Array.isArray(core.geometricalDescription) ? core.geometricalDescription : []) {
        const pieceShape = piece?.shape;
        if (pieceShape != null && typeof pieceShape === 'object' && pieceShape.name != null && isCatalogueShape(pieceShape)) {
            pieceShape.name = await currentName(pieceShape.name);
        }
    }
    return [...renames.entries()].filter(([from, to]) => from !== to).map(([from, to]) => ({ from, to }));
}
