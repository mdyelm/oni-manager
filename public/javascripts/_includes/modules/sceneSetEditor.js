var recycleUploader = require("../../_includes/modules/recycleUploader.js");
var dataAccess = require("../../_includes/dataAccess.js");

var sceneSetEditor = function(){
    var _this = null;
    var _savedOptions = {}
    var _savedData = {}
    var _dupe = {}
    var _current = {
        itemDetail: {},
        sceneSetId: 0,
        sceneType: "normal"
    }
    var _usedModules = {}

    return {
        // ---------------------------------------------------------------------------------
        // 初期化
        // ---------------------------------------------------------------------------------
        init: function(options){
            _this = this;

            // setup options
            var defaultOptions = {
                $body: null,
                code: "",
                sceneSets: [
                    {
                        code: "default",
                        phoneNumber: "",
                        callBackgroundImagePath: "",
                        callSoundVolume: "1.0",
                        isUseSpecialCallSound: "0",
                        specialCallSoundPath: "",
                        sceneSoundPath: "",
                        sceneSoundBGMPath: "",
                        sceneSoundBGMVolume: "1.0",
                        sceneVideoPath: "",
                        selectRatio: "",
                        analyticsName: "",
                        scenes: [
                            {
                                sceneBackgroundImagePath: "",
                                sceneDuration: "",
                                sceneFadeInDelay: "",
                                sceneCharacterName: "",
                                // note: "",
                            }
                        ],
                        repeatLastScenes: [
                            // {
                            //     sceneBackgroundImagePath: "",
                            //     sceneDuration: "",
                            //     sceneCharacterName: "",
                            //     note: "",
                            // }
                        ]
                    }
                ]
            }
            _savedOptions = Object.assign(defaultOptions, options);

            // setup saveData
            _savedData =  {
                sceneSets: _savedOptions.sceneSets
            };

            this.update();

        },
        // ---------------------------------------------------------------------------------
        // 画面更新
        // ---------------------------------------------------------------------------------
        // テンプレート描画→アップローダー初期化→イベント設定→シーンセット切り替え→DB用フィールド更新
        update: function(){
            var d = $.Deferred();

            $.Deferred().resolve()
            .then(_this.render)
            .then(_this.setModules)
            .then(_this.setEvent)
            .then(_this.setCurrentSceneSet)
            .then(_this.setCurrentSceneType)
            .then(_this.setOutput)
            .done(function(){
                console.log("sceneSetEditor update finished.");
                d.resolve();
            });

            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // テンプレート描画
        // ---------------------------------------------------------------------------------
        // テンプレート読み込み→データ準備→データセット→描画
        render: function(){
            var d = $.Deferred();

            // テンプレートの再描画
            var template = $.templates("#sceneSetEditor");
            // そのままだとシーンセット間でデータが共有されてしまうため複製
            var dupe = Object.assign({},_savedData);
            _dupe = dupe;
            var html = template.render( dupe );
            _savedOptions.$body.empty().html(html);

            d.resolve();
            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // シーンセット追加
        // ---------------------------------------------------------------------------------
        // 保存データにシーンセット追加→画面更新
        addSceneSet: function(){
            _savedData.sceneSets.push({
                code: "noname",
                phoneNumber: "",
                callBackgroundImagePath: "",
                callSoundVolume: "1.0",
                isUseSpecialCallSound: false,
                specialCallSoundPath: "",
                sceneSoundPath: "",
                sceneSoundBGMPath: "",
                sceneSoundBGMVolume: "1.0",
                sceneVideoPath: "",
                selectRatio: "",
                analyticsName: "",
                scenes: [],
                repeatLastScenes: []
            });

            _this.update();

        },
        // ---------------------------------------------------------------------------------
        // シーン追加
        // ---------------------------------------------------------------------------------
        // 保存データにシーン追加→画面更新
        addScene: function(){
            var sceneSetId = _current.sceneSetId;
            var sceneType = $(this).attr("data-scene-type");


            switch( sceneType ) {

                case "normal":
                    _savedData.sceneSets[sceneSetId].scenes.push({
                        // sceneName: "",
                        sceneBackgroundImagePath: "",
                        sceneDuration: "",
                        sceneFadeInDelay: "",
                        sceneCharacterName: "",
                        note: "",
                    });
                    break;

                case "repeatLastScene":
                    _savedData.sceneSets[sceneSetId].repeatLastScenes.push({
                        // sceneName: "",
                        sceneBackgroundImagePath: "",
                        sceneDuration: "",
                        note: "",
                    });
                    break;
            }

            _this.update();

        },
        // ---------------------------------------------------------------------------------
        // シーンセット削除
        // ---------------------------------------------------------------------------------
        // IDを基に保存データからシーンセット削除→画面更新
        removeSceneSet: function(){
            var sceneSetId = parseInt($(this).parents(".sceneSetSelectListItem").attr("data-sceneset-id"));
            _savedData.sceneSets.splice(sceneSetId, 1);
            _this.update();
        },
        // ---------------------------------------------------------------------------------
        // シーン削除
        // ---------------------------------------------------------------------------------
        // シーンの種類判別→IDを基に保存データからシーン削除→画面更新
        removeScene: function(){
            var sceneSetId = _current.sceneSetId;
            var sceneId = parseInt($(this).parents(".sceneListItem").attr("data-scene-id"));
            var sceneType = $(this).parents(".sceneListItem").attr("data-scene-type");

            switch ( sceneType ) {

                case "normal":
                    _savedData.sceneSets[sceneSetId].scenes.splice(sceneId, 1);
                    break;

                case "repeatLastScene":
                    _savedData.sceneSets[sceneSetId].repeatLastScenes.splice(sceneId, 1);
                    break;

            }

            _this.update();

        },
        // ---------------------------------------------------------------------------------
        // 使用モジュール初期化
        // ---------------------------------------------------------------------------------
        // 各リサイクルアップローダー初期化→完了
        setModules: function(){
            var d = $.Deferred();

            var queue = []

            // 着信画面背景画像用アップローダー設定
            var callBackgroundUploader = recycleUploader();
            var $uploader = $(".callBackgroundUploader", _savedOptions.$body );

            queue.push( callBackgroundUploader.init({
                type: "image",
                api: "/situations/images/callBackgrounds/" + _savedOptions.code + "/",
                $appendTo: $(".upload", $uploader),
                $input: $(".field .input input", $uploader),
            }) );

            // スペシャル着信音用アップローダー設定
            var callSpecialSoundUploader = recycleUploader();
            var $uploader = $(".callSpecialSoundUploader",  _savedOptions.$body);

            queue.push( callSpecialSoundUploader.init({
                type: "sound",
                api: "/situations/sounds/callSpecialSounds/",
                $appendTo: $(".upload", $uploader),
                $input: $(".field .input input", $uploader),
            }) );


            // 通話音声用アップローダー設定
            var sceneSoundUploader = recycleUploader();
            var $uploader = $(".sceneSoundUploader", _savedOptions.$body);

            queue.push( sceneSoundUploader.init({
                type: "sound",
                api: "/situations/sounds/talkSounds/" + _savedOptions.code + "/",
                $appendTo: $(".upload", $uploader),
                $input: $(".field .input input", $uploader),
            }) );

            // 通話BGM用アップローダー設定
            var sceneSoundBGMUploader = recycleUploader();
            var $uploader = $(".sceneSoundBGMUploader", _savedOptions.$body);

            queue.push( sceneSoundBGMUploader.init({
                type: "sound",
                api: "/situations/sounds/talkSoundBGMs/",
                $appendTo: $(".upload", $uploader),
                $input: $(".field .input input", $uploader),
            }) );

            // 通話動画用アップローダー設定
            var sceneVideoUploader = recycleUploader();
            var $uploader = $(".sceneVideoUploader", _savedOptions.$body);

            queue.push( sceneVideoUploader.init({
                type: "video",
                api: "/situations/videos/talkVideos/" + _savedOptions.code + "/",
                $appendTo: $(".upload", $uploader),
                $input: $(".field .input input", $uploader),
            }) );

            // 通話シーン画像用アップローダー設定
            var sceneImageUploader = recycleUploader();
            var $uploader = $(".sceneImageUploader", _savedOptions.$body);

            queue.push( sceneImageUploader.init({
                type: "image",
                api: "/situations/images/talkScenes/" + _savedOptions.code + "/",
                $appendTo: $(".upload", $uploader),
                $input: $(".field .input input", $uploader),
            }) );

            _usedModules = {
                callBackgroundUploader: callBackgroundUploader,
                sceneSoundUploader: sceneSoundUploader,
                sceneSoundBGMUploader: sceneSoundBGMUploader,
                sceneVideoUploader: sceneVideoUploader,
                sceneImageUploader: sceneImageUploader
            }

            Promise.all( queue )
                .then(function(){
                    d.resolve();
                })

            return d.promise();

        },
        setAPIUrlCode: function( newCode ){
          _savedOptions.code = newCode;
          _usedModules.sceneSoundUploader.setAPIUrl("/situations/sounds/talkSounds/" + newCode + "/");
          _usedModules.sceneVideoUploader.setAPIUrl("/situations/videos/talkVideos/" + newCode + "/");
          _usedModules.sceneImageUploader.setAPIUrl("/situations/images/talkScenes/" + newCode + "/");
          _usedModules.callBackgroundUploader.setAPIUrl("/situations/images/callBackgrounds/" + newCode + "/");
        },
        // ---------------------------------------------------------------------------------
        // 変更内容の保存
        // ---------------------------------------------------------------------------------
        // フィールド判別→フィールドに応じて変数内の保存先を変更→保存→画面更新
        setValueToSavedData: function(){

            var sceneSetId = _current.sceneSetId;
            var fieldName = $(this).attr("data-fieldname");

            switch( fieldName ){

                // シーンに対する設定
                case "sceneName":
                case "sceneBackgroundImagePath":
                case "sceneDuration":
                case "sceneFadeInDelay":
                case "sceneCharacterName":
                case "sceneMemo":

                    var sceneType = $(this).parents(".sceneListItem").attr("data-scene-type");
                    var sceneId = parseInt($(this).parents(".sceneListItem").attr("data-scene-id"));

                    switch( sceneType ) {

                        case "normal":
                            _savedData.sceneSets[sceneSetId].scenes[sceneId][fieldName] = $(this).val();
                            break;

                        case "repeatLastScene":
                            _savedData.sceneSets[sceneSetId].repeatLastScenes[sceneId][fieldName] = $(this).val();
                            break;

                    }

                    break;

                // シーンセットに対する設定
                default:
                    _savedData.sceneSets[sceneSetId][fieldName] = $(this).val();
                    break;

            }

            _this.update();

        },
        // ---------------------------------------------------------------------------------
        // シーンセットの変更
        // ---------------------------------------------------------------------------------
        // 一旦全部消す→カレント変更→カレントのシーンセットを表示→完了
        setCurrentSceneSet: function(e){
            var d = $.Deferred();

            // 全部を非表示
            $(".sceneSetListItem", _savedOptions.$body).addClass("hidden");

            // クリックされた場合は現在のシーンセット値を変更
            var isClicked = Boolean(e);
            if(isClicked){
                var sceneSetId = parseInt($(this).attr("data-sceneset-id"));
                _current.sceneSetId = sceneSetId;
            }

            // 選択中を切り替え
            $(".sceneSetSelectListItem", _savedOptions.$body).removeClass("selected");
            $(".sceneSetSelectListItem[data-sceneset-id="+_current.sceneSetId+"]", _savedOptions.$body).addClass("selected");

            // 対象を表示
            var $currentSceneSetItem = $(".sceneSetListItem[data-sceneset-id="+_current.sceneSetId+"]", _savedOptions.$body);
            $currentSceneSetItem.removeClass("hidden");

            d.resolve();
            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // 通常シーン、リピート最終シーンの表示切替
        // ---------------------------------------------------------------------------------
        // 一旦全部消す→カレント変更→カレントのシーンタイプを表示→完了
        setCurrentSceneType: function(e){
            var d = $.Deferred();

            // 一旦全部消す
            $(".scenes > .typeSelector .selectorItem", _savedOptions.$body).removeClass("selected");
            $(".scenes > .type", _savedOptions.$body).addClass("hidden");

            // クリックされた場合は現在のシーンセット値を変更
            var isClicked = Boolean(e);
            if(isClicked){
                var sceneType = $(this).attr("data-scene-type");
                _current.sceneType = sceneType;
            }

            // 対象を表示
            var $currentSceneTypeSelectorItem = $(".scenes > .typeSelector .selectorItem[data-scene-type="+_current.sceneType+"]", _savedOptions.$body);
            var $currentScenes = $(".scenes > .type[data-scene-type="+_current.sceneType+"]",  _savedOptions.$body);
            $currentSceneTypeSelectorItem.addClass("selected");
            $currentScenes.removeClass("hidden");

            d.resolve();
            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // 出力用入力欄のJSON更新
        // ---------------------------------------------------------------------------------
        setOutput: function(){
            var d = $.Deferred();

            var editorId = _savedOptions.$body.attr("id");
            $("#" + editorId + "_value").val(JSON.stringify(_savedData.sceneSets)).change();

            d.resolve();
            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // イベント設定
        // ---------------------------------------------------------------------------------
        setEvent: function(){
            var d = $.Deferred();

            // シーンセットの選択
            $(".actionSelectSceneSet", _savedOptions.$body).on("click", _this.setCurrentSceneSet);

            // シーンセットの追加
            $(".actionAddSceneSet", _savedOptions.$body).on("click", _this.addSceneSet);

            // シーンセットの削除
            $(".actionRemoveSceneSet", _savedOptions.$body).on("click", _this.removeSceneSet);

            // シーンタイプの切り替え
            $(".actionSelectSceneType", _savedOptions.$body).on("click", _this.setCurrentSceneType);

            // シーンの追加
            $(".actionAddScene", _savedOptions.$body).on("click", _this.addScene);

            // シーンの削除
            $(".actionRemoveScene", _savedOptions.$body).on("click", _this.removeScene);

            // 変更を保存
            $(".meta input, .meta select", _savedOptions.$body).not("input[type=file]").on("change", _this.setValueToSavedData);
            $(".call input, .call select", _savedOptions.$body).not("input[type=file]").on("change", _this.setValueToSavedData);
            $(".talk input, .talk select", _savedOptions.$body).not("input[type=file]").on("change", _this.setValueToSavedData);

            // chainContent
            $(".actionShowSceneTypeRelated").each(function(){
                $(this).on("change.showRelated", function(){
                    var sceneType = $(this).val();
                    var $currentEnv = $(this).parents(".situation");
                    var languageId = $currentEnv.attr("data-languageid");

                    var $targetEnvs = $(".situation[data-languageid="+languageId+"]");

                    switch(sceneType){
                        case "image":
                            $(".sceneSetEditor .chainTypeImage", $targetEnvs).removeClass("hidden");
                            $(".sceneSetEditor .chainTypeVideo", $targetEnvs).addClass("hidden");
                            break;
                        case "video":
                            $(".sceneSetEditor .chainTypeImage", $targetEnvs).addClass("hidden");
                            $(".sceneSetEditor .chainTypeVideo", $targetEnvs).removeClass("hidden");
                            break;
                    }
                }).trigger("change.showRelated");
            });

            d.resolve();
            return d.promise();

        }

    }

}

module.exports = sceneSetEditor;
