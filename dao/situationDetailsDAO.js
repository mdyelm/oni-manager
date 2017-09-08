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
    - シチュエーション詳細の取得
    - シチュエーション詳細追加
    - シチュエーション詳細変更
    - シチュエーション詳細削除
*/

var situationsDetailDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "situationDetails",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    /* --- meta --- */
                    table.increments(); // id
                    table.string("version");
                    table.integer("situation_id");
                    table.integer("language_id");
                    table.integer("os_id");
                    table.boolean("is_enabled");

                    /* --- basic --- */
                    table.string("situation_name");
                    table.string("character_name");
                    table.integer("price");
                    table.text("store_text");
                    table.text("store_thumbnail_image_path");
                    table.boolean("is_hidden_footer_ad");
                    table.datetime("show_term_start");
                    table.datetime("show_term_end");
                    table.boolean("is_use_special_button");
                    table.text("special_button_image_path");

                    /* --- call --- */
                    table.boolean("is_skip_interstitial_on_decline");

                    /* --- talk --- */
                    table.string("scene_media_type");
                    table.json("scene_sets");

                    /*
                        [
                            {
                                id: 1,
                                name: "sceneSetName",
                                sceneType: "audio",
                                sceneSoundPath: "",
                                sceneSoundBGMPath: "",
                                sceneVideoPath: "",
                                selectRatio: 50,
                                analyticsName: "",
                                scenes: [
                                    {
                                        backgroundImagePath: "",
                                        sceneDuration: 1.5,
                                        characterName: "pi-man",
                                        note: "",
                                    }
                                ],
                                repeatLastScenes: [
                                    {
                                        backgroundImagePath: "",
                                        sceneDuration: 1.5,
                                        characterName: "pi-man",
                                        note: "",
                                    }
                                ]
                            }
                        ]
                    */

                    /* --- interstitial --- */
                    table.string("interstitial_type");
                    table.text("web_interstitial_url")
                    table.text("youtube_url");
                    table.boolean("is_situation_share_hidden");

                    /* --- misc --- */
                    table.timestamps(); // created_at, updated_at

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
            situationId: dbRow.situation_id,
            languageId: dbRow.language_id,
            osId: dbRow.os_id,
            isEnabled: dbRow.is_enabled,
            characterName: dbRow.character_name,
            situationName: dbRow.situation_name,

            /* --- basic --- */

            price: dbRow.price,
            storeText: dbRow.store_text,
            storeThumbnailImagePath: dbRow.store_thumbnail_image_path,
            isHiddenFooterAd: dbRow.is_hidden_footer_ad,
            showTermStart: converter.convertDBDatetimeToJSDate(dbRow.show_term_start),
            showTermEnd: converter.convertDBDatetimeToJSDate(dbRow.show_term_end),
            isUseSpecialButton: dbRow.is_use_special_button,
            specialButtonImagePath: dbRow.special_button_image_path,

            /* --- call --- */
            isSkipInterstitialOnDecline: dbRow.is_skip_interstitial_on_decline,

            /* --- talk --- */
            sceneMediaType: dbRow.scene_media_type,
            sceneSets: JSON.parse(dbRow.scene_sets),

            /* --- interstitial --- */
            interstitialType: dbRow.interstitial_type,
            webInterstitialUrl: dbRow.web_interstitial_url,
            youtubeUrl: dbRow.youtube_url,
            isSituationShareHidden: dbRow.is_situation_share_hidden,

            /* --- misc --- */
            timestamps: {
                create: converter.convertDBDatetimeToJSDatetime(dbRow.created_at),
                update: converter.convertDBDatetimeToJSDatetime(dbRow.updated_at)
            }
        }
    },

    // フロント→DB
    setDBSchema: function( item ){
        return {
            id: item.id,
            version: item.version,
            situation_id: item.situation_id,
            language_id: item.language_id,
            os_id: item.os_id,
            is_enabled: item.is_enabled,
            character_name: item.character_name,
            situation_name: item.situation_name,

            /* --- basic --- */

            // is_payment: item.is_payment,
            price: item.price,
            store_text: item.store_text,
            store_thumbnail_image_path: item.store_thumbnail_image_path,
            is_hidden_footer_ad: item.is_hidden_footer_ad,
            show_term_start: moment(item.showTermStart_date, "YYYY/MM/DD").format('YYYY-MM-DD HH:mm:ss'),
            show_term_end: moment(item.showTermEnd_date, "YYYY/MM/DD").format('YYYY-MM-DD HH:mm:ss'),
            is_use_special_button: item.is_use_special_button,
            special_button_image_path: item.special_button_image_path,

            /* --- call --- */
            is_skip_interstitial_on_decline: item.is_skip_interstitial_on_decline,

            /* --- talk --- */
            scene_media_type: item.scene_media_type,
            scene_sets: JSON.stringify(item.scene_sets),

            /* --- interstitial --- */
            interstitial_type: item.interstitial_type,
            web_interstitial_url: item.web_interstitial_url,
            youtube_url: item.youtube_url,
            is_situation_share_hidden: item.is_situation_share_hidden,
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
                tableName: "situationDetails",
                limit: options.limit,
                where: options.where,
                orderBySQL: options.orderBySQL,
                setFrontendSchema: _setFrontendSchema,
            }).then(function( result ){
                resolve(result);
            }).catch(function(err){
                maUtil.dumpError(err);
                reject();
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // シチュエーション詳細の追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function( data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.add({
                tableName: "situationDetails",
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
    // シチュエーション詳細の変更
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function( id, data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.update({
                tableName: "situationDetails",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({
                    message: "シチュエーション詳細変更に成功しました",
                    id: id
                });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "シチュエーション詳細変更に失敗しました",
                    error: err
                });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // シチュエーション詳細の削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function( id ){
        return new Promise(function(resolve, reject){

            baseDAO.removeByKeyValue({
                tableName: "situationDetails",
                key: "situation_id",
                value: id
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

module.exports = situationsDetailDAO;
