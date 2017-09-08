////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var viewController = require('../controllers/topics/topicsViewController');
var apiController = require('../controllers/topics/topicsApiController');
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
router.post('/', apiController.add ); // トピック追加
router.put('/:id', apiController.edit ); // トピック編集
router.delete('/:id', apiController.remove ); // トピック削除
router.get('/images/cleanup', apiController.cleanupImage );  // 不要画像を削除

// 画像アップロード
router.get('/images/', recycleUploader.getFileList );
router.post('/images/', recycleUploader.save );
router.delete('/images/:fileName', recycleUploader.remove );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
