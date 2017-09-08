////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var escape = require("escape-html");
var debug = require('debug')('om/generalSettings/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DAO
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var topicsDAO = require(process.cwd() + '/dao/topicsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ){
    debug("render");

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var os = await osDAO.fetch();
        var languages = await languagesDAO.fetch();

        var keyValues = maUtil.combineKeyValues([
            await appDAO.fetchItem("SETTINGS_NOTE"),
            await appDAO.fetchItem("SETTINGS_APIVERSION"),
            await appDAO.fetchItem("SETTINGS_APPVERSION_IOS"),
            await appDAO.fetchItem("SETTINGS_CATEGORIES"),
            await appDAO.fetchItem("SETTINGS_TIMEZONES"),
            await appDAO.fetchItem("TOPICS_FOOTER_HTML")
        ])

        for (let language of languages){

            keyValues = Object.assign(keyValues, maUtil.combineKeyValues([
                await appDAO.fetchItem("SETTINGS_APPVERSION_ANDROID_" + language.code.toUpperCase() ),
                await appDAO.fetchItem("SETTINGS_ZIPVERSION_IOS_" + language.code.toUpperCase() ),
                await appDAO.fetchItem("SETTINGS_ZIPVERSION_ANDROID_" + language.code.toUpperCase() ),
            ]))

            for (let osItem of os){
                keyValues = Object.assign(keyValues, await appDAO.fetchItem("SETTINGS_TOPICS_URL_" + language.code.toUpperCase() + "_"  + osItem.code.toUpperCase() ) );
            }

        }

        // タグが入るためエスケープする
        keyValues["TOPICS_FOOTER_HTML"].value = escape(keyValues["TOPICS_FOOTER_HTML"].value);

        var locals = {
            data: {
                languages: languages,
                os: os,
                keyValues: keyValues,
                topicsTestUrl: config.get("app.dataSet.topicURL.test")
            },
            auth: req.user
        }

        if ( args ) {
            if( args.message || args.error ) locals.message = {}
            if( args.message ) locals.message.text = args.message.text;
            if( args.error ) locals.message.err = args.error;
        }

        //---------------------------------------------------------------------------
        // テンプレート描画
        //---------------------------------------------------------------------------

        var templatePath = "generalSettings/index";
        res.render(templatePath, locals);

        debug("render finished");

    } catch(e) {
        debug("render error %0", e);
    }

}

module.exports = render;
