
exports.getAdapter = function(namespace){
    try{
        return require("./"+namespace);
    }catch(exc){
        throw "Adapter not found";
    }
};