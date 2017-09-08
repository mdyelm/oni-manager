////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var express = require('express');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var viewController = require('../controllers/situations/situationsViewController');
var apiController = require('../controllers/situations/situationsApiController');
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

router.get('/checkCodeExists/:code', apiController.checkCodeExists ); // シチュエーションコードの重複確認


// アップローダー設定

// 着信画面

// 背景画像 (シチュエーションごとのフォルダにアップロード)
router.get('/images/callBackgrounds/:situationCode', recycleUploader.getFileList );
router.post('/images/callBackgrounds/:situationCode', recycleUploader.save );
router.delete('/images/callBackgrounds/:situationCode/:fileName', recycleUploader.remove );

// スペシャル着信音 (全体フォルダにアップロード)
router.get('/sounds/callSpecialSounds/', recycleUploader.getFileList );
router.post('/sounds/callSpecialSounds/', recycleUploader.save );
router.delete('/sounds/callSpecialSounds/:fileName', recycleUploader.remove );


// 通話画面

// 通話音声 (シチュエーションごとのフォルダにアップロード)
router.get('/sounds/talkSounds/:situationCode', recycleUploader.getFileList );
router.post('/sounds/talkSounds/:situationCode', recycleUploader.save );
router.delete('/sounds/talkSounds/:situationCode/:fileName', recycleUploader.remove );

// 通話BGM音声 (全体フォルダにアップロード)
router.get('/sounds/talkSoundBGMs/', recycleUploader.getFileList );
router.post('/sounds/talkSoundBGMs/', recycleUploader.save );
router.delete('/sounds/talkSoundBGMs/:fileName', recycleUploader.remove );

// 通話動画 (シチュエーションごとのフォルダにアップロード)
router.get('/videos/talkVideos/:situationCode', recycleUploader.getFileList );
router.post('/videos/talkVideos/:situationCode', recycleUploader.save );
router.delete('/videos/talkVideos/:situationCode/:fileName', recycleUploader.remove );

// シーン画像 (シチュエーションごとのフォルダにアップロード)
router.get('/images/talkScenes/:situationCode', recycleUploader.getFileList );
router.post('/images/talkScenes/:situationCode', recycleUploader.save );
router.delete('/images/talkScenes/:situationCode/:fileName', recycleUploader.remove );


// その他

// ストア画像 (シチュエーションごとのフォルダにアップロード)
router.get('/images/storeThumbnails/:situationCode', recycleUploader.getFileList );
router.post('/images/storeThumbnails/:situationCode', recycleUploader.save );
router.delete('/images/storeThumbnails/:situationCode/:fileName', recycleUploader.remove );

// スペシャルボタン背景 (全体フォルダにアップロード)
router.get('/images/specialButtons/', recycleUploader.getFileList );
router.post('/images/specialButtons/', recycleUploader.save );
router.delete('/images/specialButtons/:fileName', recycleUploader.remove );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
