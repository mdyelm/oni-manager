////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var plist = require('plist');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var fs = require("fs");
var fse = require("fs-extra");
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp")
var path = require("path");
var util = require("util");
var git = require("simple-git");
var debug = require('debug')('om/util/exporter');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Topic = require(process.cwd() + '/models/Topic');
var Menu = require(process.cwd() + '/models/Menu');
var MenuBackground = require(process.cwd() + '/models/MenuBackground');
var Pickup = require(process.cwd() + '/models/Pickup');
var Situation = require(process.cwd() + '/models/Situation');
var GeneralSetting = require(process.cwd() + '/models/GeneralSetting');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function _buildResources( exportObjects, buildDirectory, enviromentType ){
    return new Promise( async function( resolve, reject ){
        debug("buildResources");

        try {

            // --------------------------------------------------------------------------------------------------------------------
            // 出力リスト作成
            // --------------------------------------------------------------------------------------------------------------------

            var outputList = []
            for ( let object of exportObjects ) {
                var results = await object.generateResources({
                    enviromentType: enviromentType
                });
                results.forEach(function( result ) {
                    outputList = outputList.concat( result );
                });
            }

            // --------------------------------------------------------------------------------------------------------------------
            // 出力リストをもとに使用ファイルをビルドフォルダにコピー
            // --------------------------------------------------------------------------------------------------------------------

            outputList.forEach(function( output ){
                var fromPath = process.cwd() + output.fromPath;
                var destPath = vsprintf("%s%s%s/%s", [
                    process.cwd(),
                    buildDirectory,
                    enviromentType,
                    output.destPath
                ]);

                debug("[copy] %s -> %s", fromPath, destPath );
                mkdirp.sync( path.dirname( destPath ) );
                fse.copySync( fromPath, destPath );

            });

            // --------------------------------------------------------------------------------------------------------------------

            debug("buildResources finished");
            resolve();

        } catch(e) {
            debug("buildResources err %0", e);
            reject(e);
        }

    });
}

