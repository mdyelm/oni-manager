////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var viewController = require('../controllers/dashboard/dashboardViewController');
var apiController = require('../controllers/dashboard/dashboardApiController');
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;