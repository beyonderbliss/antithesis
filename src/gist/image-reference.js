// ===================================================
// ANTITHESIS CORE
// Module: image-reference.js
// Responsibility: image identity + reference identity primitives
// ===================================================

function getImageById(registry, imageId) {
  if (!imageId || !registry) return null;

  return registry[imageId] || null;
}

function registerImage(registry, imageData) {
  if (!imageData || !imageData.id) {
    return registry || {};
  }

  return {
    ...(registry || {}),
    [imageData.id]: imageData
  };
}

function getReferenceIdBySlot(referenceSlotIds, slotIndex) {
  if (
    !Array.isArray(referenceSlotIds) ||
    !Number.isInteger(slotIndex) ||
    slotIndex < 0
  ) {
    return null;
  }

  return referenceSlotIds[slotIndex] || null;
}

function getReferenceEntityBySlot(
  referenceSlotIds,
  registry,
  slotIndex
) {
  const referenceId =
    getReferenceIdBySlot(referenceSlotIds, slotIndex);

  if (!referenceId) return null;

  return getImageById(registry, referenceId);
}

return {
  getImageById,
  registerImage,
  getReferenceIdBySlot,
  getReferenceEntityBySlot
};
