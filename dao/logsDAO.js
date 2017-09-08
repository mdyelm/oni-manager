////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
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
    - 操作ログの取得
    - 操作ログの追加
    - 不要操作ログの削除
*/

var logsDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "logs",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    table.increments(); // id
                    table.datetime("time");
                    table.string("user");
                    table.string("object");
                    table.string("type");
                    table.text("detail");

                    table.timestamps();

                },
                defaultRecords: []
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
        var converter = baseDAO.converter; // 汎用コンバーター呼び出し
        dbRow.time = converter.convertDBDatetimeToJSDatetime(dbRow.time);
        return dbRow;
    },

    setDBSchema: function( item ){
        return item;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 操作ログの取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function( options ){
        var _setFrontendSchema = this.setFrontendSchema;
        var _options = options;

        return new Promise(function(resolve, reject){

            var defaultOptions = {
                where: "",
                limit: "",
                orderBySQL: "time DESC"
            }
            var options = Object.assign(defaultOptions, _options);

            baseDAO.fetch({
                tableName: "logs",
                limit: options.limit,
                where: options.where,
                orderBySQL: options.orderBySQL,
                setFrontendSchema: _setFrontendSchema,
            }).then(function( result ){
                resolve(result);
            }).catch(function( err ){
                maUtil.dumpError(err);
                reject();
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 操作ログの追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function( data ){
      var _setDBSchema = this.setDBSchema;

      return new Promise(function(resolve, reject){

          baseDAO.add({
              tableName: "logs",
              item: data,
              setDBSchema: _setDBSchema
          })
          .then(function(id){
              resolve({ id: id });
          })
          .catch(function(){
              maUtil.dumpError(err);
              reject({ error: err });
          });

      });
    },

}

module.exports = logsDAO;
