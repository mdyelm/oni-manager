////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/deploy/apiController');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var mkdirp = require("mkdirp");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var logsDAO = require(process.cwd() + '/dao/logsDAO');
var appDAO = require(process.cwd() + '/dao/appDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var exporter = require(process.cwd() + '/util/exporter');
var deployer = require(process.cwd() + '/util/deployer');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// テスト版お知らせ更新

module.exports.testTopicDeploy = function( req, res, next ) {
    debug("testTopicDeploy");

    exporter.topicExport({ enviromentType: "test" })
        .then(function(){

            deployer.fullDeploy({ enviromentType: "test", directory: "/topics" })
                .then(function(){

                    debug("testTopicDeploy finished");

                    logsDAO.add({
                        time: moment().format("YYYY-MM-DD HH:mm:ss"),
                        user: req.user.name,
                        object: "deployer",
                        type: "deploy.topic.test",
                        detail: "テスト版アプリのお知らせを更新しました。"
                    }).catch( err => maUtil.dumpError(err) )

                    render( req, res, next, {
                        message: {
                            text: 'テスト版アプリのお知らせを更新しました。'
                        },
                    });

                }).catch(function(e){

                    debug("testTopicDeploy err %0", e);

                    logsDAO.add({
                        time: moment().format("YYYY-MM-DD HH:mm:ss"),
                        user: req.user.name,
                        object: "deployer",
                        type: "deploy.topic.test.fail",
                        detail: "テスト版アプリのお知らせ更新に失敗しました(deployerでエラー)"
                    }).catch( err => maUtil.dumpError(err) )

                    render( req, res, next, {
                        message: {
                            text: "エラー",
                            err: 'テスト版アプリのお知らせ更新に失敗しました(deployerでエラー)'
                        },
                    });

                });

        }).catch(function(e){

            debug("testTopicDeploy err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "deployer",
                type: "deploy.topic.test.fail",
                detail: "テスト版アプリのお知らせ更新に失敗しました(exporterでエラー)"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                    text: "エラー",
                    err: 'テスト版アプリのお知らせ更新に失敗しました(exporterでエラー)'
                },
            });

        })

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 本番お知らせ更新

module.exports.productionTopicDeploy = function( req, res, next ) {
    debug("productionTopicDeploy");

    if ( req.body.accessCode != config.get("oniManagerConfig.accessCode") ){

        debug("productionTopicDeploy err %s", "アクセスコードエラー");

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "deployer",
            type: "deploy.topic.production",
            detail: "本番アプリのお知らせ更新に失敗"
        }).catch( err => maUtil.dumpError(err) )

        render( req, res, next, {
            message: {
              text: '認証エラー',
              err: "アクセスコードが違うようです"
            },
        });

        return false;

    }

    exporter.topicExport({ enviromentType: "production" }).then(function(){
        deployer.fullDeploy({
            enviromentType: "production",
            directory: "/topics"
        }).then(function(){

            debug("productionTopicDeploy finished");

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "deployer",
                type: "deploy.topic.production",
                detail: "本番アプリのお知らせを更新しました。"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                  text: '本番アプリのお知らせを更新しました。'
                },
            });

        })
        .catch(function(e){

            debug("testTopicDeploy err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "deployer",
                type: "deploy.topic.production.fail",
                detail: "本番アプリのお知らせ更新に失敗しました(deployerでエラー)"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                    text: "エラー",
                    err: '本番アプリのお知らせ更新に失敗しました(deployerでエラー)'
                },
            });

        });

    })
    .catch(function(e){

        debug("testTopicDeploy err %0", e);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "deployer",
            type: "deploy.topic.production.fail",
            detail: "本番アプリのお知らせ更新に失敗しました(exporterでエラー)"
        }).catch( err => maUtil.dumpError(err) )

        render( req, res, next, {
            message: {
                text: "エラー",
                err: '本番アプリのお知らせ更新に失敗しました(exporterでエラー)'
            },
        });

    });

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// テスト版アプリデータ更新

module.exports.testDeploy = function(req, res, next) {
    debug("testDeploy");

    exporter.export({ enviromentType: "test" })
        .then(async function(){

            var keyValues = maUtil.combineKeyValues([
                await appDAO.fetchItem("SETTINGS_APIVERSION"),
            ])
            var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

            deployer.fullDeploy({
                    enviromentType: "test",
                    directory: "/" + apiVersion
                })
                .then(function(){

                    debug("testDeploy finished");

                    logsDAO.add({
                        time: moment().format("YYYY-MM-DD HH:mm:ss"),
                        user: req.user.name,
                        object: "exporter",
                        type: "deploy.test",
                        detail: "テスト版のアプリデータを更新しました"
                    }).catch( err => maUtil.dumpError(err) )

                    render( req, res, next, {
                        message: {
                          text: 'テスト版アプリデータを更新しました。'
                        },
                    });

                })
                .catch(function(e){

                    debug("testDeploy err %0", e);

                    logsDAO.add({
                        time: moment().format("YYYY-MM-DD HH:mm:ss"),
                        user: req.user.name,
                        object: "exporter",
                        type: "deploy.test.fail",
                        detail: "テスト版アプリデータの更新に失敗（deployerでエラー）"
                    }).catch( err => maUtil.dumpError(err) )

                    render( req, res, next, {
                        message: {
                          text: 'エラー',
                          err: "テスト版アプリデータの更新に失敗（deployerでエラー）"
                        },
                    });

                });

        })
        .catch(function(e){

            debug("testDeploy err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "exporter",
                type: "deploy.test.fail",
                detail: "テスト版アプリデータの更新に失敗（exporterでエラー）"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                  text: 'エラー',
                  err: "テスト版アプリデータの更新に失敗（exporterでエラー）"
                },
            });

        });

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 更新内容の取得

