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
var osDAO = require(process.cwd() + '/dao/osDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
    - 言語/OSごとにデータ取得
*/

var extensionDAO = {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 言語/OSごとにデータ取得
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // @deprecated

    // fetchWithEnviroment: function( options ){
    //     var _options = options; // こうしないとoptionが消える
    //
    //     return new Promise(function( resolve, reject ){
    //         maUtil.debug( "dao.common.fetchWithEnviroment","start", "DAOIncludes");
    //
    //         //---------------------------------------------------------------------------
    //         // オプションの準備
    //         //---------------------------------------------------------------------------
    //
    //         var defaultOptions = {
    //             tableName: "",
    //             limit: 12150,
    //             orderBySQL: "",
    //             setFrontendSchema: function(){}
    //         }
    //         var options = Object.assign(defaultOptions, _options);
    //         if ( !options.limit ) options.limit = 12150;
    //
    //         //---------------------------------------------------------------------------
    //         // キューの作成
    //         //---------------------------------------------------------------------------
    //
    //         var data = {}
    //         function setQueue() {
    //             return new Promise(async function(resolve, reject){
    //
    //                 var enviroment = {
    //                     languages: await languagesDAO.fetch(),
    //                     os: await osDAO.fetch()
    //                 }
    //
    //                 var fetchQueues = [];
    //
    //                 maUtil.nestedLoop({
    //                     targets:[
    //                         {data: enviroment.languages, name: "language"},
    //                         {data: enviroment.os, name: "os"}
    //                     ],
    //                     mainFunction: function( args ){
    //
    //                         var language = args.language;
    //                         var os = args.os;
    //
    //                         if ( data[language.code] == undefined ) data[language.code] = {}
    //                         if ( data[language.code][os.code] == undefined ) data[language.code][os.code] = []
    //
    //                         fetchQueues.push(
    //                             (function(){
    //                                 return new Promise(function(resolve, reject){
    //
    //                                     var tableName = options.tableName;
    //
    //                                     // 言語とOSが一致するレコードを取得
    //                                     // ※対象のテーブルに言語名とOS名をくっつける
    //                                     knex.from(tableName)
    //                                         .innerJoin("languages", tableName + ".language_id", "=", "languages.id")
    //                                         .leftOuterJoin("os", tableName + ".os_id", "=", "os.id")
    //                                         .select(
    //                                             tableName + ".*",
    //                                             "os.code as os_code",
    //                                             "os.name as os_name",
    //                                             "languages.code as language_code",
    //                                             "languages.name as language_name"
    //                                         )
    //                                         .where(function(){
    //                                             this
    //                                                 .where({
    //                                                     language_id: language.id,
    //                                                     os_id: os.id
    //                                                 })
    //                                                 .orWhere({
    //                                                     language_id: language.id,
    //                                                     os_id: null
    //                                                 });
    //                                         })
    //                                         .orderByRaw( options.orderBySQL )
    //                                         .limit ( options.limit )
    //                                         .then(function(dbRows){
    //
    //                                             // レコード無しなら終了
    //                                             var isEmpty = dbRows.length <= 0;
    //                                             if ( isEmpty ) resolve();
    //
    //                                             // 取得したレコードにフロント用スキーマ適用
    //                                             dbRows.forEach(function( row, index ){
    //                                                 data[language.code][os.code].push( options.setFrontendSchema( row ) );
    //                                             })
    //
    //                                             resolve();
    //
    //                                         }).catch(function(err){
    //                                             maUtil.dumpError(err);
    //                                             reject(err);
    //                                         })
    //
    //                                 });
    //                             })()
    //                         );
    //
    //                     }
    //                 });
    //
    //                 resolve(fetchQueues);
    //
    //             });
    //         }
    //
    //         //---------------------------------------------------------------------------
    //         // キュー処理
    //         //---------------------------------------------------------------------------
    //
    //         function processQueue( fetchQueues ){
    //             return new Promise(function(resolve, reject){
    //
    //                 Promise.all(fetchQueues)
    //                     .then(function(){
    //                         maUtil.debug( "dao.common.fetchWithEnviroment.processQueue","end", "DAOIncludes");
    //                         resolve();
    //                     }).catch(function(err){
    //                         maUtil.dumpError(err);
    //                         reject();
    //                     });
    //
    //             });
    //         }
    //
    //         //---------------------------------------------------------------------------
    //         // 実行
    //         //---------------------------------------------------------------------------
    //
    //         Promise.resolve()
    //             .then( setQueue )
    //             .then( processQueue )
    //             .then( function(){
    //                 maUtil.debug( "dao.common.fetchWithEnviroment","end", "DAOIncludes");
    //                 resolve( data );
    //             })
    //             .catch(function(err){
    //                 maUtil.dumpError(err);
    //                 reject();
    //             });
    //
    //     });
    //
    // }

}

module.exports = extensionDAO;
