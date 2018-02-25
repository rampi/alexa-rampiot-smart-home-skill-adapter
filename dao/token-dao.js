var Q = require('q');
var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports.TokenDAO = function(){
    this.getCurrentToken = function(clientId, callback){
        var deferred = Q.defer();
        var params = {
            TableName: "Token",
            Key:{
                "clientId": clientId
            }
        };
        docClient.get(params, function(err, data) {
            if( err ){
                deferred.reject(err);
            }else{
                deferred.resolve(data && data.Item && data.Item.token ? data.Item.token : null);
            }
        });
        return deferred.promise.nodeify(callback);
    };
    /**Save tokens for alexa async events to gateway */
    this.addToTokenTable = function(clientId, clientSecret, tokenType, token, refreshToken, expiresIn, callback){
        var deferred = Q.defer();
        var params = {
            TableName: "Token",
            Item:{
                "clientId": clientId,
                "clientSecret": clientSecret,
                "tokenType": tokenType,
                "token": token,
                "refreshToken": refreshToken,
                "expiresIn": expiresIn
            }
        };
        docClient.put(params, function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise.nodeify(callback);
    };    
};