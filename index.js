/* jshint node: true */
"use strict";

var async = require('asyncawait/async');
var await = require('asyncawait/await');
var Utils = require("./utils/utils");
var AdapterFactory = require("./adapters/adapter-factory");
var DiscoveryHelper = require("./utils/discovery-helper");
var RampiotDeviceFactory = require("./rampiot-devices/rampiot-device-factory");
var TokenDAO = require("./dao/token-dao").TokenDAO;
var LWTAuth = require("./oauth2/lwt-oauth2-token-client");
var Logger = Utils.Logger;
var RampiotClient = require("./service/rampiot-client").RampiotClient;
var rampiotClient = new RampiotClient();
var currentUser = null;
var TOKEN = null;

var handleDiscovery = async(function(event, context, callback){
    try{
        Logger.logDebug("Starting Discovery...");        
        var response = {
            "event": {
                "header": {
                    "namespace": "Alexa.Discovery",
                    "name": "Discover.Response",
                    "payloadVersion": "3",
                    "messageId": Utils.createMessageId()
                }
            }
        };
        Logger.logDebug("Token: "+TOKEN);
        var things = await( rampiotClient.getThingsByToken(TOKEN) );
        Logger.logDebug("Things: "+JSON.stringify(things));
        if( things && things.length > 0 ){
            var discoveredDevices = [];
            things.forEach(function(thingData){
                if( DiscoveryHelper.isDeviceAlexaCompatible(thingData._id.type._id) ){
                    thingData.list.forEach(function(thing){
                        var alexaDevice = DiscoveryHelper.getAlexaDeviceInfo(thingData, thing);                        
                        discoveredDevices.push(alexaDevice);
                    });
                }            
            });
            response.event.payload = {
                "endpoints": discoveredDevices
            };
            Logger.logDebug("Discovery Response: "+JSON.stringify(response));
            callback(null, response);
        }
    }catch(exc){
        Logger.logError(exc);
        callback(exc);
    }    
});

var handleControl = async(function(event, context, callback){
    var Adapter = AdapterFactory.getAdapter(event.directive.header.namespace);     
    try{
        Logger.logDebug("Starting Control...");
        Logger.logDebug("EndpointId: "+event.directive.endpoint.endpointId);
        Logger.logDebug("Token: "+TOKEN);
        Logger.logDebug("Namespace: "+event.directive.header.namespace);
        Logger.logDebug("Action: "+event.directive.header.name);        
        var request = await(Adapter.adaptRequest(event, context));        
        var resp = await(
            rampiotClient.fireAlexaThingEvent(
                event.directive.endpoint.endpointId,
                TOKEN,
                request
            )
        );
        Logger.logDebug("Service response: "+JSON.stringify(resp));
        var response = await(Adapter.adaptResponse(event, context, resp));
        Logger.logDebug("Control Response: "+JSON.stringify(response));
        callback(null, response);
    }catch(exc){
        Logger.logError(exc);
        /*Device already in requested status*/
        if( exc.code && exc.code === 1057 ){
            var rsp = await(Adapter.adaptResponse(event, context, exc));
            callback(null, rsp);
        }else{
            callback(exc);   
        }        
    }
});

var handleStateReporting = async(function(event, context, callback){
    try{
        Logger.logDebug("Starting State Report...");
        Logger.logDebug("EndpointId: "+event.directive.endpoint.endpointId);
        Logger.logDebug("Token: "+TOKEN);
        Logger.logDebug("Namespace: "+event.directive.header.namespace);
        Logger.logDebug("Action: "+event.directive.header.name);                        
        var resp = await( rampiotClient.getThingById(event.directive.endpoint.endpointId, TOKEN) );
        Logger.logDebug("Service response: "+JSON.stringify(resp));
        var thingType = resp.thing.type._id;
        Logger.logDebug("ThingType: "+thingType);
        var deviceInfo = RampiotDeviceFactory.getRampiotDeviceInfo(thingType);
        var stateReport = deviceInfo.getStateReport(resp.thing, event.directive.header.correlationToken);
        Logger.logDebug("State Report: "+JSON.stringify(stateReport));
        callback(null, stateReport);
    }catch(exc){
        Logger.logError(exc);
        callback(exc);
    }
});

var handleAuthorization = async(function(event, context, callback){
    try{        
        Logger.logDebug("Starting Authorization Handler");
        Logger.logDebug("Code: "+event.directive.payload.grant.code);
        Logger.logDebug("ClientId: "+process.env.CLIENT_ID);
        Logger.logDebug("ClientSecret: "+process.env.CLIENT_SECRET);        
        var tokens = await( LWTAuth.requestTokensToLWT(event.directive.payload.grant.code, process.env.CLIENT_ID, process.env.CLIENT_SECRET) );
        Logger.logDebug("Request token response: "+JSON.stringify(tokens));
        var tokenDao = new TokenDAO();
        await(
            tokenDao.addToTokenTable(
                process.env.CLIENT_ID, process.env.CLIENT_SECRET, 
                tokens.token_type, tokens.access_token, 
                tokens.refresh_token, tokens.expires_in
            )
        );
        Logger.logDebug("Authorization OK");
        callback(null, {
            "event": {
              "header": {
                "messageId": Utils.createMessageId(),
                "namespace": "Alexa.Authorization",
                "name": "AcceptGrant.Response",
                "payloadVersion": "3"
              },
              "payload": {}
            }
        });
    }catch(exc){
        Logger.logError(exc);
        callback(null, {
            "event": {
                "header": {
                "messageId": Utils.createMessageId(),
                "namespace": "Alexa.Authorization",
                "name": "ErrorResponse",
                "payloadVersion": "3"
                },
                "payload": {
                "type": "ACCEPT_GRANT_FAILED",
                "message": exc
                }
            }
        });
    }    
});

exports.handler = async(function(event, context, callback){
    Logger.logDebug("Event: "+JSON.stringify(event));
    if ( event.directive.header.namespace !== "Alexa.Authorization" ) {
        try{
            TOKEN = event.directive.payload.scope ? event.directive.payload.scope.token : event.directive.endpoint.scope.token;
            var user = await( rampiotClient.getOwnerInfo(TOKEN) );
            currentUser = user.info;
            Logger.logDebug("UserId: "+currentUser.userId);   
            if ( event.directive.header.namespace === "Alexa.Discovery" ) {
                handleDiscovery(event, context, callback);
            }
            else if( event.directive.header.namespace === "Alexa" && event.directive.header.name === "ReportState" ){            
                handleStateReporting(event, context, callback);
            }
            else{
                handleControl(event, context, callback);
            }
        }catch(exc){
            Logger.logError(exc);
            callback(exc);
        }
    }
    else {
        handleAuthorization(event, context, callback);
    }    
});