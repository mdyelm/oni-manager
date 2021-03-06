////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var migrationController = require('../controllers/migrationController');
var gitManager = require('../util/gitManager');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// トップページ遷移
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/', function(req, res, next) {
    res.redirect('/dashboard');
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ログアウト
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DBセットアップ
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/setup', function(req, res, next){
    migrationController.setup(req, res, next);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DBセットアップ
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/git/setup', function(req, res, next){
    gitManager.setup(req,res,next);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/test/:id', function(req, res, next){
    console.log(req);
});


module.exports = router;
