// ===================================================
// ANTITHESIS CORE
// Module: id-utils.js
// ===================================================

return {
  createImageId(type = 'image') {
    return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
};