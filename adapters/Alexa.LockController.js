var async = require('asyncawait/async');
var await = require('asyncawait/await');
var Utils = require("./../utils/utils");
var TokenDAO = require("./../dao/token-dao").TokenDAO;
var AlexaEventGatewayResolver = require("./../service/event-gateway-resolver");
var RESPONSE_TEMPLATE = 
{
    "context": {
        "properties": []
    },
    "event": {
        "header": {
            "namespace": "Alexa",
            "name": "Response",
            "payloadVersion": "3"            
        },
        "endpoint": {},
        "payload": {}
    }
};

/*
    Adapt PowerController request to rampiot switch event
*/
exports.adaptRequest = async(function(event, context){
    /*Preparing device event listener for sent device feedback to event gateway */
    var response = RESPONSE_TEMPLATE;
    response.context.properties = [
        {
            "namespace": "Alexa.EndpointHealth",
            "name": "connectivity",
            "value": {
                "value": "OK"
            },
            "timeOfSample": new Date().toISOString(),
            "uncertaintyInMilliseconds": 500
        },
        {
            "namespace": "Alexa.LockController",
            "name": "lockState",
            "value": event.directive.header.name === "Lock" ? "LOCKED" : "UNLOCKED",
            "timeOfSample": new Date().toISOString(),
            "uncertaintyInMilliseconds": 500
        }
    ];
    var tokenDao = new TokenDAO();
    var token = await( tokenDao.getCurrentToken(process.env.CLIENT_ID) );
    response.event.header.messageId = Utils.createMessageId();
    response.event.header.correlationToken = event.directive.header.correlationToken;
    response.event.endpoint.endpointId = event.directive.endpoint.endpointId;
    response.event.endpoint.scope = {
        type: "BearerToken",
        token: token
    };
    var errorResponse = Utils.generateErrorResponse(
        event.directive.header.correlationToken, 
        event.directive.endpoint.endpointId, 
        {
            type: "INVALID_VALUE"
        }
    );
    errorResponse.event.endpoint.scope = {
        type: "BearerToken",
        token: token
    };
    await(AlexaEventGatewayResolver.resolve({            
            event: event.directive.header.name === "Lock" ? "lock" : "unlock"
        },
        errorResponse,
        response,
        token,
        event.directive.payload.scope ? event.directive.payload.scope.token : event.directive.endpoint.scope.token,
        event.directive.endpoint.endpointId
    ));

    /**Getting adapted request*/
    switch( event.directive.header.name ){
        case "Lock":
            return {
                "event": "lock"
            };
        case "Unlock":
            return {
                "event": "unlock"
            };
    }

});

/*
    Adapt rampiot thing to LockerController and EndpointHealth
*/
exports.adaptResponse = async(function(event, context, serviceResponse, callback){        
    if( serviceResponse && serviceResponse.code && serviceResponse.code === 1057 ){
        var response = RESPONSE_TEMPLATE;
        response.context.properties = [
            {
                "namespace": "Alexa.EndpointHealth",
                "name": "connectivity",
                "value": {
                    "value": "OK"
                },
                "timeOfSample": new Date().toISOString(),
                "uncertaintyInMilliseconds": 500
            },
            {
                "namespace": "Alexa.LockController",
                "name": "lockState",
                "value": event.directive.header.name === "Lock" ? "LOCKED" : "UNLOCKED",
                "timeOfSample": new Date().toISOString(),
                "uncertaintyInMilliseconds": 500
            }
        ];
        var tokenDao = new TokenDAO();
        var token = await( tokenDao.getCurrentToken(process.env.CLIENT_ID) );
        response.event.header.messageId = Utils.createMessageId();
        response.event.header.correlationToken = event.directive.header.correlationToken;
        response.event.endpoint.endpointId = event.directive.endpoint.endpointId;
        return response;
    }
    /*Return deferred response because the real response will be send to alexa event gateway*/
    var deferredResponse = {
        "event": {
            "header": {
                "namespace": "Alexa",
                "name": "DeferredResponse",
                "messageId": Utils.createMessageId(),
                "correlationToken": event.directive.header.correlationToken,
                "payloadVersion": "3"
            },
            "payload": {
                "estimatedDeferralInSeconds": 7
            }
        }
    };
    return deferredResponse;    
});