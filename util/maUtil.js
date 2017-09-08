////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var fs = require("fs");
var config = require("config");
var vsprintf = require("sprintf-js").vsprintf;
var archiver = require("archiver");
var del = require("del");
var libPath = require("path");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
*   お手製ユーティリティ
*   @class maUtil
*   @module maUtil
*/
maUtil = {

    /**
    *   パスからディレクトリパスを取得する
    *   @method getDirectoryPath
    *   @param {string} path パス
    *   @return {string} ディレクトリパス
    */
    getDirectoryPath: function( path ){
        var temp = path.split("/");
        temp.pop();
        return temp.join("/") + "/";
    },

    /**
    *   パスからファイル名を取得する
    *   @method getFileName
    *   @param {string} path パス
    *   @return {string} 取得したファイル名
    */
    getFileName: function( path, hideExtension ){
        if( hideExtension ) {
            var ext = libPath.extname( path );
            return path.substr(path.lastIndexOf('/')+1).replace(ext, "");
        } else {
            return path.substr(path.lastIndexOf('/')+1);
        }
    },


    /**
    *   ファイルパスからファイルサイズを取得する
    *   @method getFileSize
    *   @param {string} path パス
    *   @return {string} ファイルサイズ(KBまたはMB変換済み)
    */
    getFileSize: function( path ) {

        function convertSize( bytes ) {
            var  kb = ( bytes / 1024 );
            if ( kb >= 1000 ) {
                return ( Math.floor( ( kb / 1000) * 100 ) / 100 ) + "MB";
            } else {
                return ( Math.floor( kb * 100 ) / 100 ) + "KB";
            }
        }

        var stats = fs.statSync( path );
        var fileSizeInBytes = stats.size;

        return convertSize( fileSizeInBytes );

    },


    /**
    *   パスで指定したディレクトリが存在しているか確認する
    *   @method getDirectoryExists
    *   @param {string} path パス
    *   @return {boolean} ディレクトリが存在していればtrueを返す
    */
    getDirectoryExists: function( path ){
        return new Promise( ( resolve, reject ) => resolve( fs.existsSync( path ) ) );
    },


    /**
    *   パスで指定したディレクトリ内のファイル一覧を返す
    *   @method getFileList
    *   @param {string} path パス
    *   @return {array} ファイル一覧
    *   @async
    */
    getFileList: function( path ){
        return new Promise(function(resolve, reject){
            fs.readdir(path, function(err, files){
                if (err) { console.log('err: ' + err); }
                resolve(files);
            });
        });
    },


    /**
    *   存在するファイルから使用していないファイルを抽出する
    *   @method getMissingFileList
    *   @param {array} existFileList 存在ファイル一覧
    *   @param {array} inUseFileList 使用ファイル一覧
    *   @return {array} 使用されていなかったファイル一覧
    *   @async
    */
    getMissingFileList: function(existFileList, inUseFileList){
        return new Promise(function(resolve, reject){
            var missingList = [];

            existFileList.forEach(function(existItem){
                var isMissing = inUseFileList.indexOf(existItem) < 0;
                if( isMissing ) missingList.push(existItem);
            });

            resolve(missingList);

        });
    },


    /**
    *   APIURLを基に素材ディレクトリを返す
    *   @method getSourcePathByAPI
    *   @param {string} apiUrl 存在ファイル一覧
    *   @return {string} 素材パス(/nantoka/nantoka/)
    */
    getSourcePathByAPI: function( apiUrl ){

        switch( true ){


            // for recycleUploader

            // topics
            case /\/topics\/images/.test(apiUrl):
                var sourcePath = config.get("app.paths.topics.source") + "images/";
                break;

            // pickups
            case /\/pickups\/images\/banner/.test(apiUrl):
                var sourcePath = config.get("app.paths.pickups.source.pickupBanner");
                break;
            case /\/pickups\/images\/nativeAdBackground/.test(apiUrl):
                var sourcePath = config.get("app.paths.pickups.source.pickupNativeAdBackground");
                break;
            case /\/menuBackgrounds\/images/.test(apiUrl):
                var sourcePath = config.get("app.paths.menuBackgrounds.source.menuBackground");
                break;

            // situations
            case /\/situations\/sounds\/callSpecialSounds/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.callSpecialSound");
                break;
            case /\/situations\/images\/callBackgrounds/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.callBackground");
                break;

            case /\/situations\/sounds\/talkSounds/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.talkSound");
                break;
            case /\/situations\/sounds\/talkSoundBGMs/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.talkSoundBGM");
                break;
            case /\/situations\/videos\/talkVideos/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.talkVideo");
                break;
            case /\/situations\/images\/talkScenes/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.talkScene");
                break;
            case /\/situations\/checkCodeExists/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source._base");
                break;
            case /\/situations\/images\/storeThumbnails/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.storeThumbnail");
                break;
            case /\/situations\/images\/specialButtons/.test(apiUrl):
                var sourcePath = config.get("app.paths.situations.source.specialButton");
                break;

            // menus
            case /\/menus\/images\/buttonBackgrounds/.test(apiUrl):
                var sourcePath = config.get("app.paths.menus.source.menuButtonBackground");
                break;
            case /\/menus\/images\/buttonIcon/.test(apiUrl):
                var sourcePath = config.get("app.paths.menus.source.menuButtonIcon");
                break;

            // deploy backup
            case /\/deploy\/backup/.test(apiUrl):
                var sourcePath = config.get("app.paths.backup");
                break;

        }
        return sourcePath;
    },


    /**
    *   言語/OS構造体としてのオブジェクトから条件でデータ絞り込み
    *
    *   {
    *       jp: {
    *           ios: {
    *               keyA: nantoka,
    *               keyB: nantoka
    *           },
    *       },
    *   }
    *   こんなデータからkeyAやkeyBの条件を指定して抽出できる
    *   @method filterEnvedObject
    *   @param {string} data 言語/OS構造体としてのオブジェクト
    *   @param {string} conditions フィルタ条件
    *   @return {string} フィルタした言語/OS構造体としてのオブジェクト
    */
    filterEnvedObject: function( object, conditions ){
        var filteredEnvedObject = {}
        var languages = Object.keys(object);

        languages.forEach(function(languageCode){
            filteredEnvedObject[languageCode] = {}
            var os = Object.keys(object[languageCode]);

            os.forEach(function(osCode){
                filteredEnvedObject[languageCode][osCode] = object[languageCode][osCode].filter(function( objectItem ){
                    var isFail = false;
                    conditions.forEach(function(condition){
                        if (objectItem[condition.key] != condition.value) isFail = true;
                    });
                    return isFail == false;
                });
            });

        });
        return filteredEnvedObject;
    },


    /**
    *   パスで指定したファイルを削除する
    *   @method removeFile
    *   @param {string} path パス
    *   @async
    */
    removeFile: function(path) {
        return new Promise(function(resolve, reject){
            fs.unlink(path, function(err) {
                if (err) throw err;
                resolve();
            });
        });
    },


    /**
    *   パスで指定したファイルを削除する
    *   @method removeDirectory
    *   @param {string} path パス
    *   @async
    */
    removeDirectory: function(path) {
        return new Promise(function(resolve, reject){
            del([path]).then(paths => {
                resolve(paths);
            });
        });
    },


    /**
    *   指定したディレクトリを圧縮する
    *   @method zipDirectory
    *   @param {string} options
    *   @param {string} options.savePath 保存先パス
    *   @param {string} options.directoryPath 保存対象パス
    *   @param {string} options.saveDirectoryName zip内での保存ディレクトリ名
    */
    zipDirectory: function(options){
        if( !options ) return false;

        return new Promise(function( resolve, reject ){

            var output = fs.createWriteStream( options.savePath );
            var archive = archiver("zip", { zlib: { level: 9 } });
            archive.pipe( output );
            if(options.saveDirectoryName){
                archive.directory( options.directoryPath, options.saveDirectoryName );
            } else {
                archive.directory( options.directoryPath);
            }
            archive.finalize();

            output.on("close", function(){
                console.log(archive.pointer() + "total bytes");
                resolve();
            });

            archive.on("error", function(err){
                console.log(err);
                resolve();
            });

        });

    },


    /**
    *   コンソールに色付きのデバッグメッセージを表示
    *   @method debug
    *   @param {string} file ファイル名
    *   @param {string} message メッセージ内容
    *   @param {string} color 表示色(red,green,yellowなど)
    */
    debug: function(file, message, color){

        var colorCode = "";
        if (typeof color == "string") {
            switch(color) {
                case "red":
                    colorCode = "\x1b[31m";
                    break;
                case "green":
                    colorCode = "\x1b[32m";
                    break;
                case "yellow":
                    colorCode = "\x1b[43m";
                    break;
                case "blue":
                    colorCode = "\x1b[44m";
                    break;
                case "cyan":
                    colorCode = "\x1b[46m";
                    break;
                case "error":
                    colorCode = "\x1b[41m";
                    break;
                case "router":
                    colorCode = "\x1b[42m";
                    break;
                case "DAOIncludes":
                    colorCode = "\x1b[34m";
                    break;
            }
        } else {
            colorCode = "\x1b[37m";
        }

        var resetColorCode = "\x1b[0m";

        if ( process.env.NODE_ENV == "development" ||  process.env.NODE_ENV == "production" ) {

            if ( typeof message == "string" ) {
                console.log( colorCode +  "[" + file + "] " + message + resetColorCode );
            } else {
                console.log( colorCode +  "-------------------------------------------------------------" );
                console.log( "[" + file + "] ");
                console.log( message );
                console.log( "-------------------------------------------------------------" + resetColorCode );

            }


        }

    },

    dumpError: function(err) {
        if (typeof err === 'object') {
            if (err.message) {
                console.log('\nMessage: ' + err.message)
            }
            if (err.stack) {
                console.log('\nStacktrace:')
                console.log('====================')
                console.log(err.stack);
            }
        } else {
            console.log('dumpError :: argument is not an object');
        }
    },

    /* 別々のDAO取得データをマージする */
    combineDAOResults: function( daoResults ){

        var combinedData = {}

        daoResults.forEach(function( result ){
            if (result.keyValues && combinedData.keyValues) {
                // キーバリューをkeyValues : { key: value }として使えるようにする
                // 上書き対策
                combinedData.keyValues = Object.assign(combinedData.keyValues, result.keyValues);
            } else {
                // マージ
                combinedData = Object.assign(combinedData, result);
            }
        });

        return combinedData;

    },

    combineKeyValues: function( keyValues ){
        var combined = {}
        keyValues.forEach(function( keyValue ){
            combined = Object.assign(combined, keyValue);
        });
        return combined;
    },

    getEnvedObject: function ( languageArray, osArray, objectArray ){

        var results = {}

        languageArray.forEach( function( language ){
            osArray.forEach( function( os ){
                if ( results[language.code] == undefined ) results[language.code] = {}
                if ( results[language.code][os.code] == undefined ) results[language.code][os.code] = []
                var envMatchedObjects = objectArray.filter( function( object ){
                    return ( ( object.languageId == language.id ) && ( object.osId == os.id ) ) ||
                    ( ( object.languageId == language.id ) && ( object.osId == null ) ); // null = 共通
                });
                if ( envMatchedObjects.length ) results[language.code][os.code] = envMatchedObjects;
            });
        });

        return results;

    },

    setVariables: function ( variableNameList, variables ){

        var replacedList = []

        variableNameList.forEach(function( variableName, i ){
            switch( variableName ) {
                case "apiVersion":
                    replacedList[i] = variables.apiVersion;
                    break;
                case "languageCode":
                    replacedList[i] = variables.language.code;
                    break;
                case "osCode":
                    replacedList[i] = variables.os.code;
                    break;
                case "situationCode":
                    replacedList[i] = variables.situationCode;
                    break;
            }
        });

        return replacedList;

    },

    nestedLoop: function( options ) {

        var maxLoop = options.targets.length;

        function loop( depth, args ){
            options.targets[depth].data.forEach(function(targetItem){
                args[options.targets[depth].name] = targetItem;
                var isLast = depth >= (maxLoop-1);
                if( isLast ){
                    options.mainFunction(args);
                } else {
                    loop( depth+1, args );
                }
            });
        }

    	loop(0, {}, options);

    }

}

module.exports = maUtil;
