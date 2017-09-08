var form = require("../form.js");

var singleUploader = function(){
    var _this = null;
    var _savedOptions = null;

    return {
        // ---------------------------------------------------------------------------------
        // 初期化
        // ---------------------------------------------------------------------------------
        init: function( options ){

            var d = $.Deferred();
            _this = this;

            // 引数にセットされたオプションを保存
            var defaultOptions = {
                api: "",
                $appendTo: null,
                $input: null,
                $previewImg: null
            }
            Object.assign(defaultOptions, options);
            _savedOptions = options;
            _savedOptions.$body = options.$appendTo;

            _this.setEvent().then(function(){
                d.resolve();
            });

            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // テンプレート再描画
        // ---------------------------------------------------------------------------------
        refresh: function( isSuccess, path ){

            var d = $.Deferred();

            var fingerprint = "?" + Date.now();

            if( isSuccess ) {
                $('.message', _savedOptions.$appendTo ).html("アップロード成功");
                _savedOptions.$previewImg.attr('src', path + fingerprint );
                _savedOptions.$input.val( path );
                d.resolve();
            } else {
                $('.message', _savedOptions.$appendTo ).html("アップロード失敗");
                d.resolve();
            }

            return d.promise();

        },
        // ---------------------------------------------------------------------------------
        // アップロード
        // ---------------------------------------------------------------------------------
        upload: function(){

            var $file = $("[type=file]", _savedOptions.$body);
            var isFileSet = ( $file[0].files.length != 0 );
            var filePath = $file[0].files[0].name;

            if( filePath.match(/ /) ){
                alert("ファイル名にスペースが含まれています");
            } else if ( isFileSet ) {

                // アップロード実行
                form.uploadFile({
                    api: _savedOptions.api,
                    fieldName: "file",
                    $file: $file,
                    success: function(data){
                        console.log("success", data);
                        _this.refresh(true, data.path );
                    },
                    error: function(){
                        alert("アップロードエラー");
                    }
                });

            } else {
                alert("ファイルを選択してください");
            }

        },
        // ---------------------------------------------------------------------------------
        // イベント設定
        // ---------------------------------------------------------------------------------
        setEvent: function(){

            var d = $.Deferred();

            // アップロードボタン
            $(".actionUploadFile", _savedOptions.$body).on("click", _this.upload);

            d.resolve();
            return d.promise();

        }
    }

}

module.exports = singleUploader;
