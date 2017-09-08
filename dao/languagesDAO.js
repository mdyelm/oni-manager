////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require("moment");var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var path = require("path");
var vsprintf = require("sprintf-js").vsprintf;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var knex = require(process.cwd() + '/util//mysqlConnection');
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DAO
var baseDAO = require(process.cwd() + "/dao/_includes/_baseDAO") ;// PROTOTYPE
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
    - DB構築
    - DB・フロント用スキーマ定義
    - 言語一覧の取得
*/

var languagesDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "languages",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    table.increments(); // id
                    table.string("code");
                    table.string("name");

                    table.timestamps();

                },
                defaultRecords: [
                    { "code": "jp", "name": "日本版" },
                    { "code": "ko", "name": "韓国版" },
                    { "code": "hk", "name": "簡体字版" },
                    { "code": "cn", "name": "繁体字版" },
                ]
            }).then(function(){
                resolve();
            }).catch(function(err){
                maUtil.dumpError(err);
                reject(err);
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB・フロント用スキーマ定義
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setFrontendSchema: function( dbRow ){
        return dbRow;
    },

    setDBSchema: function( item ){
        return item;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 言語一覧の取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function(){
        var _setFrontendSchema = this.setFrontendSchema;

        return new Promise(function(resolve, reject){

            baseDAO.fetch({
                tableName: "languages",
                setFrontendSchema: _setFrontendSchema,
            }).then(function( result ){
                resolve(result);
            }).catch(function( err ){
                maUtil.dumpError(err);
                reject();
            });

        });
    },

}

module.exports = languagesDAO;
