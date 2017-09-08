/*
    gitManager.js
    2017 wataru fukushima
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require('config');
var git = require("simple-git");
var mkdirp = require("mkdirp");
var fs = require("fs");
var fse = require("fs-extra");
var escape = require('escape-html');
var debug = require('debug')('om/util/gitManager');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var gitManager = {
    setup: function( req, res, next ) {
        debug("setup");

        var localRepositoryPath = config.get("gitConfig.path.local");
        var remoteRepositoryPath = config.get("gitConfig.path.remote");

        // フォルダを作成
        mkdirp.sync( process.cwd() + localRepositoryPath );

        // リポジトリ情報設定
        git( process.cwd() + localRepositoryPath )
            .clone( remoteRepositoryPath, ".")
            .addConfig("user.name", "oniManager")
            .addConfig("user.email", "anonymous@media-active.co.jp")
            .checkout("develop")
            .checkout("release", function(){
                res.json({
                    "status": "git Setup OK!"
                })
            })

    },
    getDiff: function(){
        return new Promise(function( resolve, reject ){
            debug("getDiff");

            var localRepositoryPath = config.get("gitConfig.path.local");

            // developブランチとreleaseブランチの差分を取得
            git( process.cwd() + localRepositoryPath )
                .checkout("develop")
                .diff(["release"], function(err, result){
                    resolve(escape(result));
                })

        })
    },
    getEditedFiles: function(){
        return new Promise(function( resolve, reject ){
            debug("getEditedFiles");

            var localRepositoryPath = config.get("gitConfig.path.local");

            // developブランチとreleaseブランチの差分を取得
            git( process.cwd() + localRepositoryPath )
                .checkout("develop")
                .diff(["release","--diff-filter=d","--stat-width=800"], function(err, result){

                    var uploadList = []

                    result.split(/\r\n|\r|\n/).forEach(function( line ){
                        if ( line.match(/\|/) ) {
                            var filePath = line.split(" ")[1];
                            uploadList.push( filePath );
                        }
                    });

                    resolve(uploadList);

                })

        });
    },
    getDeletedFiles: function(){
        return new Promise(function( resolve, reject ){
            debug("getDeletedFiles");

            var localRepositoryPath = config.get("gitConfig.path.local");

            // developブランチとreleaseブランチの差分を取得
            git( process.cwd() + localRepositoryPath )
                .checkout("develop")
                .diff(["release","--diff-filter=D","--stat","--stat-width=800"], function(err, result){

                    var deleteList = []

                    result.split(/\r\n|\r|\n/).forEach(function( line ){
                        if ( line.match(/\|/) ) {
                            var filePath = line.split(" ")[1];
                            deleteList.push( filePath );
                        }
                    });

                    resolve(deleteList);

                })

        });
    },
    getLastCommitDate: function(  ){
        return new Promise(function( resolve, reject ){
            debug("getLastCommitDate");

            var localRepositoryPath = config.get("gitConfig.path.local");

            git( process.cwd() + localRepositoryPath )
                .raw(["log", "-1","--date=iso","--format='%cd'"], function(err, result){
                    resolve(result);
                })
        })
    },
    getCommitCount: function(  ){
        return new Promise(function( resolve, reject ){
            debug("getCommitCount");

            var localRepositoryPath = config.get("gitConfig.path.local");

            git( process.cwd() + localRepositoryPath )
                .log(["--no-merges"], function(err, result){
                    resolve(result.total);
                })
        })
    }
}

module.exports = gitManager;
