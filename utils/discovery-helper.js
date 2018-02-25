var config = require("./../config/configuration.json");
var RampiotDeviceFactory = require("./../rampiot-devices/rampiot-device-factory");
var ALEXA_COMPATIBLE_RAMPIOT_TYPES = config.ALEXA_COMPATIBLE_RAMPIOT_TYPES;

exports.isDeviceAlexaCompatible = function(thingType){
    return ALEXA_COMPATIBLE_RAMPIOT_TYPES.indexOf(thingType) >= 0;
};

/**Parse rampiot thing to alexa device */
exports.getAlexaDeviceInfo = function(thingData, thing){
    if( exports.isDeviceAlexaCompatible(thingData._id.type._id) ){
        var deviceInfo = RampiotDeviceFactory.getRampiotDeviceInfo(thingData._id.type._id);
        return {            
            "endpointId": thing._id,
            "manufacturerName": "Rampiot",
            "friendlyName": thing.name,
            "description": thingData._id.type.description,
            "displayCategories": deviceInfo.getDisplayCategories(),
            "capabilities": deviceInfo.getCapabilities()
        };
    }
    return null;
};