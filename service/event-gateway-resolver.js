var AWS = require('aws-sdk');
var sns = new AWS.SNS();
var Q = require('q');
var config = require("./../config/configuration.json");

exports.resolve = function(expectedDeviceEvent, errorMessage, successMessage, token, userToken, endpointId, callback){
    var deferred = Q.defer();
    var params = {
        Message: JSON.stringify({
            endpointId: endpointId,
            expected: expectedDeviceEvent,
            error: errorMessage,
            success: successMessage,
            token: token,
            userToken: userToken
        }),
        MessageStructure: 'raw',
        Subject: 'sns-event',
        TopicArn: config.topicARNEventGatewayResolver
    };
    sns.publish(params, function(err, data) {
        if( err ){
            deferred.reject(err);
        }else{
            deferred.resolve(data);
        }
    });
    return deferred.promise.nodeify(callback);
};