function _buildPropertyLists( exportObjects, buildDirectory, enviromentType ){
    return new Promise( async function( resolve, reject ){
        debug("buildPropertyLists");

        try {

            // --------------------------------------------------------------------------------------------------------------------
            // 出力リスト作成
            // --------------------------------------------------------------------------------------------------------------------

            var rawPlistContents = []
            for ( let object of exportObjects ) {
                var results = await object.generatePropertyListContents({
                    enviromentType: enviromentType
                });

                results.forEach(function( result ) {
                    rawPlistContents = rawPlistContents.concat( result );
                });
            }

            // --------------------------------------------------------------------------------------------------------------------
            // 同じplistファイルの内容をマージする
            // --------------------------------------------------------------------------------------------------------------------

            var plistContents = []

            rawPlistContents.forEach(function( rawPlistContent ){

                var index = plistContents.findIndex(function( item ){
                    return ( item.code == rawPlistContent.code );
                });

                var isContentAvailable = (index >= 0);

                // ----------------------------------------------------------------------------------------------------
                // 同ファイルに対する内容がない場合は生成対象に追加
                // ----------------------------------------------------------------------------------------------------

                if( isContentAvailable == false ) {
                    plistContents.push( rawPlistContent );
                    return false;
                }

                // ----------------------------------------------------------------------------------------------------
                // 同ファイルに対する内容がある場合はマージ
                // ----------------------------------------------------------------------------------------------------

                if( isContentAvailable == true ) {

                    var targetPlistContent = plistContents[index];

                    if ( rawPlistContent.type != "mainMenu" ) {
                        plistContents[index].content = Object.assign( plistContents[index].content, rawPlistContent.content );
                    }

                    if ( rawPlistContent.type == "mainMenu" ) {

                        var contentKeys = Object.keys( rawPlistContent.content );

                        contentKeys.forEach(function( key ){

                            if ( key != "contents" ) {
                                targetPlistContent.content[key] = rawPlistContent.content[key];
                                return false;
                            }

                            if ( key == "contents" ) {

                                var contentSubKeys = Object.keys( rawPlistContent.content[key] );

                                contentSubKeys.forEach(function( subKey ){

                                    if ( subKey != "list" ) {
                                        targetPlistContent.content.contents[subKey] = rawPlistContent.content.contents[subKey];
                                        return false;
                                    }

                                    if ( subKey == "list" ) {
                                        if ( targetPlistContent.content.contents.list == undefined ) targetPlistContent.content.contents.list = []
                                        var isParamAvailable = ( rawPlistContent.content.contents.list && rawPlistContent.content.contents.list.length );
                                        if ( isParamAvailable ) {
                                            rawPlistContent.content.contents.list.forEach(function( listItem, i ){
                                                if ( targetPlistContent.content.contents.list[i] == undefined ) targetPlistContent.content.contents.list[i] = {}
                                                targetPlistContent.content.contents.list[i] = Object.assign(targetPlistContent.content.contents.list[i], listItem);
                                            });
                                        }
                                    }

                                });

                            }

                        });

                    }

                }

            })

            // --------------------------------------------------------------------------------------------------------------------
            // plist作成
            // --------------------------------------------------------------------------------------------------------------------

            if ( plistContents.length ) {

                plistContents.forEach(function( plistContent ){

                    // ----------------------------------------------------------------------------------------------------
                    // 保存先パス作成
                    // ----------------------------------------------------------------------------------------------------

                    var saveDirectoryPath = config.get("app.paths.plist.build." + plistContent.type);

                    if ( typeof saveDirectoryPath == "object" ) {
                        var variables = []
                        saveDirectoryPath.variables.forEach(function( variableName ){
                            switch( variableName ) {
                                case "apiVersion":
                                variables.push( plistContent.pathVariables.apiVersion );
                                break;

                                case "situationCode":
                                variables.push( plistContent.pathVariables.situationCode );
                                break;

                                case "languageCode":
                                variables.push( plistContent.pathVariables.languageCode );
                                break;
                            }
                        });
                        saveDirectoryPath = vsprintf( saveDirectoryPath.path, variables );
                    }

                    var fileSavePath = vsprintf( "%s%s%s/%s/%s", [
                        process.cwd(),
                        buildDirectory,
                        enviromentType,
                        saveDirectoryPath,
                        plistContent.fileName
                    ]);

                    // ----------------------------------------------------------------------------------------------------
                    // リストを基にplist作成
                    // ----------------------------------------------------------------------------------------------------

                    var plistBody = plist.build( plistContent.content );

                    debug("[plistSaved] %s", fileSavePath );
                    mkdirp.sync( path.dirname( fileSavePath ) ); // フォルダ事前作成
                    fs.writeFileSync( fileSavePath, plistBody); // ファイル作成

                })
            }

            // ----------------------------------------------------------------------------------------------------

            debug("buildResources finished");
            resolve();

        } catch(e) {
            debug("buildResources err %0", e);
            reject(e);
        }

    });
}


