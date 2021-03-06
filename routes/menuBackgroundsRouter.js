////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var viewController = require('../controllers/menuBackgrounds/menuBackgroundsViewController');
var apiController = require('../controllers/menuBackgrounds/menuBackgroundsApiController');
var recycleUploader = require('../controllers/_modules/recycleUploader');
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

router.post('/', apiController.add ); // 背景画像の追加
router.put('/:id', apiController.edit ); // 背景画像の編集
router.delete('/:id', apiController.remove ); // 背景画像の削除

router.get('/images', recycleUploader.getFileList ); // 画像一覧
router.post('/images', recycleUploader.save ); // 画像の追加
router.delete('/images/:fileName', recycleUploader.remove ); // 背景画像の削除

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
