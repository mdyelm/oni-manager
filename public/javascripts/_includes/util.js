
module.exports.getEnvCodeById = function(id, envData){
    // 共通はNULLになる。NULLはid=1のデータを使う(topics関連)
    if (!id) var id = 1;

    return envData.filter(function(item){
        return item.id == id;
    })[0].code;
}

module.exports.doubleDigit = function( val ){
    val = parseInt(val); // 一桁に戻す
    return ("0" + String(val) ).slice(-2); // ２桁に変換
}
