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
/**
 *   DAOの共通処理
 *   @class baseDAO
 *   @module baseDAO
 *
 */
var baseDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // コンバーター定義
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    converter: {
        convertNull: function (val) {
            if (val == "null")
                val = null;
            return val;
        },
        convertDBDatetimeToJSDate: function (date) {
            if (date == "0000-00-00 00:00:00")
                return "";
            return moment(date, "YYYY-MM-DD HH:mm:ss ZZ").format('YYYY/MM/DD');
        },
        convertDBDatetimeToJSDatetime: function (date) {
            return moment(date, "YYYY-MM-DD HH:mm:ss ZZ").format('YYYY/MM/DD HH:mm');
        },
        convertDBDatetimeToJSDatetimeCheckError: function (date) {
            return moment(date, "YYYY-MM-DD HH:mm:ss ZZ").format('YYYY/MM/DD HH:mm:ss');
        }

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築 原型
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            //---------------------------------------------------------------------------
            // オプションの準備
            //---------------------------------------------------------------------------

            var defaultOptions = {
                tableName: "",
                createTable: function () {},
                defaultRecords: []
            }
            var options = Object.assign(defaultOptions, _options);

            //---------------------------------------------------------------------------
            // テーブル存在確認
            //---------------------------------------------------------------------------

            function isTableExists() {
                return new Promise(function (resolve, reject) {

                    knex.schema.hasTable(options.tableName)
                            .then(function (exists) {
                                if (exists) {
                                    console.log(options.tableName + " exists.");
                                    resolve();
                                } else {
                                    resolve(exists);
                                }
                            })
                            .catch(function (err) {
                                maUtil.dumpError(err);
                                reject();
                            })

                });
            }

            //---------------------------------------------------------------------------
            // テーブル作成
            //---------------------------------------------------------------------------

            function createTable(isTableExists) {
                return new Promise(function (resolve, reject) {

                    if (isTableExists == false) {
                        console.log(options.tableName + "added");
                        knex.schema.createTable(options.tableName, options.createTable)
                                .then(function () {
                                    resolve();
                                })
                                .catch(function (err) {
                                    maUtil.dumpError(err);
                                    reject();
                                });

                    } else {
                        resolve();
                    }

                });
            }

            //---------------------------------------------------------------------------
            // 初期データ追加
            //---------------------------------------------------------------------------

            function addDefaultRecords() {
                return new Promise(function (resolve, reject) {

                    if (options.defaultRecords) {

                        // データが空の場合に初期データ追加
                        knex(options.tableName)
                                .count("* as count")
                                .then(function (result) {
                                    if (result[0].count == 0) {

                                        console.log(options.tableName + "add defaultData");

                                        // デフォルト行の挿入
                                        knex(options.tableName)
                                                .insert(options.defaultRecords)
                                                .then(function (id) {
                                                    resolve();
                                                })
                                                .catch(function (err) {
                                                    maUtil.dumpError(err);
                                                    reject(err);
                                                });

                                    } else {
                                        resolve();
                                    }

                                });



                    } else {
                        resolve();
                    }

                });
            }


            //---------------------------------------------------------------------------
            // 実行
            //---------------------------------------------------------------------------

            Promise.resolve()
                    .then(isTableExists)
                    .then(createTable)
                    .then(addDefaultRecords)
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject(err);
                    });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // データ取得 原型
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            //---------------------------------------------------------------------------
            // オプションの準備
            //---------------------------------------------------------------------------

            var defaultOptions = {
                tableName: "",
                where: "",
                limit: 12150,
                orderBySQL: "id ASC",
                setFrontendSchema: function () {}
            }
            var options = Object.assign(defaultOptions, _options);
            if (!options.limit)
                options.limit = 12150;

            var data = []

            function fetch() {
                return new Promise(function (resolve, reject) {

                    if (options.where) {

                        knex.from(options.tableName)
                                .where(function () {
                                    if (typeof options.where == "object") {
                                        this.where(options.where)
                                    } else {
                                        this.whereRaw(options.where)
                                    }
                                })
                                .orderByRaw(options.orderBySQL)
                                .limit(options.limit)
                                .select()
                                .then(function (dbRows) {

                                    // レコード無しなら終了
                                    var isEmpty = dbRows.length <= 0;
                                    if (isEmpty) {
                                        resolve();
                                    } else {
                                        // 取得したレコードにフロント用スキーマ適用
                                        dbRows.forEach(function (row, index) {
                                            data.push(options.setFrontendSchema(row));
                                        })
                                        resolve();
                                    }

                                }).catch(function (err) {
                            maUtil.dumpError(err);
                            reject(err);
                        })

                    } else {

                        knex.from(options.tableName)
                                .orderByRaw(options.orderBySQL)
                                .limit(options.limit)
                                .select()
                                .then(function (dbRows) {
                                    // レコード無しなら終了
                                    var isEmpty = dbRows.length <= 0;
                                    if (isEmpty)
                                        resolve();

                                    // 取得したレコードにフロント用スキーマ適用
                                    dbRows.forEach(function (row, index) {
                                        data.push(options.setFrontendSchema(row));
                                    })

                                    resolve();

                                }).catch(function (err) {
                            maUtil.dumpError(err);
                            reject(err);
                        })

                    }

                });

            }

            //---------------------------------------------------------------------------
            // 実行
            //---------------------------------------------------------------------------

            Promise.resolve()
                    .then(fetch)
                    .then(function () {
                        resolve(data);
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                    });

        });

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // データ追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            // オプションの準備
            var defaultOptions = {
                tableName: "",
                item: {},
                setDBSchema: function (JSRows) {}
            }
            var options = Object.assign(defaultOptions, _options);

            // 保存するデータにDB用スキーマを適用
            options.item = options.setDBSchema(options.item);

            // 追加日付と更新日付を追加
            options.item.created_at = knex.fn.now();
            options.item.updated_at = knex.fn.now();

            // データべースにアイテムを追加
            knex(options.tableName)
                    .insert(options.item)
                    .then(function (id) {
                        resolve(id);
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({error: err});
                    })

        });

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // データ更新
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            // オプションの準備
            var defaultOptions = {
                tableName: "",
                id: "",
                item: {},
                setDBSchema: function () {}
            }
            var options = Object.assign(defaultOptions, _options);

            // 保存するデータにDB用スキーマを適用
            options.item = options.setDBSchema(options.item);

            // 追加日付を削除
            delete options.item.created_at;

            // 更新日付を追加
            options.item.updated_at = knex.fn.now();

            // データべースのアイテムを更新
            knex(options.tableName)
                    .where("id", parseInt(options.id))
                    .update(options.item)
                    .then(function (id) {
                        resolve(id);
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({error: err});
                    })

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // データ削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            // オプションの準備
            var defaultOptions = {
                tableName: "",
                id: ""
            }
            var options = Object.assign(defaultOptions, _options);

            // データベースからアイテムを削除
            knex.where("id", parseInt(options.id))
                    .from(options.tableName)
                    .del()
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({error: err});
                    });

        })
    },

    removeByKeyValue: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            // オプションの準備
            var defaultOptions = {
                tableName: "",
                key: "",
                value: ""
            }
            var options = Object.assign(defaultOptions, _options);

            // データベースからアイテムを削除
            knex.where(options.key, options.value)
                    .from(options.tableName)
                    .del()
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        maUtil.dumpError(err);
                        reject({error: err});
                    })

        })
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 並び順保存
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    savePosition: function (options) {
        var _options = options; // こうしないとoptionが消える

        return new Promise(function (resolve, reject) {

            // オプションの準備
            var defaultOptions = {
                tableName: "",
                positionList: []
            }
            var options = Object.assign(defaultOptions, _options);
            var sqlList = [];
            var responseId = [];
            options.positionList.forEach(function (item) {
                if (item.id != "") {
                    responseId.push(item.id);
                    var sql = knex.where("id", parseInt(item.id))
                            .from(options.tableName)
                            .update({position: parseInt(item.position)})
                            .toString()
                    sqlList.push(sql);
                }
            })

            // TODO warningをとめたい
            function bulkUpdate(sqlList) {
                return new Promise(function (resolve, reject) {

                    function update(sqlList, resolve, reject) {

                        // リストにSQL文が残っていなければ終了
                        if (sqlList.length == 0) {
                            resolve();
                            return false;
                        }

                        knex.raw(sqlList.pop())
                                .then(function () {
                                    // リストにSQL文が残っていれば再帰
                                    update(sqlList, resolve, reject);
                                    return true;
                                }).catch(function (err) {
                            maUtil.dumpError(err);
                            reject({error: err});
                        });

                    }

                    update(sqlList, resolve, reject);

                });
            }

            bulkUpdate(sqlList)
                    .then(function () {
                        resolve(responseId);
                    })

        })
    }

}

module.exports = baseDAO;
