////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/users/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DAO
var usersDAO = require(process.cwd() + '/dao/usersDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ){
    debug("render");

    try {

        var users = await usersDAO.fetch();

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var locals = {
            data: {
                users: users,
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

        var templatePath = "users/list";
        res.render( templatePath, locals );

        debug("render finished");

    } catch(e) {
        debug("render err %0", e);
    }

}

module.exports = render;
