////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/dashboard/_render');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DAO
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function render( req, res, next, args ){
    debug("render");

    try {

        //---------------------------------------------------------------------------
        // テンプレート用変数準備
        //---------------------------------------------------------------------------

        var locals = {
            data: {
                languages: await languagesDAO.fetch(),
                os: await osDAO.fetch(),
                deployLogs: await logsDAO.fetch({ limit: 10, where: { object: "exporter"} }),
                operationLogs: await logsDAO.fetch({ limit: 20, where: "`object` NOT LIKE 'exporter'"}),
                keyValues: maUtil.combineKeyValues([
                    await appDAO.fetchItem("SETTINGS_NOTE")
                ])
            },
            auth: req.user
        }

        //---------------------------------------------------------------------------
        // テンプレート描画
        //---------------------------------------------------------------------------

        var templatePath = "dashboard/index";
        res.render( templatePath, locals );

        debug("render finished");

    } catch(e){
        debug("render error %s", e);
    }

}

module.exports = render;
