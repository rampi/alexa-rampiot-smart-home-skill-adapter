var async = require('asyncawait/async');
var await = require('asyncawait/await');
var request = require('request');
var config = require("./../config/configuration.json");
var Q = require('q');

/**
 * Request token to amazon LWT using code, with returned token rampiot can send events to alexa event gateway
*/
var requestAccessToken = function(code, clientId, clientSecret, callback){
    var deferred = Q.defer();
    var credentials = new Buffer(clientId+":"+clientSecret).toString('base64');    
    var fData = "grant_type=authorization_code&code="+code;
    var cLength = fData.length;
    var options = {
        uri: config.lwtTokenURL,
        method: 'POST',
        headers:{
            'Content-Length': cLength,
            'Authorization': "Basic "+credentials,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: fData
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

exports.requestTokensToLWT = async(function(code, clientId, clientSecret){
    return await(requestAccessToken(code, clientId, clientSecret));
});