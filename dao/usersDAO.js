////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require("moment");var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var path = require("path");
var vsprintf = require("sprintf-js").vsprintf;
var crypto = require("crypto");
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

var usersDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "users",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    table.increments(); // id
                    table.string("username");
                    table.string("password");
                    table.string("role");
                    table.string("name");

                    table.timestamps();

                },
                defaultRecords: [
                    {
                        "username": "admin",
                        "password": "IQUVcUSFkGO8JPTgmkF2QHrt/aE5fHMlQgIsfpSTosc=",
                        "role": "admin",
                        "name": "管理者"
                    },
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
        var salt = config.get("oniManagerConfig.salt");
        item.password = crypto.createHash('sha256').update( item.password + salt ).digest('base64');
        return item;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 言語一覧の取得
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
                tableName: "users",
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
    // ユーザーの追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function( data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.add({
                tableName: "users",
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
    // ユーザーの編集
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function( id, data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.update({
                tableName: "users",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({
                    message: "ユーザーの編集に成功しました",
                    id: id
                });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "ユーザーの編集に失敗しました",
                    error: err
                });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ユーザーの削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function( id ){
        return new Promise(function(resolve, reject){

            baseDAO.remove({
                tableName: "users",
                id: id
            })
            .then(function(){
                resolve({ message: "ユーザーの削除に成功しました" });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "ユーザーの削除に失敗しました",
                    error: err
                });
            });

        });
    }

}

module.exports = usersDAO;
