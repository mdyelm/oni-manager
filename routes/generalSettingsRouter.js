////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var viewController = require('../controllers/generalSettings/generalSettingsViewController');
var apiController = require('../controllers/generalSettings/generalSettingsApiController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();

router.use(function checkAuth( req, res, next ){
    if (!req.user) { res.redirect('/login'); return } // セッション確認
    next();
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// View
router.get('/', viewController.index); // 一覧表示

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// API
router.put('/', apiController.edit ); // 設定の編集

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;