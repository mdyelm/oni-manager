////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/menus/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var menusDAO = require(process.cwd() + '/dao/menusDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ) {
    debug("render");

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var languages = await languagesDAO.fetch();
        var os = await osDAO.fetch();

        var menus = await menusDAO.fetch();
        var situations = await situationsDAO.fetch();
        var situationDetails = await situationDetailsDAO.fetch();

        var keyValues = maUtil.combineKeyValues([
            await appDAO.fetchItem("SETTINGS_CATEGORIES"),
            // await appDAO.fetchItem("SETTINGS_TIMEZONES"),
        ])

        // カテゴリ追加
        var categories = JSON.parse(keyValues["SETTINGS_CATEGORIES"].value);

        // タイムゾーン追加
        // var timezones = JSON.parse(combinedData.keyValues["SETTINGS_TIMEZONES"].value);


        // メニューのデータにシチュエーション基本情報・シチュエーション詳細を統合する
        var modifiedMenus = []
        menus.forEach(function( menu, i ){

            // メニューと一致するシチュエーション基本情報を取得
            var matchedSituation = situations.filter(function( situation ){
                return ( situation.id == menu.situationId );
            })[0];

            // メニューと一致するシチュエーション詳細を取得
            var matchedSituationDetail = situationDetails.filter(function( situationDetail ){
                return ( situationDetail.situationId == menu.situationId ) &&
                ( situationDetail.languageId == menu.languageId ) &&
                ( situationDetail.osId == menu.osId );
            })[0];

            // 取得結果を結合
            modifiedMenus[i] = Object.assign( menu, {
                situation: matchedSituation ? matchedSituation : "",
                situationDetail: matchedSituationDetail ? matchedSituationDetail : ""
            });

        });

        // 全メニューの言語/OS構造体を作成
        var allEnvedMenus = maUtil.getEnvedObject( languages, os, modifiedMenus );

        // 有効なメニューの言語/OS構造体を作成
        var enabledEnvedMenus = maUtil.getEnvedObject( languages, os,
            modifiedMenus.filter(function( menu){
                return ( menu.situationDetail.isEnabled == 1 || menu.situationDetail.isEnabled == 2 );
            })
        );

        // 無効なメニューの言語/OS構造体を作成
        var disabledEnvedMenus = maUtil.getEnvedObject( languages, os,
            modifiedMenus.filter(function( menu ){
                return ( menu.situationDetail.isEnabled == 0 || menu.situationDetail.isEnabled == null );
            })
        );

        // シチュエーション詳細にシチュエーション基本情報を統合する
        var modifiedSituationDetails = []
        situationDetails.forEach(function( situationDetail, i ){
            var matchedSituation = situations.filter(function( situation ){
                return ( situation.id == situationDetail.situationId );
            })[0];
            modifiedSituationDetails[i] = Object.assign( situationDetail, {
                situation: matchedSituation ? matchedSituation : "",
            });
        });

        // 有効なシチュエーションの言語/OS構造体作成
        var allEnvedSituationDetails = maUtil.getEnvedObject( languages, os, modifiedSituationDetails );

        function _getCategorizedObject( envedObject ){

            var results = {}

            maUtil.nestedLoop({
                targets: [
                    {data: languages, name: "language"},
                    {data: os, name: "os"}
                ],
                mainFunction: function( args ){

                    var language = args.language;
                    var os = args.os;

                    if(results[language.code] == undefined) results[language.code] = {}
                    if(results[language.code][os.code] == undefined) results[language.code][os.code] = {}
                    var currentMenus = envedObject[language.code][os.code];
                    var currentCategories = categories[language.code][os.code];

                    // 時間帯おすすめのメニューをまとめる
                    // results[language.code][os.code].timezoneSuggest = currentMenus.filter(function(menu){ return menu.type == "timezoneSuggest" });

                    // カテゴリごとのメニューをまとめる
                    var categoryMenus = currentMenus.filter(function(menu){ return menu.type == "normal" });
                    currentCategories.forEach( function( category ){
                        results[language.code][os.code][category.code] = categoryMenus.filter(function(menu){ return menu.category == category.code });
                    });

                }
            });

            return results;

        }
        var locals = {
            data: {
                languages: languages,
                os: os,
                categories: categories,
                // timezones: timezones,
                situations: situations,
                allEnvedSituationDetails: allEnvedSituationDetails, //フロントでメニューと組み合わせている
                allEnvedMenus: allEnvedMenus,
                enabledEnvedMenus: _getCategorizedObject(enabledEnvedMenus),
                disabledEnvedMenus: disabledEnvedMenus,
                keyValues: keyValues,
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

        var templatePath = "menus/list";
        res.render( templatePath, locals );

        debug("render finished");

    } catch(e) {
        debug("render %0", e);
    }

}

module.exports = render;
