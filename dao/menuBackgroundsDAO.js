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
 - メニュー背景の取得
 - メニュー背景の追加
 - メニュー背景の変更
 - メニュー背景の削除
 */

var menuBackgroundsDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function () {
        return new Promise(function (resolve, reject) {

            baseDAO.setup({
                tableName: "menuBackgrounds",
                createTable: function (table) {

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

                    table.datetime("start_date");
                    table.datetime("end_date");
                    table.text("image_path");

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
            version: dbRow.version,
            languageId: dbRow.language_id,
            osId: dbRow.os_id,
            isEnabled: dbRow.is_enabled,
            name: dbRow.name,
            note: dbRow.note,
            startDate: converter.convertDBDatetimeToJSDatetime(dbRow.start_date),
            endDate: converter.convertDBDatetimeToJSDatetime(dbRow.end_date),
            imagePath: dbRow.image_path,
            timestamps: {
                create: converter.convertDBDatetimeToJSDatetime(dbRow.created_at),
                update: converter.convertDBDatetimeToJSDatetime(dbRow.updated_at),
                updateErr: converter.convertDBDatetimeToJSDatetimeCheckError(dbRow.updated_at)
            }
        }

    },

    setDBSchema: function (item) {
        return {
            version: item.version,
            is_enabled: item.is_enabled,
            language_id: item.language_id,
            os_id: item.os_id,
            name: item.name,
            note: item.note,
            start_date: moment(item.startDate_date + item.startDate_time, "YYYY/MM/DDHH:mm").format('YYYY-MM-DD HH:mm:ss'),
            end_date: moment(item.endDate_date + item.endDate_time, "YYYY/MM/DDHH:mm").format('YYYY-MM-DD HH:mm:ss'),
            image_path: item.image_path,
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー背景の取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 言語一覧取得⇒OS一覧取得⇒言語/OSの全組み合わせを取得⇒データ形式を適用

    fetch: function (options) {
        var _setFrontendSchema = this.setFrontendSchema;
        var _options = options;

        return new Promise(function (resolve, reject) {

            var defaultOptions = {
                limit: "",
                where: "",
                orderBySQL: "start_date DESC",
            }
            var options = Object.assign(defaultOptions, options);

            baseDAO.fetch({
                tableName: "menuBackgrounds",
                limit: options.limit,
                where: options.where,
                orderBySQL: options.orderBySQL,
                setFrontendSchema: _setFrontendSchema
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
                tableName: "menuBackgrounds",
                item: data,
                setDBSchema: _setDBSchema
            })
                    .then(function (id) {
                        resolve({
                            message: "メニュー背景を追加しました",
                            id: id
                        });
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
                tableName: "menuBackgrounds",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
                    .then(function (id) {
                        resolve({
                            message: "メニュー背景を編集しました",
                            id: id
                        });
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({
                            message: "メニュー背景の編集に失敗しました",
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
                tableName: "menuBackgrounds",
                id: id
            })
                    .then(function () {
                        resolve({message: "メニュー背景を削除しました"});
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({
                            message: "メニュー背景の削除に失敗しました",
                            error: err
                        });
                    })

        });
    }

}

module.exports = menuBackgroundsDAO;
