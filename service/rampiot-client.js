var request = require('request');
var Q = require('q');

module.exports.RampiotClient = function(){
    /* Fire an device action */
    this.fireAlexaThingEvent = function(thingId, accessToken, event, callback){
        var deferred = Q.defer();
        var endpoint = process.env.CONTROL_ENDPOINT;
        endpoint = endpoint.replace(":id", thingId);
        var options = {
            uri: endpoint,
            method: 'POST',
            headers:{
                'Authorization': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        };
        request(options, function (error, response, body) {
            var jsonBody = JSON.parse(body);                
            if( error ){
                deferred.reject(error);
            }
            else if(response.statusCode === 200 ){
                deferred.resolve(jsonBody);
            }else{
                deferred.reject(jsonBody);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    /* Get things by token*/
    this.getThingsByToken = function(accessToken, callback){
        var deferred = Q.defer();
        var options = {
            uri: process.env.DISCOVER_ENDPOINT,
            method: 'GET',
            headers:{
                'Authorization': accessToken
            }
        };    
        request(options, function (error, response, body) {
            var jsonBody = JSON.parse(body);
            if( error ){
                deferred.reject(error);
            }
            else if(response.statusCode === 200 ){
                deferred.resolve(
                    jsonBody && jsonBody.things && jsonBody.things.length > 0 ? jsonBody.things : []
                 );
            }else{
                deferred.reject(jsonBody);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    /* Get thing by id*/
    this.getThingById = function(thingId, accessToken, callback){
        var deferred = Q.defer();
        var endpoint = process.env.THING_INFO_ENDPOINT;
        endpoint = endpoint.replace(":id", thingId);
        var options = {
            uri: endpoint, 
            method: 'GET',
            headers:{
                'Authorization': accessToken
            }
        };    
        request(options, function (error, response, body) {
            var jsonBody = JSON.parse(body);
            if( error ){
                deferred.reject(error);
            }
            else if(response.statusCode === 200 ){
                deferred.resolve(jsonBody);
            }else{
                deferred.reject(jsonBody);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    /* Get thing owner info using access token*/
    this.getOwnerInfo = function(accessToken, callback){
        var deferred = Q.defer();
        var options = {
            uri: process.env.OWNER_INFO_ENDPOINT,
            method: 'GET',
            headers:{
                'Authorization': accessToken
            }
        };
        request(options, function (error, response, body) {
            var jsonBody = JSON.parse(body);
            if( error ){
                deferred.reject(error);
            }
            else if(response.statusCode === 200 ){
                deferred.resolve(jsonBody);
            }else{
                deferred.reject(jsonBody);
            }
        });
        return deferred.promise.nodeify(callback);
    };
};