////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/deploy/_render');
var vsprintf = require("sprintf-js").vsprintf;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var gitManager = require( process.cwd() + '/util/gitManager.js' );
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ) {
    debug("render")

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var keyValues = maUtil.combineKeyValues([
            await appDAO.fetchItem("SETTINGS_APIVERSION"),
        ])
        var apiVersion = keyValues["SETTINGS_APIVERSION"].value;

        var locals = {
            data: {
                diff: await gitManager.getDiff(),
                lastCommitDate: await gitManager.getLastCommitDate(),
                commitCount: await gitManager.getCommitCount(),
                languages: await languagesDAO.fetch(),
                os: await osDAO.fetch().catch(),
                paths: {
                    testTopicDeploy: {
                        build: vsprintf("%s%s%s/%s/", [
                            process.cwd(),
                            config.get("app.paths._base.build"),
                            "test",
                            "topics"
                        ]),
                        deploy: (function(){
                            var deployConfig = config.get("app.paths.deploy");
                            if ( deployConfig["test"].addWorkingDirectory) {
                                return vsprintf("%s%s%s%s/", [
                                    process.cwd(),
                                    deployConfig["test"].path,
                                    deployConfig["test"].folderName,
                                    "/topics"
                                ]);
                            } else {
                                return vsprintf("%s%s%s/", [
                                    deployConfig["test"].path,
                                    deployConfig["test"].folderName,
                                    "/topics"
                                ]);
                            }
                        })()
                    },
                    productionTopicDeploy: {
                        build: vsprintf("%s%s%s/%s/", [
                            process.cwd(),
                            config.get("app.paths._base.build"),
                            "production",
                            "topics"
                        ]),
                        deploy: (function(){
                            var deployConfig = config.get("app.paths.deploy");
                            if ( deployConfig["production"].addWorkingDirectory) {
                                return vsprintf("%s%s%s%s/", [
                                    process.cwd(),
                                    deployConfig["production"].path,
                                    deployConfig["production"].folderName,
                                    "/topics"
                                ]);
                            } else {
                                return vsprintf("%s%s%s/", [
                                    deployConfig["production"].path,
                                    deployConfig["production"].folderName,
                                    "/topics"
                                ]);
                            }
                        })()
                    },
                    testDeploy: {
                        build: vsprintf( "%s%s%s/%s/", [
                            process.cwd(),
                            config.get("app.paths._base.build"),
                            "test",
                            apiVersion
                        ] ) ,
                        deploy: (function(){
                            var deployConfig = config.get("app.paths.deploy");
                            if ( deployConfig["test"].addWorkingDirectory) {
                                var destBasePath = vsprintf("%s%s%s/%s/", [
                                    process.cwd(),
                                    deployConfig["test"].path,
                                    deployConfig["test"].folderName,
                                    apiVersion
                                ]);
                            } else {
                                var destBasePath = vsprintf("%s%s/%s/", [
                                    deployConfig["test"].path,
                                    deployConfig["test"].folderName,
                                    apiVersion
                                ]);
                            }
                            return destBasePath;
                        })()
                    },
                    productionExport: {
                        build: vsprintf( "%s%s%s/%s/", [
                            process.cwd(),
                            config.get("app.paths._base.build"),
                            "production",
                            apiVersion
                        ] ),
                        git: vsprintf( "%s%s%s/", [
                            process.cwd(),
                            config.get("gitConfig.path.local"),
                            "inner"
                        ])
                    },
                    productionFullZip: {
                        from: vsprintf( "%s%s%s/%s/", [
                            process.cwd(),
                            config.get("app.paths._base.build"),
                            "production",
                            apiVersion
                        ] ),
                        save: config.get("app.paths.backup")
                    },
                    productionDeploy: {
                        from: vsprintf( "%s%s%s/%s/", [
                            process.cwd(),
                            config.get("app.paths._base.build"),
                            "production",
                            apiVersion
                        ] ),
                        deploy: (function(){
                            var deployConfig = config.get("app.paths.deploy");
                            if ( deployConfig["production"].addWorkingDirectory) {
                                var destBasePath = vsprintf("%s%s%s/%s/", [
                                    process.cwd(),
                                    deployConfig["production"].path,
                                    deployConfig["production"].folderName,
                                    apiVersion
                                ]);
                            } else {
                                var destBasePath = vsprintf("%s%s/%s/", [
                                    deployConfig["production"].path,
                                    deployConfig["production"].folderName,
                                    apiVersion
                                ]);
                            }
                            return destBasePath;
                        })()
                    }
                }
            },
            auth: req.user
        }

        if ( args ) {
            if( args.message || args.error ) locals.message = {}
            if( args.message ) locals.message = args.message;
        }

        //---------------------------------------------------------------------------
        // テンプレート描画
        //---------------------------------------------------------------------------

        var templatePath = "deploy/list";
        res.render( templatePath, locals );

        debug("render finished")

    } catch(e){
        console.log(e);
    }

}

module.exports = render;
