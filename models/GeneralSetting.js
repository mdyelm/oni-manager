////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var maUtil = require('../util/maUtil');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var fs = require("fs");
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp")
var path = require("path");
var debug = require('debug')('om/model/generalSetting');
var util = require("util");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var appDAO = require(process.cwd() + '/dao/appDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var GeneralSetting = {

    // --------------------------------------------------------------------------------------------------------------------
    // リソースビルド
    // --------------------------------------------------------------------------------------------------------------------

    generateResources: function( args ){
        return new Promise( async function(resolve, reject){
            debug("generateResources");

            try {
                var languages = await languagesDAO.fetch();
                var os = await osDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION")
                ])
                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;
                var results = []

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

            var plistContents = []

            try {

                var _args = args;

                var languages = await languagesDAO.fetch();
                var os = await osDAO.fetch();
                var app = await appDAO.fetch();

                maUtil.nestedLoop({
                    targets: [
                        {data: languages, name: "language"},
                        {data: os, name: "os"}
                    ],
                    mainFunction: function( args ){

                        var language = args.language;
                        var os = args.os;

                        // ==================================================
                        // mainMenu.plist
                        // ==================================================

                        var content = {
                            appVersion: "",
                            zipVersion: "",
                            contents: {
                              noticeUrl: "",
                            }
                        }

                        // appVersion
                        if (os.code == "ios"){
                          content.appVersion = app["SETTINGS_APPVERSION_"+ os.code.toUpperCase()].value;
                        } else {
                          content.appVersion = app["SETTINGS_APPVERSION_"+ os.code.toUpperCase() + "_" + language.code.toUpperCase()].value;
                        }

                        if ( content.appVersion.indexOf("#") != -1 ) { delete content.appVersion; } // #付きバージョンは出力しない

                        // noticeUrl
                        if ( _args.enviromentType == "test" ) {
                            content.contents.noticeUrl = vsprintf("%stopics_%s_%s.html", [
                                config.get("app.dataSet.topicURL.test"),
                                language.code,
                                os.code
                            ]);
                        } else if ( _args.enviromentType == "production" ) {
                            content.contents.noticeUrl = app["SETTINGS_TOPICS_URL_"+ language.code.toUpperCase() + "_" + os.code.toUpperCase()].value;
                        }

                        // zipVersion
                        content.zipVersion = app["SETTINGS_ZIPVERSION_"+ os.code.toUpperCase() + "_" + language.code.toUpperCase()].value;

                        // plist生成リストに追加
                        var envedPlists = [
                            {
                                type: "mainMenu",
                                code: vsprintf("mainMenu_%s_%s", [
                                    language.code,
                                    os.code
                                ]), //保存先をconfig.jsonから取得する際に使用
                                fileName: language.code + "_" + os.code + "_mainMenu.plist",
                                pathVariables: {
                                    apiVersion: app["SETTINGS_APIVERSION"].value
                                },
                                content: Object.assign({}, content)
                            },
                        ]
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

module.exports = GeneralSetting;
