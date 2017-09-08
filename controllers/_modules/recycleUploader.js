////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/controllerModules/recycleUploader');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var multer  = require('multer');
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp")
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 対象ディレクトリ内のファイル一覧取得
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.getFileList = function( req, res, next ){
    debug("getFileList");

    // API URLで保存先取得
    var apiUrl = req.baseUrl + req.path;
    var sourcePath = maUtil.getSourcePathByAPI( apiUrl );

    // シチュエーションコードを絡めた保存パスの処理
    var situationCode = req.params.situationCode;
    if ( situationCode ) {

        if ( typeof sourcePath == "object" ) {
            var variables = maUtil.setVariables( sourcePath.variables, {
                situationCode: req.params.situationCode
            } )
            sourcePath = vsprintf( sourcePath.path, variables );
        }

    }

    // 必要に応じてディレクトリ作成
    var absSavePath = process.cwd() + sourcePath;
    mkdirp.sync(absSavePath);

    maUtil.getFileList( process.cwd() + sourcePath )
        .then(function(files){

            // ファイル名、パス、サイズの配列に整形
            var result = []
            files.forEach(function(file){

                var filePath = sourcePath + file;
                var fileFullPath = process.cwd() + sourcePath + file;

                result.push({
                    fileName: file,
                    filePath: filePath,
                    fileSize: maUtil.getFileSize( fileFullPath )
                });

            })

            // 応答
            res.json( result );

        });

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 対象ディレクトリ内にアップロードファイルを保存
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.save = function( req, res, next ){
    return new Promise(function(resolve, reject){
        debug("save");

        //---------------------------------------------------------------------------
        // 保存先＆保存ファイル名定義
        //---------------------------------------------------------------------------

        // API URLで保存先取得
        var apiUrl = req.baseUrl + req.path;
        var sourcePath = maUtil.getSourcePathByAPI( apiUrl );

        // シチュエーションコードを絡めた保存パスの処理
        var situationCode = req.params.situationCode;
        if ( situationCode ) {

            if ( typeof sourcePath == "object" ) {
                var variables = maUtil.setVariables( sourcePath.variables, {
                    situationCode: req.params.situationCode
                } )
                sourcePath = vsprintf( sourcePath.path, variables );
            }

        }

        // 保存先指定
        var storage = multer.diskStorage({
            destination: function (req, file, callback){
                var absSavePath = process.cwd() + sourcePath;
                debug("save @destination %s", absSavePath);
                callback(null, absSavePath);
            },
            filename: function (req, file, callback){
                var fileFullName = file.originalname;
                var extension = fileFullName.substr( fileFullName.indexOf(".") );
                var fileName = fileFullName.replace(extension, "");
                var timestamp = moment().format('YYYYMMDD');
                var uploadedFileName = fileName + "_" + timestamp + extension;
                debug("save @filename %s", uploadedFileName);
                callback(null, uploadedFileName);
            }
        });

        //---------------------------------------------------------------------------
        // アップロード開始
        //---------------------------------------------------------------------------

        var fieldName = "file";
        var upload = multer({ storage: storage }).single(fieldName);

        upload(req, res, function (err) {

            if (err) {
                res.json({ code : 400, data : err });
                throw err;
            } else {
                debug("save finished");
                res.json({ code : 200, path: sourcePath + req.file.filename });
            }
        });

    });

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 対象ディレクトリ内のアップロードファイルを削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = function( req, res, next ){
    debug("remove");

    var fileName = req.params.fileName;

    // req.pathからファイル名を消してAPIURLにする(encodeURIComponentは日本語ファイル名対策)
    var apiUrl = req.baseUrl + req.path.replace( encodeURIComponent(fileName), "");
    var sourcePath = maUtil.getSourcePathByAPI( apiUrl );


    // シチュエーションコードを絡めた保存パスの処理
    var situationCode = req.params.situationCode;
    if ( situationCode ) {
        if ( typeof sourcePath == "object" ) {
            var variables = maUtil.setVariables( sourcePath.variables, {
                situationCode: req.params.situationCode
            } )
            sourcePath = vsprintf( sourcePath.path, variables );
        }

    }

    maUtil.removeFile( process.cwd() + sourcePath + fileName )
        .then(function(){
            debug("remove finished");
            res.json({ code : 200 });
        });

}
