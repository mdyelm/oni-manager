
var form = {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    formSubmit: function( options ) {

        var defaultOptions = {
            $form: null,
            confirmMessage: ""
        }
        var options = Object.assign(defaultOptions, options);

        // 確認画面表示
        // HTML5によるvalidationのチェック
        if ( options.$form[0].checkValidity() ){
            if( confirm(options.confirmMessage) ) {
                options.$form.submit();
            }
        } else {
            options.$form.find("input[type=submit]").click();
        }
    },
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    positionSave: function( options ){

        var defaultOptions = {
            api: "",
            positionList: [
                { id: null, position: null }
            ]
        }
        var options = Object.assign(defaultOptions, options);


        // 確認画面表示
        if( confirm("並び順を保存しますか？") ) {
            console.log(options.positionList);

            // アップロード
            $.ajax({
                url: options.api,
                type: 'PUT',
                data: JSON.stringify(options.positionList),
                cache: false,
                contentType: "application/json",
                success: function(){
                    alert("並び順を保存しました");
                    location.href = window.location.href;
                },
                error: function(){
                    alert("並び順保存でエラーです");
                }
            });

        }

    },
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    deleteSubmit: function( api ){


        // 削除フォーム生成
        var $form = $("<form>").attr({
            method: "post",
            action: api
        });
        var $method = $("<input>").attr({
            type: "hidden",
            name: "_method",
            value: "DELETE"
        });
        $form.append($method);
        $("body").append($form); // appendされていないと送信されない

        this.formSubmit({
            $form: $form,
            confirmMessage: "本当に削除しますか？",
            validateTargetLists: []
        });

    },
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    uploadFile: function( options ){

        var defaultOptions = {
            api: "",
            fieldName: "",
            $file: null,
            success: function(){},
            error: function(){}
        }
        var options = Object.assign(defaultOptions, options);

        // アップロード用フォーム準備
        var $currentFile = options.$file;
        var file = $currentFile.prop("files")[0];
        var formData = new FormData();
        formData.append(options.fieldName, file);

        // アップロード
        $.ajax({
            url: options.api,
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: options.success,
            error: options.error
        });

    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}

module.exports = form;
