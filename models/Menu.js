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
var debug = require('debug')('om/model/menu');
var util = require("util");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var menusDAO = require(process.cwd() + '/dao/menusDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Menu = {

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

                var menus = await menusDAO.fetch();
                var situations = await situationsDAO.fetch();
                var situationDetails = await situationDetailsDAO.fetch();

                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_CATEGORIES"),
                    await appDAO.fetchItem("SETTINGS_APIVERSION")
                ]);

                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                // メニューにシチュエーション詳細を追加する
                var modifiedMenus = []
                menus.forEach(function( menu, i ){
                    var matchedSituationDetail = situationDetails.filter(function( situationDetail ){
                        return ( situationDetail.situationId == menu.situationId ) &&
                        ( situationDetail.languageId == menu.languageId ) &&
                        ( situationDetail.osId == menu.osId );
                    })[0];
                    modifiedMenus[i] = Object.assign( menu, {
                        situationDetail: matchedSituationDetail ? matchedSituationDetail : ""
                    });
                });

                // ステータスが無効になっているものを出力対象から除外する

                if ( args.enviromentType == "test" ) {
                    var enabledMenus = modifiedMenus.filter(function( menu ){
                        return ( menu.situationDetail.isEnabled == SITUATION_STATUS_ENABLED ||
                        menu.situationDetail.isEnabled == SITUATION_STATUS_TESTING );
                    });
                } else if( args.enviromentType == "production" ) {
                    var enabledMenus = modifiedMenus.filter(function( menu ){
                        return ( menu.situationDetail.isEnabled == SITUATION_STATUS_ENABLED );
                    })
                }

                // メニューを言語OS構造体として取得
                var enabledEnvedMenus = maUtil.getEnvedObject( languages, os, enabledMenus );

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

                        enabledEnvedMenus[language.code][os.code].forEach(function( menu ){

                            // ボタン(通常)、ボタン(大)背景画像
                            if ( menu.buttonImagePath ) {

                                var path = config.get("app.paths.menus.build.menuButtonBackground").path
                                var variables = config.get("app.paths.menus.build.menuButtonBackground").variables;
                                variables = maUtil.setVariables( variables, {
                                    apiVersion: apiVersion,
                                    language: language,
                                    os: os
                                })

                                var destPath = vsprintf(path, variables) + maUtil.getFileName(menu.buttonImagePath);

                                results.push({
                                    name: "buttonImage",
                                    fromPath: menu.buttonImagePath,
                                    destPath: destPath
                                });

                            }

                            // アイコン画像
                            if ( menu.iconImagePath ) {

                                var path = config.get("app.paths.menus.build.menuButtonIcon").path
                                var variables = config.get("app.paths.menus.build.menuButtonIcon").variables;
                                variables = maUtil.setVariables( variables, {
                                    apiVersion: apiVersion,
                                    language: language,
                                    os: os
                                })

                                var destPath = vsprintf(path, variables) + maUtil.getFileName(menu.iconImagePath);

                                results.push({
                                    name: "iconImage",
                                    fromPath: menu.iconImagePath,
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

            try {

                // ----------------------------------------------------------------------------------------------------
                // データ取得
                // ----------------------------------------------------------------------------------------------------

                var languages = await languagesDAO.fetch();
                var os = await osDAO.fetch();
                var menus = await menusDAO.fetch();
                var situationDetails = await situationDetailsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                    await appDAO.fetchItem("SETTINGS_CATEGORIES")
                ]);


                // カテゴリ取得
                var envedCategories = JSON.parse(keyValues["SETTINGS_CATEGORIES"].value);

                // メニューにシチュエーション詳細を追加する
                var modifiedMenus = []
                menus.forEach(function( menu, i ){

                    var matchedSituationDetail = situationDetails.filter(function( situationDetail ){
                        return ( situationDetail.situationId == menu.situationId ) &&
                        ( situationDetail.languageId == menu.languageId ) &&
                        ( situationDetail.osId == menu.osId );
                    })[0];

                    modifiedMenus[i] = Object.assign( menu, {
                        situationDetail: matchedSituationDetail ? matchedSituationDetail : ""
                    });
                });

                // ステータスが無効になっているものを出力対象から除外する
                if ( args.enviromentType == "test" ) {
                    var enabledMenus = modifiedMenus.filter(function( menu ){
                        return ( menu.situationDetail.isEnabled == SITUATION_STATUS_ENABLED ||
                        menu.situationDetail.isEnabled == SITUATION_STATUS_TESTING );
                    });
                } else if( args.enviromentType == "production" ) {
                    var enabledMenus = modifiedMenus.filter(function( menu ){
                        return ( menu.situationDetail.isEnabled == SITUATION_STATUS_ENABLED );
                    })
                }

                // 言語OS構造体にする
                var enabledEnvedMenus = maUtil.getEnvedObject( languages, os, enabledMenus );

                // カテゴリ分け＆カテゴリ内でソート
                languages.forEach(function(language){
                    os.forEach(function(os){
                        if ( enabledEnvedMenus[language.code][os.code].length ){
                            var categorizedMenus = {}
                            envedCategories[language.code][os.code].forEach(function(category){

                                // カテゴリ分け
                                var menus = enabledEnvedMenus[language.code][os.code].filter(function( menu ){
                                    return ( menu.category == category.code );
                                });

                                // positionで昇順ソート
                                menus = menus.sort(function( a, b ){
                                    if ( a.position < b.position ) return -1;
                                    if ( a.position > b.position ) return 1;
                                    return 0;
                                })

                                categorizedMenus[category.code] = menus;
                            })

                            enabledEnvedMenus[language.code][os.code] = categorizedMenus;

                        }
                    });
                });


                // ----------------------------------------------------------------------------------------------------
                // データ追加
                // ----------------------------------------------------------------------------------------------------

                var plistContents = []

                languages.forEach(function(language){
                    os.forEach(function(os){

                        // ==================================================
                        // mainMenu.plist
                        // ==================================================

                        // ----------------------------------------------------------------------------------------------------
                        // plistの内容を定義
                        // ----------------------------------------------------------------------------------------------------

                        var content = {
                            contents: {
                                list: []
                            }
                        }

                        Object.keys( enabledEnvedMenus[language.code][os.code] ).forEach(function( key ){
                            var categorizedMenus = enabledEnvedMenus[language.code][os.code][key]

                            categorizedMenus.forEach(function( menu ){
                                content.contents.list.push({
                                    genre: menu.category,
                                    imgButtonName: maUtil.getFileName( menu.buttonImagePath, "hideExtension" ),
                                    imgIconName: maUtil.getFileName( menu.iconImagePath, "hideExtension" ),
                                    size: (function(){
                                        switch( menu.bannerSize ) {
                                            case "normal":
                                                return "normal";
                                                break;
                                            case "large":
                                                return "big";
                                                break;
                                        }
                                    }()),
                                });
                            })

                        });

                        // ----------------------------------------------------------------------------------------------------
                        // plist生成リストに追加
                        // ----------------------------------------------------------------------------------------------------

                        var envedPlists = [
                            {
                                type: "mainMenu", //保存先をconfig.jsonから取得する際に使用
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

module.exports = Menu;
