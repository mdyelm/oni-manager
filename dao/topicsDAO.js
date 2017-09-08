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
    - トピックス取得
    - トピックス追加
    - トピックス変更
    - トピックス削除
    - 使用中画像一覧の取得
*/

var topicsDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DB構築
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setup: function(){
        return new Promise(function(resolve, reject){

            baseDAO.setup({
                tableName: "topics",
                createTable: function(table){

                    table.charset("utf8");
                    table.collate("utf8_general_ci");

                    // meta
                    table.increments(); // id
                    table.boolean("is_enabled");
                    table.integer("language_id"); //  ["jp", "ko", "hk"]
                    table.integer("os_id").nullable(); // ["common", "android", "ios"]

                    table.date("date");
                    table.text("title");
                    table.text("comment");
                    table.text("image_url");
                    table.integer("priority");

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

         // ショートコードの変換
        function convertShortCode(imgPath, text, options ){

            var parsedComment = dbRow.comment;

            // 画像ショートコード
            if ( options.isImageLocal && options.isImageLocal != undefined ) {
                var imgPath = "./images/" + maUtil.getFileName(dbRow.image_url); //HTML出力用
            } else {
                var imgPath = dbRow.image_url;
            }

            parsedComment = parsedComment.replace(/\[img\]/g, "<img src='"+ imgPath +"'>");

            // リンクショートコード
            parsedComment = parsedComment.replace(/\[link\:(.*?)\]/g,"<a href='$1'>");
            parsedComment = parsedComment.replace(/ blank'>/g,"' target='_blank'>");
            parsedComment = parsedComment.replace(/\[endlink\]/g,"</a>");

            // 改行ショートコード
            parsedComment = parsedComment.replace(/\[br\]/g,"<br>");

            // 改行の変換
            parsedComment = parsedComment.replace(/\r?\n|\r/g, "<br>");

            return parsedComment;

        }

        return {
            id: dbRow.id,
            languageId: dbRow.language_id,
            osId: converter.convertNull(dbRow.os_id),
            isEnabled: dbRow.is_enabled,
            date: converter.convertDBDatetimeToJSDate(dbRow.date),
            title: dbRow.title,
            comment: dbRow.comment,
            imageUrl: dbRow.image_url,
            priority: dbRow.priority,
            parsedComment: convertShortCode(dbRow.comment, dbRow.image_url, {}),
            parsedForBuildComment: convertShortCode(dbRow.comment, dbRow.image_url, { isImageLocal: true }),
            timestamps: {
                create: converter.convertDBDatetimeToJSDatetime(dbRow.created_at),
                update: converter.convertDBDatetimeToJSDatetime(dbRow.updated_at),
                updateErr: converter.convertDBDatetimeToJSDatetimeCheckError(dbRow.updated_at)
            }
        }

    },

    // フロント→DB
    setDBSchema: function( item ){

        function setNull( value ){
            return ( value == "null" ) ? null : value;
        }

        return {
            language_id: item.language_id,
            os_id: setNull(item.os_id),
            is_enabled: item.is_enabled,
            date: moment(item.date, "YYYY/MM/DD").format("YYYY-MM-DD"),
            title: item.title,
            comment: item.comment,
            image_url: item.image_url,
            priority: item.priority,
        }

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // トピックス取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetch: function( options ){
        var _setFrontendSchema = this.setFrontendSchema;
        var _options = options;

        return new Promise(function(resolve, reject){

            var defaultOptions = {
                limit: "",
                where: "",
                orderBySQL: "date DESC,priority DESC",
            }
            var options = Object.assign(defaultOptions, _options);

            baseDAO.fetch({
                tableName: "topics",
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
    // トピックスの追加
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    add: function( data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.add({
                tableName: "topics",
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({
                    message: "お知らせを追加しました",
                    id: id
                });
            })
            .catch(function(){
                maUtil.dumpError(err);
                reject({ error: err });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // トピックスの変更
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    update: function( id, data ){
        var _setDBSchema = this.setDBSchema;

        return new Promise(function(resolve, reject){

            baseDAO.update({
                tableName: "topics",
                id: id,
                item: data,
                setDBSchema: _setDBSchema
            })
            .then(function(id){
                resolve({
                    message: "お知らせを編集しました",
                    id: id
                });
            })
            .catch(function(){
                maUtil.dumpError(err);
                reject({
                    message: "お知らせの編集に失敗しました",
                    error: err
                });
            });

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // トピックスの削除
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    remove: function( id ){
        return new Promise(function(resolve, reject){

            baseDAO.remove({
                tableName: "topics",
                id: id
            })
            .then(function(){
                resolve({
                    message: "お知らせを削除しました",
                });
            })
            .catch(function(err){
                maUtil.dumpError(err);
                reject({
                    message: "お知らせの削除に失敗しました",
                    error: err
                });
            })

        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 使用中画像一覧の取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    fetchUseImages: function(){
        return new Promise(function(resolve, reject){

            var useFiles = [];

            //---------------------------------------------------------------------------
            // 取得
            //---------------------------------------------------------------------------

            knex.from("topics")
                .select("image_url")
                .then(function( rows ){

                    // URLからファイル名を取得し配列に追加
                    rows.forEach(function(row){
                        var useFileName = maUtil.getFileName( row.image_url );
                        useFiles.push(useFileName);
                    });

                    resolve(useFiles);

                    maUtil.debug( "dao.topics.fetchUseImages @useFiles", useFiles);

                })
                .catch(function(err){
                    maUtil.dumpError(err);
                    reject();
                });

        });

    }

}

module.exports = topicsDAO;
