var form = require("../form.js");

// 再利用アップローダーを動かす

var recycleUploader = function(){
    var _this = null;
    var _savedOptions = null;
    var _$body = null;

    return {

        // ---------------------------------------------------------------------------------
        // 初期化
        // ---------------------------------------------------------------------------------
        init: function( options ){
            var d = $.Deferred();
            console.log("init")

            // recycleUploader this保存
            _this = this;

            // オプション設定
            var defaultOptions = {
                type: "image", // image, sound, video
                api: "",
                $appendTo: null,
                $input: null,
            }
            var options = Object.assign(defaultOptions, options);
            _savedOptions = options;

            // currentBody保存
            _$body = _savedOptions.$appendTo.parents(".recycleUploader");

            // 呼び出し
            var data = []
            $.Deferred().resolve()
                .then( $.proxy( _this.render, this, data ) )
                .then( _this.updateHTML )
                .then( _this.setEvent )
                .then(function(){
                    d.resolve();
                });

            return d.promise();
        },
        // ---------------------------------------------------------------------------------
        getData: function(){
            var d = $.Deferred();
            console.log("getData")

            // ファイル一覧取得
            $.ajax({
                url: _savedOptions.api,
                cache: false
            })
            .done(function( data ){
                d.resolve(data);
            });

            return d.promise();
        },
        // ---------------------------------------------------------------------------------
        // テンプレート描画
        // ---------------------------------------------------------------------------------
        render: function( data ){
            console.log("render")

            // テンプレート描画
            var template = $.templates("#recycleUploader");
            var html = template.render({
                type: _savedOptions.type,
                listData: data
            });
            _savedOptions.$appendTo.empty().append( $(html) );

        },
        // ---------------------------------------------------------------------------------
        // フィールドの更新
        // ---------------------------------------------------------------------------------
        setField: function( filePath ){
            console.log("setField")
            var $currentBody = $(this).parents(".recycleUploader");
            $(".field .input input", $currentBody).css("background-color", "red")
            $(".field .input input", $currentBody).val( filePath ).change(); // データ置き換え
        },
        // ---------------------------------------------------------------------------------
        // HTMLの更新
        // ---------------------------------------------------------------------------------
        updateHTML: function(){
            console.log("updateHTML")

            // 初期選択設定
            var isMultiple = ( _savedOptions.$input.size() != 1 ); // シチュエーションのシーンエディタ内シーン部分のアップローダーはmultiple


            if ( isMultiple ) {

                _savedOptions.$input.each(function(i){
                    var $currentBody = $(this).parents(".recycleUploader");
                    var currentFilePath = $(this).val();

                    $(".fileListItem", $currentBody).removeClass("selected"); // 選択スタイルをリセット

                    // スタイル設定
                    if ( !currentFilePath || currentFilePath == "" ) {
                        $(".fileListItem", $currentBody).eq(0).addClass("selected");
                    } else {
                        $(".fileListItem", $currentBody).each(function( index ){
                            var itemFilePath = $(this).attr("data-filepath");
                            if ( itemFilePath == currentFilePath ) $(this).addClass("selected");
                        });
                    }

                    // プレビュー更新
                    if ( currentFilePath ) {
                        var fingerprint = "?" + Date.now(); // キャッシュ対策
                        switch ( _savedOptions.type ) {
                            case "image":
                                $(".preview img", $currentBody).attr("src", currentFilePath + fingerprint);
                                break;
                            case "sound":
                                $(".preview audio", $currentBody).attr("src", currentFilePath + fingerprint);
                                break;
                            case "video":
                                $(".preview video", $currentBody).attr("src", currentFilePath + fingerprint);
                                break;
                        }
                    } else {
                        $(".preview img", $currentBody).attr("src","");
                    }

                })

            } else {

                // TODO: too wack
                if ( this.promise ) {
                    var $currentBody = _savedOptions.$input.parents(".recycleUploader");
                    var currentFilePath =_savedOptions.$input.val();
                } else {
                    var $currentBody = $(this).parents(".recycleUploader");
                    var currentFilePath =$(".field .input input", $currentBody).val();
                }

                $(".fileListItem", $currentBody).removeClass("selected"); // 選択スタイルをリセット

                // スタイル設定
                if ( !currentFilePath || currentFilePath == "" ) {
                    $(".fileListItem", $currentBody).eq(0).addClass("selected");
                } else {
                    $(".fileListItem", $currentBody).each(function( index ){
                        var itemFilePath = $(this).attr("data-filepath");
                        if ( itemFilePath == currentFilePath ) $(this).addClass("selected");
                    });
                }

                // プレビュー更新
                if ( currentFilePath ) {


                    var fingerprint = "?" + Date.now(); // キャッシュ対策
                    switch ( _savedOptions.type ) {
                        case "image":
                            $(".preview img", $currentBody).attr("src", currentFilePath + fingerprint);
                            break;
                        case "sound":
                            $(".preview audio", $currentBody).attr("src", currentFilePath + fingerprint);
                            break;
                        case "video":
                            $(".preview video", $currentBody).attr("src", currentFilePath + fingerprint);
                            break;
                    }
                } else {
                    $(".preview img", $currentBody).attr("src","");
                }


            }

        },
        // ---------------------------------------------------------------------------------
        // アップロード
        // ---------------------------------------------------------------------------------
        upload: function(){
            console.log("upload")
            var d = $.Deferred();

            var $currentBody = $(this).parents(".recycleUploader");
            var $file = $("[type=file]", $currentBody);
            var isFileSet = ( $file[0].files.length != 0 );
            var filePath = $file[0].files[0].name;

            var __this = this;

            // アップロード実行
            if( filePath.match(/ /) ){
                alert("ファイル名にスペースが含まれています");
                d.reject();
            } else if ( isFileSet ) {

                form.uploadFile({
                    api: _savedOptions.api,
                    fieldName: "file",
                    $file: $file,
                    success: function(data){
                        d.resolve(data.path);
                    },
                    error: function(){
                        alert("アップロードエラー");
                        d.reject();
                    }
                });

            } else {
                alert("ファイルを選択してください");
                d.reject();
            }

            return d.promise();
        },
        // ---------------------------------------------------------------------------------
        // 削除
        // ---------------------------------------------------------------------------------
        delete: function(e){
            console.log("delete")
            var d = $.Deferred();

            var $currentBody = $(this).parents(".recycleUploader");
            var __this = this;

            // 選択イベント防止
            e.stopPropagation();

            // 対象取得
            var currentFileName = $(this).parents(".fileListItem").attr("data-fileName");
            var currentFilePath = $(this).parents(".fileListItem").attr("data-filePath");

            // 削除実行
            if ( confirm( currentFileName + "を削除しますがよろしいですか？" ) ) {

                $.ajax({
                    type: "delete",
                    url:  _savedOptions.api + currentFileName,
                    cache: false
                }).done(function( result ){

                    // 削除対象を選択していた場合は選択解除
                    var selectedFilePath = $(".field .input input", $currentBody).val();
                    if ( selectedFilePath == currentFilePath ) {
                        $.Deferred().resolve()
                            .then( $.proxy(_this.setField, __this, "") )
                            .then( function(){
                                d.resolve();
                            });
                    } else {
                        d.resolve();
                    }

                });

            } else {
                d.reject();
            }

            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // ポップアップ表示
        // ---------------------------------------------------------------------------------
        showPopup: function(){
            console.log("showPopup")
            var $currentBody = $(this).parents(".recycleUploader");
            var $popup = $(".popup", $currentBody);
            $popup.removeClass("hidden");
        },
        // ---------------------------------------------------------------------------------
        // ポップアップ非表示
        // ---------------------------------------------------------------------------------
        hidePopup: function(){
            console.log("hidePopup")
            var $currentBody = $(this).parents(".recycleUploader");
            var $popup = $(".popup", $currentBody);
            $popup.addClass("hidden");
        },
        // ---------------------------------------------------------------------------------
        // ?
        // ---------------------------------------------------------------------------------
        setAPIUrl: function(url){
            _savedOptions.api = url;
        },
        // ---------------------------------------------------------------------------------
        // イベント設定
        // ---------------------------------------------------------------------------------
        setEvent: function(){
            var d = $.Deferred();
            console.log("setEvent")

            // アイテム選択
            $(".fileListItem", _savedOptions.$appendTo).on("click", function(){
                console.log("clickEvent: clickItem")
                var selectedFilePath = $(this).attr("data-filePath");
                $.Deferred().resolve()
                    .then( $.proxy(_this.setField, this, selectedFilePath ) ) // データ切り替え
                    .then( $.proxy( _this.updateHTML, this ) )
                    .then( $.proxy( _this.hidePopup, this ) )
            });

            // アップロードボタン
            $(".actionUploadItem", _savedOptions.$appendTo).on("click", function(){
                console.log("clickEvent: uploadButtonClick")
                $.Deferred().resolve()
                    .then( $.proxy( _this.upload, this ) )
                    .then( $.proxy( _this.setField, this ) )
                    .then( $.proxy( _this.updateHTML, this ) )
                    .then( $.proxy( _this.hidePopup, this ) )
            });

            // 削除ボタン
            $(".fileListItem .actionRemove", _savedOptions.$appendTo).on("click", function(e){
                console.log("clickEvent: deleteButtonClick")
                $.Deferred().resolve()
                    .then( $.proxy( _this.delete, this, e ) )
                    .then( _this.getData )
                    .then( $.proxy( _this.render, this ) )
                    .then( $.proxy( _this.updateHTML, this ) )
                    .then( _this.setEvent )
            });

            // show popup
            $(".actionShowPopup", _$body).off("click").on("click", function(){
                console.log("clickEvent: showPopup Click")
                $.Deferred().resolve()
                    .then( _this.getData )
                    .then( $.proxy( _this.render, this ) )
                    .then( $.proxy( _this.updateHTML, this ) )
                    .then( _this.setEvent )
                    .then( $.proxy( _this.showPopup, this ) )
            });

            // hide popup
            $(".actionClosePopup", _$body).off("click").on("click", function(){
                console.log("clickEvent: closePopup Click")
                $.Deferred().resolve()
                    .then( $.proxy( _this.hidePopup, this ) )
            });

            return d.resolve();
        }
    }

}

module.exports = recycleUploader;