module.exports.productionExport = function(req, res, next) {
    debug("productionExport");

    exporter.export({ enviromentType: "production", git: { user: req.user.name }})
        .then(function(){

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "exporter",
                type: "export.production",
                detail: "更新内容取得を行いました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                  text: '更新内容取得が完了しました。'
                },
            });

            debug("productionExport finished");

        })
        .catch(function(e){

            debug("productionExport err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "exporter",
                type: "export.production.fail",
                detail: "更新内容取得に失敗しました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                  text: 'エラー',
                  err: "更新内容取得に失敗"
                },
            });

        })

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 全体ZIP作成

module.exports.productionFullZip = async function(req, res, next) {
        debug("productionFullZip");

        try {

            var keyValues = maUtil.combineKeyValues([
                await appDAO.fetchItem("SETTINGS_APIVERSION"),
            ])
            var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

            // productionのビルドパスをルートからZIPする
            var basePath = vsprintf("%s%s%s/%s",[
                process.cwd(),
                config.get("app.paths._base.build"),
                "production",
                apiVersion
            ]);
            var savePath = vsprintf("%s%s", [
                process.cwd(),
                config.get("app.paths.backup")
            ]);

            var fileName = "oni_fullzip_" + moment().format("YYYYMMDD_hhmm") + ".zip";

            // フォルダ確保
            mkdirp.sync(savePath);

            // zip
            await maUtil.zipDirectory({
                savePath: savePath + fileName,
                directoryPath: basePath,
                saveDirectoryName: "production"
            });

            debug("productionFullZip finished");

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "controller",
                type: "productionFullZip",
                detail: "全体ZIP作成を行いました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                  text: '全体ZIP作成が完了しました。<a href="' + config.get("app.paths.backup") + fileName + '">全体ZIPダウンロード</a>'
                },
            });


        } catch(e) {

            debug("productionFullZip err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "controller",
                type: "productionFullZip.fail",
                detail: "全体ZIP作成に失敗しました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                  text: 'エラー',
                  err: "全体ZIP作成に失敗"
                },
            });

        }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 本番アプリデータ更新

module.exports.productionDeploy = function(req, res, next) {
    debug("productionDeploy");

    if ( req.body.accessCode != config.get("oniManagerConfig.accessCode") ){

        debug("productionDeploy err %s", "アクセスコードエラー");

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "exporter",
            type: "deploy.production",
            detail: "本番環境公開に失敗"
        }).catch( err => maUtil.dumpError(err) )

        render( req, res, next, {
            message: {
                text: '認証エラー',
                err: "アクセスコードが違うようです"
            },
        });

        return false;
    }

    deployer.deploy({
            enviromentType: "production",
            git: {
                user: req.user.name,
                commitMessage: req.body.commitMessage
            }
        })
        .then(function(args){

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "exporter",
                type: "deploy.production",
                detail: "本番環境に公開しました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                    text: '本番環境に公開しました。'
                },
            });

            debug("productionDeploy finished");

        })
        .catch(function(e){

            debug("productionDeploy err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "exporter",
                type: "deploy.production.fail",
                detail: "本番環境公開に失敗しました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                    text: "公開失敗",
                    err: '本番環境公開に失敗しました。'
                },
            });


        })

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// サーバーリセット (すべてを削除して管理画面から再出力します)

module.exports.productionFullDeploy = async function(req, res, next) {
    debug("productionFullDeploy");

    if ( req.body.accessCode != config.get("oniManagerConfig.accessCode") ){

        debug("productionFullDeploy err %s", "アクセスコードエラー");

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "deployer",
            type: "deploy.production.full",
            detail: "本番環境リセットに失敗"
        }).catch( err => maUtil.dumpError(err) )

        render( req, res, next, {
            message: {
                text: '認証エラー',
                err: "アクセスコードが違うようです"
            },
        });

        return false;

    }

    var keyValues = maUtil.combineKeyValues([
        await appDAO.fetchItem("SETTINGS_APIVERSION"),
    ])
    var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

    deployer.fullDeploy({
            enviromentType: "production",
            directory: "/" + apiVersion
        })
        .then(function(args){

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "deployer",
                type: "deploy.production.full",
                detail: "本番環境をリセットしました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                    text: '本番環境をリセットしました'
                },
            });

            debug("productionFullDeploy finished");

        })
        .catch(function(e){

            debug("productionFullDeploy err %0", e);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "deployer",
                type: "deploy.production.full.fail",
                detail: "本番環境リセットに失敗しました"
            }).catch( err => maUtil.dumpError(err) )

            render( req, res, next, {
                message: {
                    text: "リセット失敗",
                    err: '本番環境リセットに失敗しました。'
                },
            });

        })

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
