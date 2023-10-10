"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.handler=void 0;const consts_1=require("./consts");async function handler(event){if(event.ResourceType===consts_1.CfnUtilsResourceType.CFN_JSON)return cfnJsonHandler(event);if(event.ResourceType===consts_1.CfnUtilsResourceType.CFN_JSON_STRINGIFY)return cfnJsonStringifyHandler(event);throw new Error(`unexpected resource type "${event.ResourceType}`)}exports.handler=handler;function cfnJsonHandler(event){return{Data:{Value:JSON.parse(event.ResourceProperties.Value)}}}function cfnJsonStringifyHandler(event){return{Data:{Value:JSON.stringify(event.ResourceProperties.Value)}}}
