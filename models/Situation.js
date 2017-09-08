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
var debug = require('debug')('om/model/situation');
var util = require("util");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
var menusDAO = require(process.cwd() + '/dao/menusDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Situation = {

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
                var situations = await situationsDAO.fetch();
                var situationDetails = await situationDetailsDAO.fetch();
                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_CATEGORIES"),
                    await appDAO.fetchItem("SETTINGS_APIVERSION")
                ])

                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                // シチュエーション詳細にシチュエーションを追加する
                var modifiedSituationDetails = []

                situationDetails.forEach(function( situationDetail, i ){
                    var matchedSituation = situations.filter(function( situation ){
                        return ( situationDetail.situationId == situation.id )
                    })[0];
                    modifiedSituationDetails[i] = Object.assign( situationDetail, {
                        situation: matchedSituation ? matchedSituation : ""
                    });
                });

                // ステータスが無効になっているものを出力対象から除外する

                if ( args.enviromentType == "test" ) {
                    var enabledDetails = modifiedSituationDetails.filter(function( situationDetail ){
                        return ( situationDetail.isEnabled == SITUATION_STATUS_ENABLED ||
                        situationDetail.isEnabled == SITUATION_STATUS_TESTING );
                    });
                } else if( args.enviromentType == "production" ) {
                    var enabledDetails = modifiedSituationDetails.filter(function( situationDetail ){
                        return ( situationDetail.isEnabled == SITUATION_STATUS_ENABLED );
                    })
                }

                // シチュエーション詳細を言語OS構造体として取得
                var enabledEnvedSituationDetails = maUtil.getEnvedObject( languages, os, enabledDetails );

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

                        enabledEnvedSituationDetails[language.code][os.code].forEach(function( situationDetail ){

                            // 有料対応
                            // ex.
                            // 無料：situationHoge
                            // 有料：situationHoge(日本),situationHoge_ko,situationHoge_hk...etc
                            if ( situationDetail.situation.isPayment && language.code == "jp" ){
                                var situationCode = situationDetail.situation.code; // すでに日本用の有料シチュエーションが「シチュエーション名」のみで販売されており変更できない
                            } else if ( situationDetail.situation.isPayment ) {
                                var situationCode = situationDetail.situation.code + "_" + language.code;
                            } else {
                                var situationCode = situationDetail.situation.code;
                            }

                            // ストア画像
                            if ( situationDetail.storeThumbnailImagePath ){
                                var currentConfig = config.get("app.paths.situations.build.storeThumbnail");
                                var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                    apiVersion: apiVersion,
                                    situationCode: situationCode
                                }) );
                                var destPath =  vsprintf("%s_%s%s", [ directory, situationCode, path.extname( situationDetail.storeThumbnailImagePath ) ] );
                                results.push({
                                    name: "storeThumbnail",
                                    fromPath: situationDetail.storeThumbnailImagePath,
                                    destPath: destPath
                                });
                            }

                            // スペシャルボタン背景
                            if ( situationDetail.isUseSpecialButton == 1 ) {
                                var currentConfig = config.get("app.paths.situations.build.specialButton");
                                var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                    apiVersion: apiVersion,
                                    situationCode: situationCode
                                }) );
                                var destPath = directory + maUtil.getFileName(situationDetail.specialButtonImagePath);
                                results.push({
                                    name: "specialButton",
                                    fromPath: situationDetail.specialButtonImagePath,
                                    destPath: destPath
                                });
                            }

                            // シーンセット系
                            if ( situationDetail.sceneSets ){

                                var currentSceneSets = JSON.parse(situationDetail.sceneSets);
                                var isSingleSceneSet = ( currentSceneSets.length == 1);

                                currentSceneSets.forEach(function( currentSceneSet ){

                                    // 着信中 背景画像
                                    if ( currentSceneSet.callBackgroundImagePath ){
                                        var currentConfig = config.get("app.paths.situations.build.callBackground");
                                        var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                            apiVersion: apiVersion,
                                            situationCode: situationCode
                                        }) );
                                        var destPath = directory + maUtil.getFileName(currentSceneSet.callBackgroundImagePath);
                                        results.push({
                                            name: "callBackground",
                                            fromPath: currentSceneSet.callBackgroundImagePath,
                                            destPath: destPath
                                        });
                                    }

                                    // 着信中 スペシャル着信音
                                    if ( ( currentSceneSet.isUseSpecialCallSound == 1 ) && currentSceneSet.specialCallSoundPath ) {
                                        var currentConfig = config.get("app.paths.situations.build.callSpecialSound");
                                        var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                            apiVersion: apiVersion,
                                            situationCode: situationCode
                                        }) );
                                        var destPath = directory + maUtil.getFileName(currentSceneSet.specialCallSoundPath);
                                        results.push({
                                            name: "specialCallSound",
                                            fromPath: currentSceneSet.specialCallSoundPath,
                                            destPath: destPath
                                        });
                                    }

                                    // 通話 BGM
                                    if( currentSceneSet.sceneSoundBGMPath ) {
                                        var currentConfig = config.get("app.paths.situations.build.talkSoundBGM");
                                        var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                            apiVersion: apiVersion,
                                            situationCode: situationCode
                                        }) );
                                        var destPath = directory + maUtil.getFileName( currentSceneSet.sceneSoundBGMPath );
                                        results.push({
                                            name: "talkSoundBGM",
                                            fromPath: currentSceneSet.sceneSoundBGMPath,
                                            destPath: destPath
                                        });
                                    }

                                    // 通話 シーン画像
                                    if( currentSceneSet.scenes && currentSceneSet.scenes.length ) {
                                        var currentConfig = config.get("app.paths.situations.build.talkScene");
                                        var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                            apiVersion: apiVersion,
                                            situationCode: situationCode
                                        }) );
                                        currentSceneSet.scenes.forEach(function( scene ){
                                            if (scene.sceneBackgroundImagePath) {
                                                var destPath = directory + maUtil.getFileName( scene.sceneBackgroundImagePath );
                                                results.push({
                                                    name: "talkScene",
                                                    fromPath: scene.sceneBackgroundImagePath,
                                                    destPath: destPath
                                                });
                                            }
                                        });
                                    }

                                    // 通話 リピート最終シーン画像
                                    if( currentSceneSet.repeatLastScenes && currentSceneSet.repeatLastScenes.length ) {
                                        var currentConfig = config.get("app.paths.situations.build.talkScene");
                                        var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                            apiVersion: apiVersion,
                                            situationCode: situationCode
                                        }) );
                                        currentSceneSet.repeatLastScenes.forEach(function( scene ){
                                            var destPath = directory + maUtil.getFileName( scene.sceneBackgroundImagePath );
                                            results.push({
                                                name: "talkScene",
                                                fromPath: scene.sceneBackgroundImagePath,
                                                destPath: destPath
                                            });
                                        });
                                    }

                                    if ( situationDetail.sceneMediaType == "image" ) {

                                        // 通話 通話音声
                                        if( currentSceneSet.sceneSoundPath ) {
                                            var currentConfig = config.get("app.paths.situations.build.talkSound");
                                            var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                                apiVersion: apiVersion,
                                                situationCode: situationCode,
                                                language: language
                                            }) );

                                            // シーンセットが複数ある場合は出力先を変更する
                                            if ( isSingleSceneSet ) {
                                                var destPath = directory + maUtil.getFileName( currentSceneSet.sceneSoundPath );
                                            } else {
                                                var destPath = vsprintf("%s/%s/%s", [
                                                    directory,
                                                    currentSceneSet.code,
                                                    maUtil.getFileName( currentSceneSet.sceneSoundPath )
                                                ] );
                                            }

                                            results.push({
                                                name: "talkSound",
                                                fromPath: currentSceneSet.sceneSoundPath,
                                                destPath: destPath
                                            });

                                        }

                                    } else if ( situationDetail.sceneMediaType == "video" ) {

                                        // 通話 通話動画
                                        if( currentSceneSet.sceneVideoPath ) {
                                            var currentConfig = config.get("app.paths.situations.build.talkVideo");
                                            var directory = vsprintf( currentConfig.path, maUtil.setVariables(currentConfig.variables, {
                                                apiVersion: apiVersion,
                                                situationCode: situationCode,
                                                language: language
                                            }) );

                                            // シーンセットが複数ある場合は出力先を変更する
                                            if ( isSingleSceneSet ) {
                                                var destPath = directory + maUtil.getFileName( currentSceneSet.sceneVideoPath );
                                            } else {
                                                var destPath = vsprintf("%s/%s/%s", [
                                                    directory,
                                                    currentSceneSet.code,
                                                    maUtil.getFileName( currentSceneSet.sceneVideoPath )
                                                ] );
                                            }

                                            results.push({
                                                name: "talkVideo",
                                                fromPath: currentSceneSet.sceneVideoPath,
                                                destPath: destPath
                                            });

                                        }

                                    }

                                });

                            }

                        });

                    }

                })

                debug("generateResources finished", results);
                resolve(results);

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
                var situations = await situationsDAO.fetch();
                var situationDetails = await situationDetailsDAO.fetch();
                var menus = await menusDAO.fetch();

                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                    await appDAO.fetchItem("SETTINGS_CATEGORIES")
                ])

                // シチュエーション詳細に対応するシチュエーション・メニューを追加する
                var modifiedSituationDetails = []
                situationDetails.forEach(function( situationDetail, i ){

                    var matchedSituation = situations.filter(function( situation ){
                        return ( situationDetail.situationId == situation.id )
                    })[0];

                    var matchedMenu = menus.filter(function( menu ){
                        return ( situationDetail.situationId == menu.situationId ) &&
                            ( situationDetail.languageId == menu.languageId ) &&
                            ( situationDetail.osId == menu.osId );
                    })[0];

                    modifiedSituationDetails[i] = Object.assign( situationDetail, {
                        situation: matchedSituation ? matchedSituation : "",
                        menu: matchedMenu ? matchedMenu: "",
                    });

                });

                // ステータスが無効になっているものを出力対象から除外する
                if ( args.enviromentType == "test" ) {
                    var enabledDetails = modifiedSituationDetails.filter(function( situationDetail ){
                        return ( situationDetail.isEnabled == SITUATION_STATUS_ENABLED ||
                        situationDetail.isEnabled == SITUATION_STATUS_TESTING );
                    });
                } else if( args.enviromentType == "production" ) {
                    var enabledDetails = modifiedSituationDetails.filter(function( situationDetail ){
                        return ( situationDetail.isEnabled == SITUATION_STATUS_ENABLED );
                    })
                }

                // シチュエーション詳細の言語OS構造体を取得する
                var enabledEnvedSituationDetails = maUtil.getEnvedObject( languages, os, enabledDetails );


                // メニューにシチュエーション詳細を追加する
                var modifiedMenus = []
                menus.forEach(function( menu, i ){

                    var matchedSituation = situations.filter(function( situation ){
                        return ( situation.id == menu.situationId )
                    })[0];

                    var matchedSituationDetail = situationDetails.filter(function( situationDetail ){
                        return ( situationDetail.situationId == menu.situationId ) &&
                        ( situationDetail.languageId == menu.languageId ) &&
                        ( situationDetail.osId == menu.osId );
                    })[0];

                    modifiedMenus[i] = Object.assign( menu, {
                        situation: matchedSituation ? matchedSituation : "",
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

                // メニューの言語OS構造体を取得する
                var enabledEnvedMenus = maUtil.getEnvedObject( languages, os, enabledMenus );

                // カテゴリ分け＆カテゴリ内でソート
                var envedCategories = JSON.parse(keyValues["SETTINGS_CATEGORIES"].value); // カテゴリ取得

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

                        Object.keys( enabledEnvedMenus[language.code][os.code] ).forEach( function( key ){
                            var categorizedMenu = enabledEnvedMenus[language.code][os.code][key];
                            categorizedMenu.forEach(function( menu ){

                                var situationDetail = menu.situationDetail;
                                var situation = menu.situation;

                                // 有料対応
                                if ( situationDetail.situation.isPayment && language.code == "jp" ){ // すでに日本用の有料シチュエーションが「シチュエーション名」のみで販売されており変更できない
                                    var situationCode = situationDetail.situation.code;
                                } else if ( situationDetail.situation.isPayment ) {
                                    var situationCode = situationDetail.situation.code + "_" + language.code;
                                } else {
                                    var situationCode = situationDetail.situation.code;
                                }

                                var list = {
                                    category: ( situation.isPayment ) ? "premium" : "free",
                                    itemName: situationCode,
                                    point: situationDetail.price,
                                    textName: situationDetail.situationName,
                                    charaName: situationDetail.characterName,
                                    startDate: situationDetail.showTermStart ? moment(situationDetail.showTermStart, "YYYY/MM/DD").format("YYYY-MM-DD") : "",
                                    endDate: situationDetail.showTermEnd ? moment(situationDetail.showTermEnd, "YYYY/MM/DD").format("YYYY-MM-DD") : "",
                                    versions: {
                                        base_version: situation.version
                                    }
                                }

                                // 言語バージョン
                                list.versions[language.code + "_version"] = situationDetail.version;

                                // -------------------------------------------------------------------------------------------------------------
                                // option (使用する場合のみ追加)
                                // -------------------------------------------------------------------------------------------------------------

                                // webインターステイシャル
                                if ( situationDetail.interstitialType == "web" && situationDetail.webInterstitialUrl ) list.specialInterstitial = situationDetail.webInterstitialUrl;

                                // ストア対応
                                if ( situationDetail.situation.isPayment && situationDetail.storeText ) list.storeSerif = situationDetail.storeText;

                                // フッター広告
                                if ( situationDetail.isHiddenFooterAd == 1 ) list.footer = "off";

                                // 拒否ボタン押下時のインターステイシャルスキップ
                                if ( situationDetail.isSkipInterstitialOnDecline == 1 ) list.decline_button_interstitial = "no";

                                // youtubeインターステイシャル
                                if ( situationDetail.interstitialType == "youtube" ) list.youtube = situationDetail.youtubeUrl;

                                // シェアボタンの表示
                                if ( situationDetail.isSituationShareHidden == 1 ) list.disableSituationShare = "yes";

                                // 動画シチュエーション
                                if ( situationDetail.sceneMediaType == "video" ) list.isVideoSituation = true;

                                // シーンセット設定
                                if ( situationDetail.sceneSets ){
                                    var currentSceneSets = JSON.parse(situationDetail.sceneSets);
                                    var isSingleSceneSet = ( currentSceneSets.length == 1);

                                    if ( isSingleSceneSet == false ) {
                                        list.variations = []
                                        currentSceneSets.forEach(function( sceneSet ){
                                            list.variations.push({
                                                distributeRatio: parseInt( sceneSet.selectRatio ),
                                                name: sceneSet.code,
                                                analyticsName: sceneSet.analyticsName
                                            });
                                        });
                                    }

                                }

                                content.contents.list.push( list );

                            });
                        });

                        // ----------------------------------------------------------------------------------------------------
                        // plist生成リストに追加
                        // ----------------------------------------------------------------------------------------------------

                        var envedPlists = [
                            {
                                type: "mainMenu", // 保存先をconfig.jsonから取得する際に使用
                                code: "mainMenu_" + language.code + "_" + os.code, // マージ識別用
                                fileName: language.code + "_" + os.code + "_mainMenu.plist", // 保存名
                                pathVariables: {
                                    apiVersion: keyValues["SETTINGS_APIVERSION"].value
                                },
                                content: content
                            },
                        ]

                        plistContents = plistContents.concat( envedPlists );


                        // ==================================================
                        // situationInfo.plist
                        // ==================================================

                        // ----------------------------------------------------------------------------------------------------
                        // plistの内容を定義
                        // ----------------------------------------------------------------------------------------------------

                        enabledEnvedSituationDetails[language.code][os.code].forEach(function( situationDetail ){

                            var content = {}

                            // 有料対応
                            if ( situationDetail.situation.isPayment && language.code == "jp" ){ // すでに日本用の有料シチュエーションが「シチュエーション名」のみで販売されており変更できない
                                var situationCode = situationDetail.situation.code;
                            } else if ( situationDetail.situation.isPayment ) {
                                var situationCode = situationDetail.situation.code + "_" + language.code;
                            } else {
                                var situationCode = situationDetail.situation.code;
                            }

                            if ( situationDetail.sceneSets ){
                                var currentSceneSets = JSON.parse( situationDetail.sceneSets );
                                var isSingleSceneSet = ( currentSceneSets.length == 1);

                                currentSceneSets.forEach(function( sceneSet ){

                                    var content = {
                                        itemName: situationCode,
                                        langVersion: situationDetail.version,
                                        charaName: ( situationDetail.characterName) ? situationDetail.characterName : "キャラ名未登録",
                                        charaNumber: ( sceneSet.phoneNumber ) ? sceneSet.phoneNumber : "電話番号未登録",
                                        backPicName: maUtil.getFileName( sceneSet.callBackgroundImagePath ),
                                        callingVolume: String(parseFloat(sceneSet.callSoundVolume).toFixed(1)),
                                    }

                                    // -------------------------------------------------------------------------------------------------------------
                                    // option (使用する場合のみ追加)
                                    // -------------------------------------------------------------------------------------------------------------

                                    // スペシャル着信音
                                    if( sceneSet.isUseSpecialCallSound == 1 ) content.specialCalling = maUtil.getFileName( sceneSet.specialCallSoundPath );

                                    // スペシャル着信ボタン
                                    if( situationDetail.isUseSpecialButton == 1 ){
                                        content.buttonNameCalling = maUtil.getFileName( situationDetail.specialButtonImagePath );
                                        content.buttonNameTalking = maUtil.getFileName( situationDetail.specialButtonImagePath );
                                    }

                                    // シーン内容 (動画 or 画像+音声)
                                    if ( situationDetail.sceneMediaType == "image" ) {

                                        // 通話音声
                                        if ( sceneSet.sceneSoundPath ) {
                                            content.voiceName = maUtil.getFileName( sceneSet.sceneSoundPath );
                                        }

                                        // BGM
                                        if(sceneSet.sceneSoundBGMPath){
                                            content.backSound = {
                                                backSoundName: maUtil.getFileName( sceneSet.sceneSoundBGMPath ),
                                                backSoundVolume: String(sceneSet.sceneSoundBGMVolume)
                                            }
                                        }

                                        // 通話中画像＆表示秒数
                                        if( sceneSet.scenes && sceneSet.scenes.length ){
                                            content.backAnimationArray = []
                                            sceneSet.scenes.forEach(function( scene, i ){
                                                content.backAnimationArray.push({
                                                    imageCur: maUtil.getFileName( scene.sceneBackgroundImagePath ),
                                                    imageTime: String( scene.sceneDuration * 1000 ) // 秒→ミリ秒
                                                });

                                                // option
                                                if ( scene.sceneCharacterName ) content.backAnimationArray[i].charaName = scene.sceneCharacterName;
                                                if ( scene.sceneFadeInDelay ) content.backAnimationArray[i].imageDuration = String( scene.sceneFadeInDelay * 1000 ) // 秒→ミリ秒;

                                            });
                                        }

                                        // リピート最終シーンアニメーション
                                        if( sceneSet.repeatLastScenes && sceneSet.repeatLastScenes.length ){
                                            content.repeatAnimation = {
                                                repeatCount: String(0),
                                                repeatAnimationArray: []
                                            }
                                            sceneSet.repeatLastScenes.forEach(function( repeatLastScene, i ){
                                                content.repeatAnimation.repeatAnimationArray.push({
                                                    imageCur: maUtil.getFileName( repeatLastScene.sceneBackgroundImagePath ),
                                                    imageTime: String( repeatLastScene.sceneDuration * 1000 ) // 秒→ミリ秒
                                                });

                                                // option
                                                if ( repeatLastScene.sceneCharacterName ) content.repeatAnimation.repeatAnimationArray[i].charaName = repeatLastScene.sceneCharacterName;
                                                if ( repeatLastScene.sceneFadeInDelay ) content.repeatAnimation.repeatAnimationArray[i].imageDuration = String( repeatLastScene.sceneFadeInDelay * 1000 ) // 秒→ミリ秒;

                                            });
                                        }

                                    } else if ( situationDetail.sceneMediaType == "video" ) {
                                        content.video = { videoName: maUtil.getFileName( sceneSet.sceneVideoPath ) }
                                    }

                                    // ----------------------------------------------------------------------------------------------------
                                    // plist生成リストに追加 (シチュエーションごとに作成)
                                    // ----------------------------------------------------------------------------------------------------

                                    var envedPlists = [
                                        {
                                            type: "situationInfo", //保存先をconfig.jsonから取得する際に使用
                                            code: vsprintf("situationInfo_%s_%s_%s_%s", [
                                                language.code,
                                                os.code,
                                                situationCode,
                                                sceneSet.code
                                            ] ), // マージ識別用
                                            fileName: (isSingleSceneSet) ? "situationInfo.plist" : sceneSet.code + "/situationInfo.plist", // 保存先(シーンセットがある場合はディレクトリをまぜる)
                                            pathVariables: {
                                                apiVersion: keyValues["SETTINGS_APIVERSION"].value,
                                                situationCode: situationCode, // 有料の場合は言語がをまぜる
                                                languageCode: language.code
                                            },
                                            content: content
                                        },
                                    ]

                                    plistContents = plistContents.concat( envedPlists );

                                });

                            }

                        });

                        // ----------------------------------------------------------------------------------------------------

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

module.exports = Situation;
