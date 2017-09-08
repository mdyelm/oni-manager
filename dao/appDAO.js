////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var path = require("path");
var vsprintf = require("sprintf-js").vsprintf;
var escape = require("escape-html");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var knex = require(process.cwd() + '/util//mysqlConnection');
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
    - DB構築
    - DB・フロント用スキーマ定義Z
    - キーバリュー取得
    - バリューの変更
*/

var appDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise( function(resolve, reject){

            setupKeyValueStore({
                tableName: "app",
                defaultKeyValues: [
                    { key: "TOPICS_FOOTER_HTML", value: '{"jp":{"ios":[{"html":""}],"android":[{"html":""}]},"ko":{"ios":[{"html":""}],"android":[{"html":""}]},"hk":{"ios":[{"html":""}],"android":[{"html":""}]},"cn":{"ios":[{"html":""}],"android":[{"html":""}]}}' },
                    { key: "SETTINGS_CATEGORIES", value: '{"jp":{"ios":[{"isEnabled":1,"code":"recommend","name":"おすすめ","enableTimezoneSuggest":false,"position":null},{"isEnabled":1,"code":"scold","name":"しかる","enableTimezoneSuggest":false,"position":null},{"isEnabled":1,"code":"praise","name":"ほめる","enableTimezoneSuggest":false,"position":null}],"android":[{"isEnabled":1,"code":"recommend","name":"おすすめ","enableTimezoneSuggest":false,"position":null},{"isEnabled":1,"code":"scold","name":"しかる","enableTimezoneSuggest":false,"position":null},{"isEnabled":1,"code":"praise","name":"ほめる","enableTimezoneSuggest":false,"position":null}]},"ko":{"ios":[],"android":[]},"hk":{"ios":[],"android":[]},"cn":{"ios":[],"android":[]}}'},
                    { key: "SETTINGS_TIMEZONES", value: '{"jp":{"ios":[{"code":"morning","name":"朝","beginTime":"05:00","endTime":"10:59"},{"code":"noon","name":"昼","beginTime":"11:00","endTime":"13:59"},{"code":"afternoon","name":"午後","beginTime":"14:00","endTime":"15:59"},{"code":"evening","name":"夕方","beginTime":"16:00","endTime":"17:59"},{"code":"night","name":"夜","beginTime":"18:00","endTime":"23:59"},{"code":"midnight","name":"深夜","beginTime":"00:00","endTime":"04:59"}],"android":[{"code":"morning","name":"朝","beginTime":"05:00","endTime":"10:59"},{"code":"noon","name":"昼","beginTime":"11:00","endTime":"13:59"},{"code":"afternoon","name":"午後","beginTime":"14:00","endTime":"15:59"},{"code":"evening","name":"夕方","beginTime":"16:00","endTime":"17:59"},{"code":"night","name":"夜","beginTime":"18:00","endTime":"23:59"},{"code":"midnight","name":"深夜","beginTime":"00:00","endTime":"04:59"}]},"ko":{"ios":[],"android":[]},"hk":{"ios":[],"android":[]},"cn":{"ios":[],"android":[]}}' }
                ]
            });

            function setupKeyValueStore( options ){

                //---------------------------------------------------------------------------
                // オプションの準備
                //---------------------------------------------------------------------------

                var defaultOptions = {
                    tableName: "",
                    defaultKeyValues: []
                }
                var options = Object.assign(defaultOptions, options);

                //---------------------------------------------------------------------------
                // テーブル存在確認
                //---------------------------------------------------------------------------

                function isTableExists(){
                    return new Promise(function( resolve, reject ){

                        knex.schema.hasTable( options.tableName )
                            .then(function(exists){
                                if (exists) {
                                    resolve();
                                } else {
                                    resolve(exists);
                                }
                            })

                    });
                }

                //---------------------------------------------------------------------------
                // テーブル作成
                //---------------------------------------------------------------------------

                function createTable(isTableExists) {
                    return new Promise(function( resolve, reject ){

                        if( isTableExists == false ) {
                            knex.schema.createTable(options.tableName, function(table){
                                table.charset("utf8");
                                table.collate("utf8_general_ci");

                                table.increments(); // id
                                table.string("key")
                                table.text("value");

                                table.timestamps(); // created_at, updated_at
                            })
                            .then(function(){
                                resolve();
                            });
                        } else {
                            resolve();
                        }

                    });
                }

                //---------------------------------------------------------------------------
                // 初期データ追加
                //---------------------------------------------------------------------------

                function addDefaultKeyValues() {
                    return new Promise(function( resolve, reject ){

                        function getKeyExists( keyName ){
                            return new Promise(function( resolve, reject ){

                                knex.from(options.tableName)
                                    .where("key", "like", keyName)
                                    .select()
                                    .then(function(rows){
                                        isRowExists = (Object.keys(rows).length > 0);

                                        if (isRowExists) {
                                            reject(); // あれば無視
                                        } else {
                                            resolve(); // なければ追加
                                        }

                                    });

                            });
                        }

                        // キューの作成
                        var queues = []
                        options.defaultKeyValues.forEach(function( keyValue ){
                            queues.push( new Promise(function(resolve, reject){

                                getKeyExists( keyValue.key )
                                    .then(function(){
                                        knex("app")
                                            .insert(keyValue)
                                            .then(function(id){
                                                resolve({ id: id });
                                            })
                                            .catch(function(){
                                                resolve();
                                            });
                                    })
                                    .catch(function(err){
                                        maUtil.dumpError(err);
                                        resolve();
                                    });

                            }) );
                        })

                        // キューの処理待ち
                        Promise.all( queues )
                            .then(function(){
                                maUtil.debug( "dao.app.setup","end", "blue");
                                resolve();
                            }, function(reason){
                                maUtil.debug( "dao.app.setup","error", "blue");
                                reject(reason);
                            });

                    });
                }

                //---------------------------------------------------------------------------
                // 実行
                //---------------------------------------------------------------------------

                Promise.resolve()
                    .then(isTableExists)
                    .then(createTable)
                    .then(addDefaultKeyValues)
                    .then(function(){
                        resolve();
                    })
                    .catch(function(err){
                        maUtil.dumpError(err);
                        reject(err);
                    });

            }

        });

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB・フロント用スキーマ定義
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setFrontendSchema: function ( dbRow ){

        function convertDBDatetimeToJSDate(date){
            return moment(date,"YYYY-MM-DD HH:mm:ss ZZ").format('YYYY/MM/DD');
        }

        function convertDBDatetimeToJSDatetime(date){
            return moment(date,"YYYY-MM-DD HH:mm:ss ZZ").format('YYYY/MM/DD HH:mm');
        }

        var keyValue = {}

        keyValue[dbRow.key] = {
            key: dbRow.key,
            value: dbRow.value,
            timestamps: {
                create: convertDBDatetimeToJSDatetime(dbRow.created_at),
                update: convertDBDatetimeToJSDatetime(dbRow.updated_at),
            }
        }

        return keyValue;

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // キーバリュー取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function(){
        var _setFrontendSchema = this.setFrontendSchema;

        return new Promise(function(resolve, reject){

            //---------------------------------------------------------------------------
            // 取得処理定義
            //---------------------------------------------------------------------------

            function fetch() {
                return new Promise(function(resolve, reject){

                    var result = {};

                    knex.from("app")
                        .select()
                        .then(function(dbRows){
                            dbRows.forEach(function(dbRow,index){
                                var row = _setFrontendSchema(dbRow);
                                result = Object.assign(result, row);
                            })
                            resolve(result);
                        })
                        .catch(function(err){
                            maUtil.dumpError(err);
                            reject(err);
                        })

                });
            }

            //---------------------------------------------------------------------------
            // 実行
            //---------------------------------------------------------------------------

            Promise.resolve()
                .then(fetch)
                .then(function( result ){
                    resolve(result);
                })
                .catch(function(err){
                    maUtil.dumpError(err);
                    reject(err);
                })

        });

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // キーバリュー取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetchItem: function( key ){
        var _setFrontendSchema = this.setFrontendSchema;

        return new Promise(function(resolve, reject){

            //---------------------------------------------------------------------------
            // 取得処理定義
            //---------------------------------------------------------------------------

            function fetch() {
                return new Promise(function(resolve, reject){

                    var fetchResult = {}

                    knex.from("app")
                        .where('key', 'like', key)
                        .select()
                        .then(function(dbRows){
                            fetchResult[key] = "";

                            if(dbRows.length){
                                fetchResult = _setFrontendSchema(dbRows[0]);
                            }

                            resolve( fetchResult );

                        })
                        .catch(function(err){
                            maUtil.dumpError(err);
                            reject(err);
                        })

                });
            }

            //---------------------------------------------------------------------------
            // 実行
            //---------------------------------------------------------------------------

            Promise.resolve()
                .then(fetch)
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    maUtil.dumpError(err);
                    reject(err);
                })
        });

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // バリューの変更
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    updateItem: function( key, value ){
        return new Promise(function(resolve, reject){

            // キーが一致するレコードのIDを取得しIDをもとに上書き。ない場合は新規追加
            knex.from("app")
                .where("key", "like", key)
                .select("id")
                .then(function(row){
                    if(row.length){
                        return knex.from("app")
                            .where("id", row[0].id)
                            .update( {
                                key: key,
                                value: value
                            } );
                    } else {
                        return knex("app")
                            .insert( {
                                key: key,
                                value: value
                            } );
                    }
                })
                .then(function(id){
                    resolve({
                        id: id
                    });
                })
                .catch(function(err){
                    maUtil.dumpError(err);
                    reject({ error: err });
                });

        })
    },

}

module.exports = appDAO;
