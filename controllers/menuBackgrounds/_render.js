////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var debug = require('debug')('om/menuBackgrounds/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var menuBackgroundsDAO = require(process.cwd() + '/dao/menuBackgroundsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ) {
    debug("render");

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var languages = await languagesDAO.fetch();
        var os = await osDAO.fetch();
        var menuBackgrounds = await menuBackgroundsDAO.fetch();

        // メニュー背景を言語OS構造体として取得
        var allEnvedMenuBackgrounds = maUtil.getEnvedObject( languages, os, menuBackgrounds );

        // 有効に設定されているメニュー背景
        var enabledMenuBackgrounds = menuBackgrounds.filter(function( menuBackground ){
            return ( menuBackground.isEnabled == MENUBACKGROUND_STATUS_ENABLED );
        });
        var enabledEnvedMenuBackgrounds = maUtil.getEnvedObject( languages, os, enabledMenuBackgrounds );

        // 無効に設定されているメニュー背景
        var disabledMenuBackgrounds = menuBackgrounds.filter(function( menuBackground ){
            return ( menuBackground.isEnabled == MENUBACKGROUND_STATUS_ENABLED );
        });
        var disabledEnvedMenuBackgrounds = maUtil.getEnvedObject( languages, os, disabledMenuBackgrounds );

        var locals = {
            data: {
                languages: await languagesDAO.fetch(),
                os: await osDAO.fetch(),
                allEnvedMenuBackgrounds: allEnvedMenuBackgrounds,
                enabledEnvedMenuBackgrounds: enabledEnvedMenuBackgrounds,
                disabledEnvedMenuBackgrounds: disabledEnvedMenuBackgrounds,
                keyValues: {}
            },
            auth: req.user
        }

        if ( args ) {
            if( args.message || args.error ) locals.message = {}
            if( args.message ) locals.message.text = args.message.text;
            if( args.error ) locals.message.err = args.error;
            if( args.deletedFiles ) locals.message.deletedFiles = args.deletedFiles;
        }

        //---------------------------------------------------------------------------
        // テンプレート描画
        //---------------------------------------------------------------------------

        var templatePath = "menuBackgrounds/list";
        res.render(templatePath, locals);

        debug("render finished");

    } catch(e) {
        debug("render err %0", e);
    }

}

module.exports = render;
