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
var debug = require('debug')('om/model/pickup');
var util = require("util");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var pickupsDAO = require(process.cwd() + '/dao/pickupsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Pickup = {

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
                var pickups = await pickupsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                ])

                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                // ステータスが無効になっているものを出力対象から除外する
                var enabledPickup = pickups.filter(function( pickup ){
                    return ( pickup.isEnabled == PICKUP_STATUS_ENABLED );
                })

                // ピックアップ枠を言語OS構造体として取得
                var enabledEnvedPickups = maUtil.getEnvedObject( languages, os, enabledPickup );


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

                        enabledEnvedPickups[language.code][os.code].forEach(function( pickup ){

                            // ピックアップバナー画像
                            if ( pickup.bannerImagePath ) {

                                var currentConfig = config.get("app.paths.pickups.build.pickupBanner");
                                var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                    apiVersion: apiVersion
                                }) );

                                var destPath = directory + maUtil.getFileName( pickup.bannerImagePath );
                                results.push({
                                    name: "pickup",
                                    fromPath: pickup.bannerImagePath,
                                    destPath: destPath
                                });

                            }

                            // ネイティブアド背景画像　TODO:

                        });
                    }
                });

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
                var pickups = await pickupsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                ])

                // ステータスが無効になっているものを出力対象から除外する
                var enabledPickups = pickups.filter(function( pickup ){
                    return ( pickup.isEnabled == PICKUP_STATUS_ENABLED );
                })

                // ピックアップ枠を言語OS構造体として取得
                var enabledEnvedPickups = maUtil.getEnvedObject( languages, os, enabledPickups );

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
                            pickupList: [],
                            nativeAdConfig: {}
                        }

                        enabledEnvedPickups[language.code][os.code].forEach(function( pickup ){

                            var pickupListItem = {
                                Version: pickup.version,
                                LinkURL: (function(){
                                  switch( pickup.adType ){
                                    case "normal":
                                      return pickup.linkUrl;
                                      break;
                                    case "nativeAd":
                                      return "ads:GoogleNativeAds";
                                      break;
                                  }

                                }()),
                                ImageName: maUtil.getFileName(pickup.bannerImagePath),
                                StartDate: moment( pickup.adStartDate, "YYYY/MM/DD HH:mm" ).format("YYYY-MM-DD HH:mm"),
                                EndDate: moment( pickup.adEndDate, "YYYY/MM/DD HH:mm" ).format("YYYY-MM-DD HH:mm")
                            }

                            // option
                            if ( pickup.adDuration ) pickupListItem.DisplayTime =  String(pickup.adDuration);

                            content.pickupList.push( pickupListItem );

                        });

                        var envedPlists = [
                            {
                                type: "mainMenu",
                                code: vsprintf("mainMenu_%s_%s", [ language.code, os.code ]), // マージ識別用
                                fileName: language.code + "_" + os.code + "_mainMenu.plist",
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

module.exports = Pickup;
