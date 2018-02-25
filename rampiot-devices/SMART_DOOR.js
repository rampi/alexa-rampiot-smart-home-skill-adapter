/* jshint node: true */
"use strict";
/*
    This file map and adapt rampiot device to alexa device and viceversa, this helps on device discovering,
    device control and state report
*/

var Utils = require("./../utils/utils");

/*
    Qualified name of rampiot device type device 
*/
exports.getThingType = function(){
    return "SMART_DOOR";
};

/*
    Alexa interface that allows control of lock/unlock feature of smart door
*/
exports.getInterFace = function(){
    return "Alexa.LockController";
};

/*
    State report adapted response
*/
exports.getStateReport = function(thing, correlationToken){
    return {
        "context": {
            "properties": [
                {
                    "namespace": "Alexa.LockController",
                    "name": "lockState",
                    "value": thing.status.state === "closed_locked" ? "LOCKED" : "UNLOCKED",
                    "timeOfSample": new Date().toISOString(),
                    "uncertaintyInMilliseconds": 3000
                },
                {
                    "namespace": "Alexa.EndpointHealth",
                    "name": "connectivity",
                    "value": {
                        "value": thing.connected ? "OK" : "UNREACHABLE"
                    },
                    "timeOfSample": new Date().toISOString(),
                    "uncertaintyInMilliseconds": 3000
                }                
            ]
        },
        "event": {
            "header": {
                "namespace": "Alexa",
                "name": "StateReport",
                "payloadVersion": "3",
                "messageId": Utils.createMessageId(),
                "correlationToken": correlationToken
            },
            "endpoint": {
                "endpointId": thing._id
            },
            "payload": {}
        }
    };    
};

/*
    Mapping of rampiot to alexa capabilities for allow control from alexa smart home skill
    this method returns capabilities for alexa smart home skill
*/
exports.getCapabilities = function(){
    return [{
        "type": "AlexaInterface",
        "interface": "Alexa",
        "version": "3"
    },
    {
        "type":"AlexaInterface",
        "interface":"Alexa.LockController",
        "version":"3",
        "properties":{
           "supported":[
              {
                 "name":"lockState"
              }
           ],
           "proactivelyReported":true,
           "retrievable":true
        }
     },
    {
        "type": "AlexaInterface",
        "interface": "Alexa.EndpointHealth",
        "version": "3",
        "properties": {
            "supported": [
                {
                    "name": "connectivity"
                }
            ],
            "proactivelyReported": false,
            "retrievable": true
        }
    }];
};

/*
    Display categories for right display on alexa app
*/
exports.getDisplayCategories = function(){
    return ["SMARTLOCK"];
};

/*
    Possible actions in alexa, Lock and Unlock
*/
exports.getPossibleAlexaActions = function(){
    return ["Lock", "Unlock"];
};

/*
    Possible actions in rampiot, Lock and Unlock
*/
exports.getPossibleRampiotActions = function(){
    return ["lock", "unlock"];
};

/*
    Possible events in rampiot platform, locked, unlocked, opened, closed and face detected
*/
exports.getPossibleEvents = function(){
    return ["lock", "unlock", "open", "close", "face_detected"];
};