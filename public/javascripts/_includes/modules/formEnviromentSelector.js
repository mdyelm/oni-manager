
var formEnviromentSelector = (function(){
    var _this = null;
    var _savedOptions = null;
    var _current = {
            language: 1,
            os: 1
        }

    return {
        switchContent: function( languageId, osId ){
            _savedOptions.$content.addClass("isHidden");
            var $currentContent = _savedOptions.$content.filter("[data-languageId=" + languageId + "][data-osId=" + osId + "]");
            $currentContent.removeClass("isHidden");
        },
        setEvent: function(){

            $(".languageItem", _savedOptions.$body).on("click", function(){

                // スタイル変更
                $(".languageItem").removeClass("selected");
                $(this).addClass("selected");

                // 選択言語IDを保存
                _current.language = $(this).attr("data-id");

                // コンテンツ切り替え
                _this.switchContent(_current.language, _current.os);

            });

            $(".osItem", _savedOptions.$body).on("click", function(){

                // スタイル変更
                $(".osItem").removeClass("selected");
                $(this).addClass("selected");

                // 選択OSIDを保存
                _current.os = $(this).attr("data-id");

                // コンテンツ切り替え
                _this.switchContent(_current.language, _current.os);

            });

        },
        init: function( options ){
            _this = this;
            _savedOptions = options;
            this.setEvent();
            this.switchContent( _current.language, _current.os );
        },
    }
}());

module.exports = formEnviromentSelector;
