////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var maUtil = require(process.cwd() + '/util//maUtil');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var fs = require("fs");
var pug = require('pug');
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp")
var path = require("path");
var debug = require('debug')('om/model/topic');
var util = require("util");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var topicsDAO = require(process.cwd() + '/dao/topicsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Topic = {

    // --------------------------------------------------------------------------------------------------------------------
    // リソースビルド
    // --------------------------------------------------------------------------------------------------------------------

    generateResources: function( args ){
        return new Promise( async function(resolve, reject){
            debug("generateResources");

            try {

                // ----------------------------------------------------------------------------------------------------
                // データ取得
                // ----------------------------------------------------------------------------------------------------

                var languages = await languagesDAO.fetch();
                var os = await osDAO.fetch();
                var topics = await topicsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("TOPICS_FOOTER_HTML")
                ])

                // ステータスが無効になっているものを出力対象から除外する
                var enabledTopics = topics.filter(function( topic ){
                    return ( topic.isEnabled == TOPIC_STATUS_ENABLED );
                });

                // お知らせを言語OS構造体として取得
                var enabledEnvedTopics = maUtil.getEnvedObject( languages, os, enabledTopics );

                // ----------------------------------------------------------------------------------------------------
                // 出力リストにリソース追加
                // ----------------------------------------------------------------------------------------------------

                var results = []

                // お知らせ画像 ( クリーニングで使用ファイルのみになっていると仮定し、全部のファイルを移動する )
                results.push({
                    name: "topicImage",
                    fromPath: config.get("app.paths.topics.source") + "images",
                    destPath: config.get("app.paths.topics.build") + "images"
                });

                // HTML
                var footerHTML = JSON.parse( keyValues["TOPICS_FOOTER_HTML"].value );
                var templateFilePath = process.cwd() + config.get("app.paths.topics.template");

                maUtil.nestedLoop({
                    targets: [
                        {data: languages, name: "language"},
                        {data: os, name: "os"}
                    ],
                    mainFunction: function( nestedLoopArgs ){

                        var language = nestedLoopArgs.language;
                        var os = nestedLoopArgs.os;

                        var htmlBuffer = {};

                        // HTML出力してバッファに追加
                        htmlBuffer[ os.code ] = pug.renderFile(templateFilePath, {
                            name: 'お知らせ',
                            result: enabledEnvedTopics[language.code][os.code],
                            footerHtml: (args.enviromentType == "production") ? footerHTML[language.code][os.code][0].html : "本番出力ではここにfooterHTMLが入ります" ,
                        })

                        // バッファのファイル書き出し
                        var sourceDirectory = config.get("app.paths.topics.source");
                        var filePath = sourceDirectory + "topics_" + language.code + "_" + os.code + ".html";
                        var outputFilePath = process.cwd() + filePath;

                        try {
                            mkdirp.sync( path.dirname(outputFilePath) ); // フォルダ事前作成
                            fs.writeFileSync( outputFilePath, htmlBuffer[os.code]); // 書き込み
                        } catch(err){
                            console.log(err);
                        }

                        // 出力リストに追加
                        var directory = config.get("app.paths.topics.build");
                        var destPath = vsprintf( "%s/%s", [
                            directory,
                            maUtil.getFileName(filePath)
                        ] );
                        results.push({
                            name: "topichtml",
                            fromPath: filePath,
                            destPath: destPath
                        })

                    }
                })

                debug("generateResources finished", results );
                resolve( results );

            } catch(e) {
                debug("generateResources err %0", e);
                reject(e);
            }

        });
    },

    // --------------------------------------------------------------------------------------------------------------------
    // plistビルド
    // --------------------------------------------------------------------------------------------------------------------

    generatePropertyListContents: function( args ){
        return new Promise( async function( resolve, reject ){
            debug("generatePropertyListContents");

            try {

                // ----------------------------------------------------------------------------------------------------
                // データ取得
                // ----------------------------------------------------------------------------------------------------

                var languages = await languagesDAO.fetch();
                var os = await osDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                ])

                // ----------------------------------------------------------------------------------------------------
                // データ追加
                // ----------------------------------------------------------------------------------------------------

                var plistContents = []

                maUtil.nestedLoop({
                    targets: [
                        {data: languages, name: "language"},
                        {data: os, name: "os"}
                    ],
                    mainFunction: function( args ){
                        var envedPlists = []
                        plistContents = plistContents.concat( envedPlists );
                    }
                })

                debug("generatePropertyListContents finished", util.inspect(plistContents, false, null) );
                resolve( plistContents );

            } catch(e) {
                debug("generatePropertyListContents err %0", e);
                reject(e);
            }

        });
    }
}

module.exports = Topic;
