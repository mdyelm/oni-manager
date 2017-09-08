////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/controllerModules/singleUploader');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var multer  = require('multer');
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp")
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// アップロードファイルの保存
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

        // 必要に応じてディレクトリ作成
        var absSavePath = process.cwd() + sourcePath;
        mkdirp.sync(absSavePath);

        var storage = multer.diskStorage({
            destination: function (req, file, callback){
                debug("save @destination %s", absSavePath);
                callback(null, absSavePath);
            },
            filename: function (req, file, callback){
                var fileFullName = file.originalname;
                var extension = fileFullName.substr( fileFullName.indexOf(".") );
                var fileName = fileFullName.replace(extension, "");
                var timestamp = moment().format('YYYYMMDD');
                var uploadedFileName = fileName + "_" + timestamp + extension;
                debug("save @fileName %s", uploadedFileName);
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
                res.json({ code : 400, err: err });
                throw err;
            } else {
                var path = sourcePath + req.file.filename;
                res.json({ code : 200, path : path });
                debug("save finished");
            }

        });

    });
}
