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
var extensionDAO = require(process.cwd() + "/dao/_includes/_extensionDAO") ;// PROTOTYPE
var osDAO = require(process.cwd() + '/dao/osDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
    - DB構築
    - DB・フロント用スキーマ定義
    - シチュエーションの取得
    - シチュエーション追加
    - シチュエーション変更
    - シチュエーション削除
*/

var situationsDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "situations",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    /* --- meta --- */
                    table.increments(); // id
                    table.string("version");
                    table.string("code"); // フォルダ名等
                    table.boolean("is_payment") // 課金有無
                    table.text("note"); // 備考

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

    // DB→フロント
    setFrontendSchema: function( dbRow ){

        var converter = baseDAO.converter; // 汎用コンバーター呼び出し

        return {
            id: dbRow.id,
            version: dbRow.version,
            code: dbRow.code,
            isPayment: dbRow.is_payment,
            note: dbRow.note,
            timestamps: {
                create: converter.convertDBDatetimeToJSDatetime(dbRow.created_at),
                update: converter.convertDBDatetimeToJSDatetime(dbRow.updated_at),
                updateErr: converter.convertDBDatetimeToJSDatetimeCheckError(dbRow.updated_at)
            }
        }
    },

    // フロント→DB
    setDBSchema: function( item ){
        return {
            id: item.id,
            version: item.version,
            code: item.code,
            is_payment: item.is_payment,
            note: item.note,
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // シチュエーションの取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function( options ){
        var _setFrontendSchema = this.setFrontendSchema;
        var _options = options;

        return new Promise(function(resolve, reject){

            var defaultOptions = {
                limit: "",
                where: "",
                orderBySQL: "id DESC",
            }
            var options = Object.assign(defaultOptions, _options);

            baseDAO.fetch({
                tableName: "situations",
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
    // シチュエーションの追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function( data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.add({
                tableName: "situations",
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({ id: id });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({ error: err });
            });

        });

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // シチュエーションの変更
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function( id, data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.update({
                tableName: "situations",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({
                    message: "シチュエーションの変更に成功しました",
                    id: id
                });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "シチュエーションの変更に失敗しました",
                    error: err
                });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // シチュエーションの削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function( id ){
        return new Promise(function(resolve, reject){

            baseDAO.remove({
                tableName: "situations",
                id: id
            })
            .then(function(){
                resolve();
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "シチュエーションの削除に失敗しました",
                    error: err
                });
            });

        });
    }

}

module.exports = situationsDAO;
