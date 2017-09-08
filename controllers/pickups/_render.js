////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/pickups/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var pickupsDAO = require(process.cwd() + '/dao/pickupsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ){
    debug("render");

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var languages = await languagesDAO.fetch();
        var os = await osDAO.fetch();
        var pickups = await pickupsDAO.fetch();

        // ピックアップを言語OS構造体として取得
        var allEnvedPickups = maUtil.getEnvedObject( languages, os, pickups );

        // 有効に設定されているピックアップ枠
        var enabledPickups = pickups.filter(function( pickup ){
            return ( pickup.isEnabled == PICKUP_STATUS_ENABLED );
        });
        var enabledEnvedPickups = maUtil.getEnvedObject( languages, os, enabledPickups );

        // 無効に設定されているピックアップ枠
        var disabledPickups = pickups.filter(function( pickup ){
            return ( pickup.isEnabled == PICKUP_STATUS_DISABLED );
        });
        var disabledEnvedPickups = maUtil.getEnvedObject( languages, os, disabledPickups );

        var locals = {
            data: {
                languages: await languagesDAO.fetch(),
                os: await osDAO.fetch(),
                allEnvedPickups: allEnvedPickups,
                enabledEnvedPickups: enabledEnvedPickups,
                disabledEnvedPickups: disabledEnvedPickups,
                keyValues: {},
                nativeAdEffects: config.get("app.dataSet.nativeAdEffects")
            },
            auth: req.user
        }

        if ( args ) {
            if( args.message || args.error || args.deletedFiles ) locals.message = {}
            if( args.message ) locals.message.text = args.message.text;
            if( args.error ) locals.message.err = args.error;
            if( args.deletedFiles ) locals.message.deletedFiles = args.deletedFiles;
        }

        //---------------------------------------------------------------------------
        // テンプレート描画
        //---------------------------------------------------------------------------

        var templatePath = "pickups/list";
        res.render( templatePath, locals );

        debug("render finished");

    } catch(e) {
        debug("render err %0", e);
    }

}

module.exports = render;
