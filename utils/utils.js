
exports.createMessageId = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

exports.Logger = {
    logDebug: function(msg){
        console.log(msg);
    },
    logError: function(err){
        console.error(err);
    }
};

exports.generateErrorResponse = function(correlationToken, thingId, payload){
    return {
    "event": {
        "header": {
            "namespace": "Alexa",
            "name": "ErrorResponse",
            "messageId": exports.createMessageId(),
            "correlationToken": correlationToken,
            "payloadVersion": "3"
        },
        "endpoint":{               
            "endpointId": thingId
        },
        "payload": payload
        }
    };        
};