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
var debug = require('debug')('om/util/deployer');
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
var gitManager = require( process.cwd() + '/util/gitManager.js' );
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var deployer = {

    /*
        - オプション取得
        - バックアップ
        - 差分をアップロード＆削除
            - 処理リスト取得
            - リストを基にファイルアップロード
            - リストを基にファイル削除
        - releaseブランチへコミット(本番時のみ)
            - リポジトリの設定変更

    */
    deploy: function( options ){
        return new Promise(async function( resolve, reject ){
            debug("deploy", options);

            // -------------------------------------------------------------------------------------------------------------
            // オプション取得
            // -------------------------------------------------------------------------------------------------------------

            var defaultOptions = {
                enviromentType: "test", // test, production
                git: {
                    user: "unknown",
                    commitMessage: ""
                }
            }
            options = Object.assign(defaultOptions, options);

            try {

                // -------------------------------------------------------------------------------------------------------------
                // 差分をアップロード＆削除
                // -------------------------------------------------------------------------------------------------------------

                function update(){
                    return new Promise(async function( resolve, reject ){
                        debug("update");

                        // 処理リスト取得
                        function getTargetList(){
                            return new Promise( async function( resolve, reject ){
                                debug("update/getTargetList");

                                try {

                                    var keyValues = maUtil.combineKeyValues([
                                        await appDAO.fetchItem("SETTINGS_APIVERSION"),
                                    ])
                                    var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                                    // 差分を取得
                                    var rawEditedFiles = await gitManager.getEditedFiles();
                                    var rawDeletedFiles = await gitManager.getDeletedFiles();

                                    debug( "rawEditedFiles", rawEditedFiles );
                                    debug( "rawDeletedFiles", rawDeletedFiles );

                                    function rewriteZipPath ( path ){

                                        path = path.replace(/"|'/,""); // 差分のファイルパスに日本語が含まれると発生するクオーテーションをエスケープ

                                        var separatedPath = path.split("/");


                                        // situationResourceのzip内容のパスをzipのパスに変更
                                        var isSituationResource = ( separatedPath.indexOf("situationResources") > 0 );
                                        var isStoreThumbnail = ( typeof separatedPath[5] == "undefined" ); // situationResourcesの下にフォルダがなければストアサムネイル
                                        var isSceneSetAvailable = ( typeof separatedPath[6] != "undefined" ); // 階層が1段深ければシーンセットあり

                                        if ( isSituationResource && isStoreThumbnail == false && isSceneSetAvailable ) { // ストアサムネイル以外のsituationResources( シーンセット有り )

                                            separatedPath.splice(5,2); // シーンセット名、ファイル名を削る
                                            separatedPath[4] = separatedPath[4] + ".zip"; // ディレクトリ名をzip名に変更

                                        } else if ( isSituationResource && isStoreThumbnail == false ) { // ストアサムネイル以外のsituationResources( シーンセットなし )

                                            separatedPath.splice(5,1); // ファイル名を削る
                                            separatedPath[4] = separatedPath[4] + ".zip"; // ディレクトリ名をzip名に変更

                                        }

                                        // situationList/zipのzip内容のパスをzipのパスに変更
                                        var isSituationList = ( separatedPath.indexOf("situationList") > 0 );
                                        var isInsideMainMenuZip = ( separatedPath.indexOf("zip") > 0 );

                                        if (isSituationList && isInsideMainMenuZip){

                                            separatedPath.splice(5,1); // ファイル名を削る
                                            separatedPath[4] = separatedPath[4] + ".zip"; // ディレクトリ名をzip名に変更

                                        }

                                        path = separatedPath.join("/");

                                        return path;

                                    }

                                    function rewriteBasePath ( path ){

                                        var buildDirectory = config.get("app.paths._base.build");
                                        var fromBasePath = process.cwd() + buildDirectory + options.enviromentType;
                                        var deployConfig = config.get("app.paths.deploy");
                                        if ( deployConfig[options.enviromentType].addWorkingDirectory) {
                                            var destBasePath = vsprintf("%s%s%s/", [ process.cwd(), deployConfig[options.enviromentType].path, deployConfig[options.enviromentType].folderName ]);
                                        } else {
                                            var destBasePath = vsprintf("%s%s", [ deployConfig[options.enviromentType].path, deployConfig[options.enviromentType].folderName]);
                                        }

                                        return {
                                            fromPath: path.replace("inner/", fromBasePath + "/"),
                                            destPath: path.replace("inner/", destBasePath + "/")
                                        }

                                    }

                                    function removeDuplicate( files ){
                                        var cleanFiles = files.filter(function(x, i, self){
                                            return self.indexOf(x) === i;
                                        })
                                        return cleanFiles;
                                    }

                                    // アップロード対象のリストを作成
                                    var editedFiles = []

                                    rawEditedFiles.forEach(function( file ){
                                        editedFiles.push( rewriteZipPath( file ) ); // zipに含まれる差分はパスをzipのパスに置き換え
                                    });
                                    editedFiles = removeDuplicate(editedFiles); // 重複を削除
                                    editedFiles.forEach(function( file, index ){
                                        editedFiles[index] = rewriteBasePath( file ); // 差分のファイルパスから送信元送信先パスを作成
                                    });

                                    // 現APIVersion以外の差分は対象から外す
                                    // - APIバージョンを上げた際に古いバージョンが消えた差分として削除されるのを防ぐ
                                    editedFiles = editedFiles.filter(function( file ){
                                        return ( file.fromPath.indexOf(apiVersion) != -1 );
                                    })

                                    // 削除対象のリストを作成
                                    var deletedFiles = []

                                    rawDeletedFiles.forEach(function( file ){
                                        deletedFiles.push( rewriteZipPath( file ) );
                                    });
                                    deletedFiles = removeDuplicate(deletedFiles);
                                    deletedFiles.forEach(function( file, index ){
                                        deletedFiles[index] = rewriteBasePath( file );
                                    });

                                    // 現APIVersion以外の差分は対象から外す
                                    // - APIバージョンを上げた際に古いバージョンが消えた差分として削除されるのを防ぐ)
                                    deletedFiles = deletedFiles.filter(function( file ){
                                        return ( file.fromPath.indexOf(apiVersion) != -1 );
                                    })

                                    debug( "editedFiles", editedFiles );
                                    debug( "deletedFiles", deletedFiles );

                                    resolve({
                                        uploadList: editedFiles,
                                        deleteList: deletedFiles
                                    });

                                } catch(e) {
                                    debug("update/getTargetList err %0", e);
                                    reject(e);
                                }

                            })
                        }


                        // リストを基にファイルアップロード
                        function uploadTargets( uploadList ){
                            return new Promise( function( resolve, reject ){
                                debug("update/uploadTargets");

                                try {

                                    for ( let path of uploadList ) {
                                        var destFileDirectoryPath = maUtil.getDirectoryPath(path.destPath);
                                        debug("upload", path.fromPath, path.destPath);
                                        fse.ensureDirSync(destFileDirectoryPath); // 公開先の確保
                                        fse.copySync(path.fromPath, path.destPath); // コピー
                                    }

                                    resolve();

                                } catch(e) {
                                    debug("update/uploadTargets err %0", e);
                                    reject(e);
                                }

                            })
                        }


                        // リストを基にファイル削除
                        function deleteTargets( deleteList ){
                            return new Promise(async function( resolve, reject ){
                                debug("update/deleteTargets");

                                try {

                                    for ( let path of deleteList ){

                                        var fromFileDirectoryPath = maUtil.getDirectoryPath(path.fromPath);
                                        var destFileDirectoryPath = maUtil.getDirectoryPath(path.destPath);

                                        var isFromFileFolderExists = await maUtil.getDirectoryExists(fromFileDirectoryPath);

                                        //fromPathの場所にフォルダが存在していなければフォルダ削除
                                        if( isFromFileFolderExists == false ){
                                            debug("remove", destFileDirectoryPath);
                                            fse.removeSync( destFileDirectoryPath );
                                        } else if ( isFromFileFolderExists == true ) {

                                            //fromPathの場所にファイルが存在していなければファイル削除(使用しているzipを消さないため)
                                            var exists = fse.pathExistsSync(path.fromPath);
                                            if ( exists == false ) {
                                                debug("remove", path.destPath );
                                                fse.removeSync( path.destPath );
                                            }

                                        }

                                    }

                                    resolve();

                                } catch(e) {
                                    debug("update/deleteTargets err %0", e);
                                    reject(e);
                                }

                            })
                        }

                        try {

                            var targetList = await getTargetList();

                            await uploadTargets(targetList.uploadList);
                            await deleteTargets(targetList.deleteList);

                            debug("update finished");
                            resolve();

                        } catch(e) {
                            debug("update err %0", e);
                            reject(e);
                        }

                    });
                }

                // -------------------------------------------------------------------------------------------------------------
                // releaseブランチへコミット(本番時のみ)
                // -------------------------------------------------------------------------------------------------------------

                function gitCommit(){
                    return new Promise( async function( resolve, reject ){
                        debug("gitCommit");

                        // 本番時以外はスキップ
                        if ( options.enviromentType != "production" ){
                            debug("gitCommit skipped");
                            resolve();
                            return false;
                        }

                        try {

                            var localRepositoryPath = config.get("gitConfig.path.local");

                            // リポジトリの設定変更
                            function _setup(){
                                return new Promise(function(resolve, reject){
                                    debug("gitCommit/setup");
                                    git( process.cwd() + localRepositoryPath )
                                        .outputHandler(function (command, stdout, stderr) {
                                            stdout.pipe(process.stdout);
                                            stderr.pipe(process.stderr);
                                        })
                                        .addConfig("user.name", options.git.user)
                                        .addConfig("user.email", "anonymous@media-active.co.jp")
                                        .checkout("release",function(){
                                            resolve();
                                        })
                                });
                            }

                            /*
                                releaseブランチ内の全ファイル削除
                                (ファイル削除の情報もコミットするため)
                                (merge --squashだとファイル削除情報がコミットできない)
                            */
                            function _removeAllFiles(){
                                return new Promise(function(resolve, reject){
                                    debug("gitCommit/removeAllFiles");
                                    fse.removeSync( process.cwd() + localRepositoryPath + "inner");
                                    resolve();
                                });
                            }

                            // 最新のdevelopブランチの内容をreleaseブランチにコミット
                            function _mergeCommit(){
                                return new Promise(function(resolve, reject){
                                    debug("gitCommit/mergeCommit");
                                    git( process.cwd() + localRepositoryPath )
                                        .outputHandler(function (command, stdout, stderr) {
                                            stdout.pipe(process.stdout);
                                            stderr.pipe(process.stderr);
                                        })
                                        .checkout(["develop","inner"])
                                        .add("--all")
                                        .commit("(管理画面コミット)" + options.git.commitMessage, function(){
                                            resolve();
                                        })
                                });
                            }

                            // リモートリポジトリ(Backlog)へプッシュ
                            function _push(){
                                return new Promise(function(resolve, reject){
                                    debug("gitCommit/push");
                                    git( process.cwd() + localRepositoryPath )
                                        .outputHandler(function (command, stdout, stderr) {
                                            stdout.pipe(process.stdout);
                                            stderr.pipe(process.stderr);
                                        })
                                        .push("origin", "release",function(){
                                            resolve();
                                        })
                                });
                            }

                            await _setup();
                            await _removeAllFiles();
                            await _mergeCommit();
                            await _push();

                            debug("gitCommit finished");
                            resolve();

                        } catch(e) {
                            debug("gitCommit err %0", e);
                        }

                    })
                }

                // -------------------------------------------------------------------------------------------------------------

                await update();
                await gitCommit();

                debug("deploy finished");
                resolve();

            } catch(e) {
                debug("deploy err %0", e);
                reject(e);
            }

        });

    },

    fullDeploy: function( options ){
        return new Promise(async function( resolve, reject ){
            debug("fullDeploy", options );

            try {

                // -------------------------------------------------------------------------------------------------------------
                // オプション取得
                // -------------------------------------------------------------------------------------------------------------

                var defaultOptions = {
                    enviromentType: "test", // test, production
                    directory: "", // /topics
                }
                options = Object.assign(defaultOptions, options);

                // -------------------------------------------------------------------------------------------------------------
                // フォルダを空にしてアップロード
                // -------------------------------------------------------------------------------------------------------------

                // ビルドディレクトリパス取得
                var buildDirectory = config.get("app.paths._base.build");
                var deployConfig = config.get("app.paths.deploy");

                // アップロード元を指定

                var keyValues = maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_APIVERSION"),
                ])
                var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

                var fromPath = vsprintf("%s%s%s/%s", [
                    process.cwd(),
                    buildDirectory,
                    options.enviromentType,
                    options.directory
                ]);

                // アップロード先を指定

                var destPath;

                if ( deployConfig[options.enviromentType].addWorkingDirectory) {
                    destPath = vsprintf("%s%s/%s%s", [
                        process.cwd(),
                        deployConfig[options.enviromentType].path,
                        deployConfig[options.enviromentType].folderName,
                        options.directory
                    ]);
                } else {
                    destPath = vsprintf("%s%s/%s", [
                        deployConfig[options.enviromentType].path,
                        deployConfig[options.enviromentType].folderName,
                        options.directory
                    ]);
                }

                // アップロード
                debug("upload", fromPath, destPath);
                fse.emptyDirSync(destPath); // 公開先を空としての確保
                fse.copySync(fromPath, destPath);  // ビルドディレクトリから本番へコピー

                debug("fullDeploy finished");
                resolve();

            } catch(e) {
                debug("fullDeploy err %0", e);
                reject(e);
            }

        });
    }

}

module.exports = deployer;
