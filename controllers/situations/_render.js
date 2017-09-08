require( process.cwd() + "/define" );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var debug = require('debug')('om/situations/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var appDAO = require(process.cwd() + '/dao/appDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ){
    debug("render");

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var languages = await languagesDAO.fetch();
        var os = await osDAO.fetch();

        var situations = await situationsDAO.fetch();
        var situationDetails = await situationDetailsDAO.fetch();


        // situationsにシチュエーション詳細を言語/OSごとに追加する
        situations.forEach( function( situation, i ){

            var matchedDetails = situationDetails.filter( function( situationDetail ){
                return situation.id == situationDetail.situationId;
            });

            var envStatus = []

            maUtil.nestedLoop({
                targets: [
                    {data: languages, name: "language"},
                    {data: os, name: "os"}
                ],
                mainFunction: function( args ){

                    var language = args.language;
                    var os = args.os;

                    if( situations[i]["details"] == undefined ) situations[i]["details"] = {}
                    if( situations[i]["details"][language.code] == undefined ) situations[i]["details"][language.code] = {}

                    var envMatchedSituation = matchedDetails.filter( function( item ){
                        return (item.languageId == language.id && item.osId == os.id );
                    })[0];

                    if ( envMatchedSituation ) situations[i]["details"][language.code][os.code] = envMatchedSituation;

                    envStatus.push( envMatchedSituation.isEnabled );  // ステータス確認


                }

            })

            if ( envStatus.indexOf( SITUATION_STATUS_ENABLED ) < 0 && envStatus.indexOf( SITUATION_STATUS_TESTING ) < 0 ){
                situations[i]["isAllEnvDisabled"] = true;
            } else {
                situations[i]["isAllEnvDisabled"] = false;
            }

        });

        var locals = {
            data: {
                languages: languages,
                os: os,
                allSituations: situations,
                situationDetails: situationDetails,
                keyValues: {},
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

        var templatePath = "situations/list";
        res.render( templatePath, locals );

        debug("render finished");

    } catch(e) {
        debug("render err %0", e);
    }

}

module.exports = render;
