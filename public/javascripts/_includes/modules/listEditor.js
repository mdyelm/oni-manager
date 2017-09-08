var listEditor = function(){
    var _this;
    var _data = {}
    var _dupe = {}
    var _options = {}
    var _current = {
        language: "",
        os: ""
    }

    return {

        init: function( options ){
            _this = this;

            // オプションの設定
            var defaultOptions = {
                $body: null,
                $output: null,
                enableEnv: false,
                mainDataName: "",
                data: {},
                defaultValues: {}
            }
            _options = Object.assign( defaultOptions, options );

            console.log("listEditor options", _options);

            // データの設定
            _data = _options.data;

            // データ未設定時に初期データをセット
            var isEmpty = ( _data[_options.mainDataName] && Object.keys(_data[_options.mainDataName]).length == 0 );
            if ( isEmpty ) {
                var defaults = {}
                _data.languages.forEach(function(language){
                    defaults[language.code] = {}
                    _data.os.forEach(function(os){
                        defaults[language.code][os.code] = []
                    });
                });
                _data[_options.mainDataName] = Object.assign( {}, defaults );
            }

            // 初期表示設定
            _current.language = _data.languages[0].code;
            _current.os = _data.os[0].code;

            this.refresh();

        },
        refresh: function(){

            $.Deferred().resolve()
                .then( this.renderModule )
                .then( this.renderTable )
                .then( this.setEvent )
                .then( this.updateOutput )
                .then( this.changeCurrentList )

        },
        renderModule: function(){
            var d = $.Deferred();

            var template = $.templates("#listEditor");
            var dupedData = Object.assign({
                enableEnv: _options.enableEnv,
            }, _data);
            _dupe = dupedData;
            var html = template.render( _dupe );
            _options.$body.html(html);

            d.resolve();
            return d.promise();
        },
        renderTable: function(){
            var d = $.Deferred();

            var template = $.templates( _options.tableTemplateId );
            var dupedData = Object.assign({}, _data);
            _dupe = dupedData;
            var html = template.render( _dupe );
            $(".listContent", _options.$body).html(html);

            d.resolve();
            return d.promise();
        },
        changeCurrentList: function(e){
            var d = $.Deferred();

            if ( _options.enableEnv == false ) {
                d.resolve();
                return false;
            }

            // 選択言語/OSを保存
            var isClicked = Boolean(e);
            if ( isClicked ){
                if( $(this).attr("data-language-code") ) _current.language = $(this).attr("data-language-code");
                if( $(this).attr("data-os-code") ) _current.os = $(this).attr("data-os-code");
            }

            // メニュー表示切り替え
            var $body = _options.$body;
            $body.find(".languageItem").removeClass("selected");
            $body.find(".languageItem[data-language-code="+_current.language+"]").addClass("selected");
            $body.find(".osItem").removeClass("selected");
            $body.find(".osItem[data-os-code="+_current.os+"]").addClass("selected");

            // リスト表示切り替え
            $body.find(".list").addClass("hidden");
            $body.find(".list[data-language-code="+_current.language+"][data-os-code="+_current.os+"]").removeClass("hidden");

            d.resolve();
            return d.promise();
        },
        addListItem: function(){

            var $currentList = $(this).parents(".list");

            if ( _options.enableEnv ) {
                var languageCode = $currentList.attr("data-language-code");
                var osCode = $currentList.attr("data-os-code");
                var currentDataTable = _data[_options.mainDataName][languageCode][osCode];
            } else {
                var currentDataTable = _data[_options.mainDataName];
            }

            currentDataTable.push( Object.assign( {}, _options.defaultValues ) );

            _this.refresh();

        },
        removeListItem: function(){
            var d = $.Deferred();

            var $currentList = $(this).parents(".list");
            var $currentListItem = $(this).parents(".listItem");
            var listItemIndex = parseInt( $currentListItem.attr("data-index") );

            if (_options.enableEnv) {
                var languageCode = $currentList.attr("data-language-code");
                var osCode = $currentList.attr("data-os-code");
                var currentDataTable = _data[_options.mainDataName][languageCode][osCode];
            } else {
                var currentDataTable = _data[_options.mainDataName];
            }

            currentDataTable.splice(listItemIndex,1);

            _this.refresh();

            d.resolve();
            return d.promise();
        },
        upItemPosition: function(){
            var d = $.Deferred();

            var $currentList = $(this).parents(".list");
            var $currentListItem = $(this).parents(".listItem");
            var listItemIndex = parseInt( $currentListItem.attr("data-index") );

            if (_options.enableEnv) {
                var languageCode = $currentList.attr("data-language-code");
                var osCode = $currentList.attr("data-os-code");
                var currentDataTable = _data[_options.mainDataName][languageCode][osCode];
            } else {
                var currentDataTable = _data[_options.mainDataName];
            }

            if ( listItemIndex != 0){
                var currentItemData = currentDataTable.splice(listItemIndex, 1)[0];
                currentDataTable.splice(listItemIndex-1, 0, currentItemData);
            }

            _this.refresh();

            d.resolve();
            return d.promise();
        },
        downItemPosition: function(){
            var d = $.Deferred();

            var $currentList = $(this).parents(".list");
            var $currentListItem = $(this).parents(".listItem");
            var listItemIndex = parseInt( $currentListItem.attr("data-index") );

            if (_options.enableEnv) {
                var languageCode = $currentList.attr("data-language-code");
                var osCode = $currentList.attr("data-os-code");
                var currentDataTable = _data[_options.mainDataName][languageCode][osCode];
            } else {
                var currentDataTable = _data[_options.mainDataName];
            }

            if ( listItemIndex < currentDataTable.length-1 ){
                var currentItemData = currentDataTable.splice(listItemIndex, 1)[0];
                currentDataTable.splice(listItemIndex+1, 0, currentItemData);
            }

            _this.refresh();

            d.resolve();
            return d.promise();
        },
        saveValue: function(){
            var $currentList = $(this).parents(".list");
            var $currentListItem = $(this).parents(".listItem");
            var listItemIndex = parseInt( $currentListItem.attr("data-index") );
            var fieldName = $(this).attr("data-fieldname");
            var fieldType = $(this).attr("type");

            if (_options.enableEnv) {
                var currentDataTable = _data[_options.mainDataName][_current.language][_current.os];

            } else {
                var currentDataTable = _data[_options.mainDataName];
            }

            if ( !currentDataTable[listItemIndex] ) {
                currentDataTable[listItemIndex] = {}
            }

            if ( fieldType == "checkbox" ) {
                currentDataTable[listItemIndex][fieldName] = Number($(this).prop("checked"));
            } else {
                currentDataTable[listItemIndex][fieldName] = $(this).val();
            }

            _this.updateOutput();
        },
        updateOutput: function(){
            var d = $.Deferred();

            _options.$output.val(JSON.stringify(_data[_options.mainDataName]));

            d.resolve();
            return d.promise();
        },
        setEvent: function(){
            var d = $.Deferred();

            $("input, textarea", _options.$body).on("change", _this.saveValue);

            $(".actionSelectEnviroment", _options.$body).on("click", _this.changeCurrentList);
            $(".actionAddListItem", _options.$body).on("click", _this.addListItem);
            $(".actionRemoveListItem", _options.$body).on("click", _this.removeListItem);
            $(".actionUpPosition", _options.$body).on("click", _this.upItemPosition);
            $(".actionDownPosition", _options.$body).on("click", _this.downItemPosition);

            d.resolve();
            return d.promise();
        }

    }

}

module.exports = listEditor;
