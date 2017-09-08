require( process.cwd() + "/define" );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var maUtil = require(process.cwd() + '/util//maUtil');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var fs = require("fs");
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp")
var path = require("path");
var debug = require('debug')('om/model/menuBackground');
var util = require("util");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var menuBackgroundsDAO = require(process.cwd() + '/dao/menuBackgroundsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MenuBackground = {

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
                var menuBackgrounds = await menuBackgroundsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION")
                ]);

                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                // ステータスが無効になっているものを出力対象から除外する
                var enabledMenuBackgrounds = menuBackgrounds.filter(function( menuBackground ){
                    return ( menuBackground.isEnabled == MENUBACKGROUND_STATUS_ENABLED );
                })

                // メニュー背景を言語OS構造体として取得
                var enabledEnvedMenuBackgrounds = maUtil.getEnvedObject( languages, os, enabledMenuBackgrounds );

                // ----------------------------------------------------------------------------------------------------
                // 出力リストにリソース追加
                // ----------------------------------------------------------------------------------------------------

                var results = []

                maUtil.nestedLoop({
                    targets: [
                        {data: languages, name: "language"},
                        {data: os, name: "os"}
                    ],
                    mainFunction: function( args ){

                        var language = args.language;
                        var os = args.os;

                        enabledEnvedMenuBackgrounds[language.code][os.code].forEach(function( menuBackground ){

                            // メニュー背景画像
                            if ( menuBackground.imagePath ) {

                                var currentConfig = config.get("app.paths.menuBackgrounds.build.menuBackground");
                                var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                    apiVersion: apiVersion
                                }) );

                                var destPath = directory + maUtil.getFileName( menuBackground.imagePath );
                                results.push({
                                    name: "menuBackground",
                                    fromPath: menuBackground.imagePath,
                                    destPath: destPath
                                });
                            }

                        });
                    }
                });

                debug("generateResources finished", results);
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

            var plistContents = []

            try {

                var languages = await languagesDAO.fetch();
                var os = await osDAO.fetch();
                var menuBackgrounds = await menuBackgroundsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                ])

                // ステータスが無効になっているものを出力対象から除外する

                var enabledMenuBackgrounds = menuBackgrounds.filter(function( menuBackground ){
                    return ( menuBackground.isEnabled == MENUBACKGROUND_STATUS_ENABLED );
                })

                // メニュー背景を言語OS構造体として取得
                var enabledEnvedMenuBackgrounds = maUtil.getEnvedObject( languages, os, enabledMenuBackgrounds );

                // ----------------------------------------------------------------------------------------------------
                // データ追加
                // ----------------------------------------------------------------------------------------------------

                languages.forEach(function(language){
                    os.forEach(function(os){

                        // ==================================================
                        // mainMenu.plist
                        // ==================================================

                        // ----------------------------------------------------------------------------------------------------
                        // plistの内容を定義
                        // ----------------------------------------------------------------------------------------------------

                        var content = {
                            backImages: []
                        }


                        enabledEnvedMenuBackgrounds[language.code][os.code].forEach(function( menuBackground ){
                            content.backImages.push({
                                Version: menuBackground.version,
                                StartDate: moment( menuBackground.startDate, "YYYY/MM/DD HH:mm" ).format("YYYY-MM-DD HH:mm"),
                                EndDate: moment( menuBackground.endDate, "YYYY/MM/DD HH:mm" ).format("YYYY-MM-DD HH:mm"),
                                ImageName: maUtil.getFileName(menuBackground.imagePath),
                            });
                        });

                        var envedPlists = [
                            {
                                type: "mainMenu", // 保存先をconfig.jsonから取得する際に使用
                                code: vsprintf("mainMenu_%s_%s", [ language.code, os.code ]), // マージ識別用
                                fileName: language.code + "_" + os.code + "_mainMenu.plist", // 保存名
                                pathVariables: {
                                    apiVersion: keyValues["SETTINGS_APIVERSION"].value
                                },
                                content: content
                            },
                        ]

                        plistContents = plistContents.concat( envedPlists );

                    });
                });

                debug("generatePropertyListContents finished", util.inspect(plistContents, false, null) );
                resolve( plistContents );

            } catch(e) {
                debug("generatePropertyListContents err %0", e);
                reject(e);
            }

        });
    }
}

module.exports = MenuBackground;