var exporter = {

    export: function( options ){
        return new Promise( async function( resolve, reject ){
            debug("export", options);

            try {

                var defaultOptions = {
                    enviromentType: "test", // test, production
                    git: {
                        user: "unknown",
                    }
                }
                options = Object.assign(defaultOptions, options);

                // --------------------------------------------------------------------------------------------------------------------
                // 対象オブジェクト定義
                // --------------------------------------------------------------------------------------------------------------------

                var exportObjects = [
                    Menu,
                    MenuBackground,
                    Pickup,
                    Situation,
                    GeneralSetting,
                ]

                // --------------------------------------------------------------------------------------------------------------------
                // ビルドディレクトリパス取得
                // --------------------------------------------------------------------------------------------------------------------

                var buildDirectory = config.get("app.paths._base.build");

                // --------------------------------------------------------------------------------------------------------------------
                // ビルドディレクトリのアプリデータ保存ディレクトリを空にする
                // --------------------------------------------------------------------------------------------------------------------

                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                ])
                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                fse.emptyDirSync( vsprintf( "%s%s%s/%s", [ process.cwd(), buildDirectory, options.enviromentType, apiVersion ] ) );

                // --------------------------------------------------------------------------------------------------------------------
                // 処理定義
                // --------------------------------------------------------------------------------------------------------------------

                function _mastering(){
                    return new Promise( async function( resolve, reject ){
                        debug("mastering");

                        try {

                            // ----------------------------------------------------------------------------------------------------
                            // パラメータ＆設定取得
                            // ----------------------------------------------------------------------------------------------------

                            var keyValues = maUtil.combineKeyValues([
                                await appDAO.fetchItem("SETTINGS_APIVERSION"),
                            ])

                            var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                            // ----------------------------------------------------------------------------------------------------
                            // developブランチにコミット
                            // ----------------------------------------------------------------------------------------------------

                            function _commitGit(){
                                return new Promise(function( resolve, reject ) {
                                    debug("commitGit");

                                    // テスト版のexportではスキップする
                                    if ( options.enviromentType != "production" ){
                                        debug("commitGit skipped");
                                        resolve();
                                        return false;
                                    }

                                    // git管理用ディレクトリ(運用サーバー内リポジトリ)のパス取得
                                    var localRepositoryPath = config.get("gitConfig.path.local");

                                    // git操作
                                    git( process.cwd() + localRepositoryPath )
                                        .addConfig("user.name", options.git.user)
                                        .addConfig("user.email", "anonymous@media-active.co.jp")
                                        .checkout("develop", function(){

                                            var wrapDirectoryName = "inner";
                                            var commitMessage = "差分チェック用";

                                            // フォルダを作成
                                            mkdirp.sync( process.cwd() + localRepositoryPath + "inner" );
                                            fse.emptyDirSync( process.cwd() + localRepositoryPath + "inner" );

                                            // ビルドディレクトリからgit管理用ディレクトリにファイルをコピー
                                            var fromPath = vsprintf("%s%s%s/%s/", [
                                                process.cwd(),
                                                buildDirectory,
                                                options.enviromentType,
                                                apiVersion
                                            ]);
                                            var destPath = vsprintf("%s%s%s/%s", [ // 中身を空にしやすくするためinner内にコピー
                                                process.cwd(),
                                                localRepositoryPath,
                                                wrapDirectoryName,
                                                apiVersion
                                            ]);
                                            fse.copySync( fromPath, destPath );

                                            // コミット
                                            git( process.cwd() + localRepositoryPath )
                                                .add("--all")
                                                .commit("(管理画面コミット)" + commitMessage, function(){
                                                    resolve();
                                                });

                                        })

                                });
                            }


                            // ----------------------------------------------------------------------------------------------------
                            // zip処理
                            // ----------------------------------------------------------------------------------------------------

                            function _zip(){
                                return new Promise(async function( resolve, reject )  {
                                    debug("zip");

                                    try {

                                        // ---------------------------------------------
                                        // メニューの素材をzip対象に追加
                                        // ex.situationList/zip/lang_os_mainMenu
                                        // ---------------------------------------------
                                        function _getMenuZipTargetList(){
                                            return new Promise( async function( resolve, reject ){
                                                debug("getMenuZipTargetList");

                                                try {

                                                    var basePath = vsprintf("%s%s%s/%s/situationList/zip/",[
                                                        process.cwd(),
                                                        buildDirectory,
                                                        options.enviromentType,
                                                        apiVersion
                                                    ]);

                                                    var isZipDirectoryExists = await maUtil.getDirectoryExists( basePath );
                                                    if ( isZipDirectoryExists == false ) {
                                                        resolve([]);
                                                        return false;
                                                    }

                                                    // メニュー素材のフォルダをzip対象リストを追加
                                                    var zipTargets = []
                                                    var folders = await maUtil.getFileList(basePath);
                                                    folders.forEach(function( folder ){
                                                        zipTargets.push({
                                                            savePath: basePath + folder + ".zip",
                                                            directoryPath: basePath + folder,
                                                            saveDirectoryName: folder
                                                        });
                                                    });

                                                    resolve(zipTargets);

                                                } catch(e) {
                                                    debug("getMenuZipTargetList err %0", e);
                                                }

                                            });
                                        }

                                        // ---------------------------------------------
                                        // シチュエーションの素材をzip対象に追加
                                        // ex. situationResources/name/_name(共通zip)
                                        // ex. situationResources/name/lang_name(言語zip)
                                        // ---------------------------------------------
                                        function _getSituationZipTargetList(){
                                            return new Promise( async function( resolve, reject ){
                                                debug("getSituationZipTargetList");

                                                try {

                                                    var basePath = vsprintf("%s%s%s/%s/situationResources/", [
                                                        process.cwd(),
                                                        buildDirectory,
                                                        options.enviromentType,
                                                        apiVersion
                                                    ]);

                                                    var isZipDirectoryExists = maUtil.getDirectoryExists( basePath );
                                                    if ( isZipDirectoryExists == false ){
                                                        resolve([]);
                                                        return false;
                                                    }

                                                    // situationResources/folder/subFolder/
                                                    var zipTargets = []
                                                    var folders = await maUtil.getFileList( basePath );

                                                    for ( let folder of folders ) {
                                                        var subFolders = await maUtil.getFileList( basePath + folder );
                                                        subFolders.forEach(function( subFolder ){
                                                            var path = basePath + folder + "/" + subFolder;
                                                            var isDirectory = ( fs.existsSync(path) && fs.statSync(path).isDirectory() ); // ディレクトリはすべてzip対象
                                                            if ( isDirectory ){
                                                                zipTargets.push({
                                                                    savePath: path + ".zip",
                                                                    directoryPath: path,
                                                                    saveDirectoryName: subFolder
                                                                });
                                                            }
                                                        });
                                                    }

                                                    debug("getSituationZipTargetList finished");
                                                    resolve(zipTargets);

                                                } catch(e) {
                                                    debug("getSituationZipTargetList err %0", e);
                                                }

                                            });
                                        }

                                        // ---------------------------------------------
                                        // 圧縮作業
                                        // ---------------------------------------------
                                        function _zipTargets( zipTargetList ){
                                            return new Promise( async function( resolve, reject ){
                                                debug("zipTargets");

                                                try {

                                                    for ( let zipTarget of zipTargetList ) {

                                                        // step1 ZIP
                                                        var isZipDirectoryExists = await maUtil.getDirectoryExists( zipTarget.directoryPath );
                                                        if( isZipDirectoryExists ){
                                                            await maUtil.zipDirectory( zipTarget )
                                                        }

                                                        // step2 ZIP化した元フォルダを削除
                                                        var isZipDirectoryExists = await maUtil.getDirectoryExists( zipTarget.directoryPath );
                                                        if( isZipDirectoryExists ){
                                                            await maUtil.removeDirectory( zipTarget.directoryPath )
                                                        }

                                                    }

                                                    resolve();

                                                } catch(e) {
                                                    debug("zipTargets err %0", e);
                                                }

                                            })
                                        }


                                        var zipTargetList = [].concat(
                                            await _getMenuZipTargetList(),
                                            await _getSituationZipTargetList()
                                        )

                                        await _zipTargets(zipTargetList);

                                        debug("zip finished");
                                        resolve();

                                    } catch(e) {
                                        debug("zip err %0", e);
                                    }

                                });
                            }

                            // ----------------------------------------------------------------------------------------------------

                            await _commitGit();
                            await _zip();

                            // ----------------------------------------------------------------------------------------------------

                            debug("mastering finished");
                            resolve();

                        } catch(e) {
                            debug("mastering err %0", e);
                        }

                    });
                }

                // ----------------------------------------------------------------------------------------------------

                await _buildResources( exportObjects, buildDirectory, options.enviromentType );
                await _buildPropertyLists( exportObjects, buildDirectory, options.enviromentType );
                await _mastering();

                // --------------------------------------------------------------------------------------------------------------------

                debug("export finished");
                resolve();

            } catch(e) {
                debug("export err %0", e);
            }

        });
    },

    topicExport: function( options ) {
        return new Promise( async function( resolve, reject ) {
            debug("topicExport", options);

            try {

                var defaultOptions = {
                    enviromentType: "test", // test, production
                }
                options = Object.assign(defaultOptions, options);

                // --------------------------------------------------------------------------------------------------------------------
                // 対象オブジェクト定義
                // --------------------------------------------------------------------------------------------------------------------

                var exportObjects = [ Topic ]

                // --------------------------------------------------------------------------------------------------------------------
                // ビルドディレクトリパス取得
                // --------------------------------------------------------------------------------------------------------------------

                var buildDirectory = config.get("app.paths._base.build");

                // --------------------------------------------------------------------------------------------------------------------

                await _buildResources( exportObjects, buildDirectory, options.enviromentType );

                // --------------------------------------------------------------------------------------------------------------------

                debug("topicExport finished");
                resolve();

            } catch(e) {
                debug("topicExport err %0", e);
                reject(e);
            }

        });
    },

}

module.exports = exporter;
