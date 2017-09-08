////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var fs = require("fs");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/util/cleaner');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
*   不要なファイルを削除する
*   @class cleaner
*   @module cleaner
*
*/
var cleaner = {
    /**
    *   存在するファイルから使用していないファイルを探し削除する
    *   @method clean
    *   @param {object} options
    *   @param {array} options.existFiles 存在するファイル名配列
    *   @param {array} options.useFiles 使用しているファイル名配列
    *   @param {string} options.directory 削除対象のディレクトリパス
    *   @returns {array} 削除したファイル名配列
    *   @async
    */
    clean: function( options ){
        return new Promise( async function(resolve, reject){
            debug("clean");

            try {

                var existFiles = options.existFiles;
                var useFiles = options.useFiles;
                var directory = options.directory;
                var dustFiles = await maUtil.getMissingFileList( existFiles, useFiles );

                function deleteFile( fileName ){
                    return new Promise(function(resolve, reject){
                        fs.unlink( directory + fileName, function (err) {
                            resolve( directory + fileName );
                        });
                    });
                }

                var deletedFiles = [];

                for ( let dustFileName of dustFiles ) {
                    deletedFiles.push( await deleteFile(dustFileName));
                }

                resolve( deletedFiles );

                debug("clean finished");

            } catch(e) {
                debug("clean err %0", e);
            }

        });
    }

}

module.exports = cleaner;
