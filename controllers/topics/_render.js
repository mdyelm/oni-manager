////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var debug = require('debug')('om/topics/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

        var languages = await languagesDAO.fetch();
        var os = await osDAO.fetch();
        var topics = await topicsDAO.fetch();

        // お知らせを言語OS構造体として取得
        var envedTopics = maUtil.getEnvedObject( languages, os, topics );

        maUtil.nestedLoop({
            targets: [
                {data: languages, name: "language"},
                {data: os, name: "os"}
            ],
            mainFunction: function( args ){
                var language = args.language;
                var os = args.os;

                envedTopics[language.code][os.code].forEach(function(topic, i){
                    envedTopics[language.code][os.code][i].osName = os.name;
                    envedTopics[language.code][os.code][i].osCode = os.code;
                })

            }
        })

        var locals = {
            data: {
                languages: languages,
                os: os,
                allEnvedTopics: envedTopics,
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

        var templatePath = "topics/list";
        res.render( templatePath, locals );

        debug("render finished");

    } catch(e) {
        debug("render err %0", e);
    }

}

module.exports = render;
