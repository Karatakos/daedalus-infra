"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.arrayDiff=void 0;function arrayDiff(oldValues,newValues){const deletes=new Set(oldValues),adds=new Set;for(const v of new Set(newValues))deletes.has(v)?deletes.delete(v):adds.add(v);return{adds:Array.from(adds),deletes:Array.from(deletes)}}exports.arrayDiff=arrayDiff;
//# sourceMappingURL=diff.js.map
