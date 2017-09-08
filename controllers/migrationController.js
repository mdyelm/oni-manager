/**
*   引っ越し用コントローラ
*   @module migrationController
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
var topicsDAO = require(process.cwd() + '/dao/topicsDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
var menusDAO = require(process.cwd() + '/dao/menusDAO');
var menuBackgroundsDAO = require(process.cwd() + '/dao/menuBackgroundsDAO');
var pickupsDAO = require(process.cwd() + '/dao/pickupsDAO');
var usersDAO = require(process.cwd() + '/dao/usersDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
*   引っ越し用コントローラ
*   @class migrationController
*/


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DBの各テーブルセットアップ
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
*   @method setup
*   @param {Object} req expressのreqを流用
*   @param {Object} res expressのresを流用
*   @param {Object} next expressのnextを流用
*/

module.exports.setup = function(req, res, next){

    Promise.all([
        appDAO.setup(),
        languagesDAO.setup(),
        osDAO.setup(),
        logsDAO.setup(),
        topicsDAO.setup(),
        situationsDAO.setup(),
        situationDetailsDAO.setup(),
        menusDAO.setup(),
        menuBackgroundsDAO.setup(),
        pickupsDAO.setup(),
        usersDAO.setup()
    ]).then(function(){
        res.json({
            "status": "OK!"
        });
    }).catch(function(err){
      throw err;
    })

}
