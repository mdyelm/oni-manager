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
var baseDAO = require(process.cwd() + "/dao/_includes/_baseDAO");// PROTOTYPE
var extensionDAO = require(process.cwd() + "/dao/_includes/_extensionDAO");// PROTOTYPE
var osDAO = require(process.cwd() + '/dao/osDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 - DB構築
 - DB・フロント用スキーマ定義
 - メニュー項目の取得
 - メニュー項目の追加
 - メニュー項目の変更
 - メニュー項目の削除
 - 並び順保存
 */

var menusDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function () {
        return new Promise(function (resolve, reject) {

            baseDAO.setup({
                tableName: "menus",
                createTable: function (table) {

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    table.increments(); // id
                    table.integer("language_id");
                    table.integer("os_id");
                    table.integer("situation_id");
                    table.text("note");

                    table.string("type"); // normal, timezoneSuggest
                    table.string("category");
                    table.string("timezone");
                    table.string("banner_size");
                    table.text("button_image_path");
                    table.text("icon_image_path");
                    table.integer("position");

                    table.timestamps();

                },
                defaultRecords: []
            }).then(function () {
                resolve();
            }).catch(function (err) {
                maUtil.dumpError(err);
                reject(err);
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB・フロント用スキーマ定義
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setFrontendSchema: function (dbRow) {

        var converter = baseDAO.converter; // 汎用コンバーター呼び出し

        return {
            id: dbRow.id,
            languageId: dbRow.language_id,
            osId: dbRow.os_id,
            situationId: dbRow.situation_id,
            note: dbRow.note,
            type: dbRow.type,
            category: dbRow.category,
            timezone: dbRow.timezone,
            bannerSize: dbRow.banner_size,
            buttonImagePath: dbRow.button_image_path,
            iconImagePath: dbRow.icon_image_path,
            position: dbRow.position,
            timestamps: {
                create: converter.convertDBDatetimeToJSDatetime(dbRow.created_at),
                update: converter.convertDBDatetimeToJSDatetime(dbRow.updated_at),
                updateErr: converter.convertDBDatetimeToJSDatetimeCheckError(dbRow.updated_at)
            }
        }
    },

    setDBSchema: function (item) {
        return {
            language_id: item.language_id,
            os_id: item.os_id,
            situation_id: item.situation_id,
            note: item.note,
            type: item.type,
            category: item.category,
            timezone: item.timezone,
            banner_size: item.banner_size,
            button_image_path: item.button_image_path,
            icon_image_path: item.icon_image_path,
            position: item.position,
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー背景の取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function (options) {
        var _setFrontendSchema = this.setFrontendSchema;
        var _options = options;

        return new Promise(function (resolve, reject) {

            var defaultOptions = {
                limit: "",
                where: "",
                orderBySQL: "position ASC, id DESC",
            }
            var options = Object.assign(defaultOptions, _options);

            baseDAO.fetch({
                tableName: "menus",
                limit: options.limit,
                where: options.where,
                orderBySQL: options.orderBySQL,
                setFrontendSchema: _setFrontendSchema,
            }).then(function (result) {
                resolve(result);
            }).catch(function (err) {
                maUtil.dumpError(err);
                reject();
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー背景の追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function (data) {
        var _setDBSchema = this.setDBSchema;

        return new Promise(function (resolve, reject) {

            baseDAO.add({
                tableName: "menus",
                item: data,
                setDBSchema: _setDBSchema
            })
                    .then(function (id) {
                        resolve({id: id});
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({error: err});
                    });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー背景の変更
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function (id, data) {
        var _setDBSchema = this.setDBSchema;

        return new Promise(function (resolve, reject) {

            baseDAO.update({
                tableName: "menus",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
                    .then(function (id) {
                        resolve({
                            message: "メニュー項目の編集に成功しました",
                            id: id
                        });
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({
                            message: "メニュー項目の編集に失敗しました",
                            error: err
                        });
                    });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー背景の削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function (id) {
        return new Promise(function (resolve, reject) {

            baseDAO.remove({
                tableName: "menus",
                id: id
            })
                    .then(function () {
                        resolve({message: "メニュー項目の削除に成功しました"});
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({
                            message: "メニュー項目の削除に失敗しました",
                            error: err
                        });
                    });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 並び順保存
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    savePosition: function (positionList) {
        return new Promise(function (resolve, reject) {

            baseDAO.savePosition({
                tableName: "menus",
                positionList: positionList
            })
                    .then(function (responseId) {
                        resolve(responseId);
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject();
                    });

        });
    }

}

module.exports = menusDAO;
