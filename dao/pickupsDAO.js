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
    - ピックアップの取得
    - ピックアップの追加
    - ピックアップの変更
    - ピックアップの削除
    - 並び順保存
*/

var pickupsDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "pickups",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    // meta
                    table.increments(); // id
                    table.string("version");
                    table.integer("language_id");
                    table.integer("os_id");
                    table.boolean("is_enabled");
                    table.string("name");
                    table.text("note");

                    table.datetime("ad_start_date");
                    table.datetime("ad_end_date");
                    table.string("ad_type");
                    table.integer("ad_duration");
                    table.text("link_url");
                    table.text("banner_image_path");
                    table.text("native_ad_name");
                    table.text("native_ad_settings");
                    table.integer("position");

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
            languageId: dbRow.language_id,
            osId: dbRow.os_id,
            isEnabled: dbRow.is_enabled,
            situationId: dbRow.situation_id,
            name: dbRow.name,
            note: dbRow.note,
            adStartDate: converter.convertDBDatetimeToJSDatetime(dbRow.ad_start_date),
            adEndDate: converter.convertDBDatetimeToJSDatetime(dbRow.ad_end_date),
            adType: dbRow.ad_type,
            adDuration: dbRow.ad_duration,
            linkUrl: dbRow.link_url,
            bannerImagePath: dbRow.banner_image_path,
            nativeAdName: dbRow.native_ad_name,
            nativeAdSettings: JSON.parse(dbRow.native_ad_settings),
            position: dbRow.position,
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
            is_enabled: item.is_enabled,
            version: item.version,
            language_id: item.language_id,
            os_id: item.os_id,
            name: item.name,
            note: item.note,
            ad_start_date: moment(item.adStartDate_date + item.adStartDate_time, "YYYY/MM/DDHH:mm").format('YYYY-MM-DD HH:mm:ss'),
            ad_end_date: moment(item.adEndDate_date + item.adEndDate_time, "YYYY/MM/DDHH:mm").format('YYYY-MM-DD HH:mm:ss'),
            ad_type: item.ad_type,
            ad_duration: item.ad_duration,
            link_url: item.link_url,
            banner_image_path: item.banner_image_path,
            native_ad_name: item.native_ad_name,
            native_ad_settings: JSON.stringify(item.nativeAdSettings),
            position: item.position,
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ピックアップの取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function( options ){
        var _setFrontendSchema = this.setFrontendSchema;
        var _options = options;

        return new Promise(function(resolve, reject){

            var defaultOptions = {
                limit: "",
                where: "",
                orderBySQL: "position ASC, id DESC",
            }
            var options = Object.assign(defaultOptions, _options);

            baseDAO.fetch({
                tableName: "pickups",
                limit: options.limit,
                where: options.where,
                orderBySQL: options.orderBySQL,
                setFrontendSchema: _setFrontendSchema
            }).then(function( result ){
                resolve(result);
            }).catch(function(err){
                maUtil.dumpError(err);
                reject();
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ピックアップの追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function( data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.add({
                tableName: "pickups",
                item: data,
                setDBSchema: _setDBSchema,
                orderBySQL: "id DESC",
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
    // ピックアップの変更
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function( id, data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.update({
                tableName: "pickups",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({
                    message: "ピックアップの編集に成功しました",
                    id: id
                });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "ピックアップの編集に失敗しました",
                    error: err
                });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ピックアップの削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function( id ){
        return new Promise(function(resolve, reject){

            baseDAO.remove({
                tableName: "pickups",
                id: id
            })
            .then(function(){
                resolve({ message: "ピックアップの削除に成功しました" });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "ピックアップの削除に失敗しました",
                    error: err
                });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 並び順保存
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    savePosition: function( positionList ){
        return new Promise(function(resolve, reject){

            baseDAO.savePosition({
                tableName: "pickups",
                positionList: positionList
            })
            .then(function(){
                resolve();
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject();
            });

        });
    }

}

module.exports = pickupsDAO;
