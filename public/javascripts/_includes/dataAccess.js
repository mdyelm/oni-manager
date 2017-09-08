////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var util = require("./util.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = {

    // ---------------------------------------------------------------------------------
    // 言語・OSでフィルタ
    // ---------------------------------------------------------------------------------
    getListDataByEnv: function( languageId, osId, listObject ){
        var data = onidenAdmin.data;

        var currentLanguageCode = util.getEnvCodeById(languageId, data.languages);
        var currentOSCode = util.getEnvCodeById(osId, data.os);

        return listObject[currentLanguageCode][currentOSCode];

    },
    // ---------------------------------------------------------------------------------
    // リストからIDによるデータ抽出
    // ---------------------------------------------------------------------------------
    getSingleData: function( options ){

        var defaultOptions = {
            data: null,
            id: null,
            osId: null,
            languageId: null,
        }
        var options = Object.assign(defaultOptions, options);

        // 言語OSがある場合は言語・OSで対象リストを絞る
        if ( options.osId != null && options.languageId != null ) {
            var currentDataList = this.getListDataByEnv( options.languageId, options.osId, options.data );
        } else {
            var currentDataList = options.data;
        }

        // リストから対象を探す
        var currentDataItem = currentDataList.filter(function(dataItem){
            return dataItem.id == options.id
        })[0];

        return currentDataItem;

    }
}
