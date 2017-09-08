////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var pane = require("./modules/pane.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(function(){

    // 編集内容の誤削除防止
    var isEditing = false;
    $("body").on("change", ".editPane input, .editPane textarea, .editPane select", function(){
        isEditing = true;
    })

    // 編集ペインの閉じるボタン
    $("body").on("click", ".actionCloseCurrentSidePane", function(){
        if  (isEditing == false ) {
            pane.hideSidePane( $(this).parents(".sidePane") );
        } else {

            if ( confirm("編集内容が損なわれますが、よろしいですか？") ){
                pane.hideSidePane( $(this).parents(".sidePane") );
            }

        }
    });

    // ラジオボタンのラベル色付け
    $("body").on("change", "input[type=radio]", function(){
        var $container = $(this).parents(".input");
        var fieldName = $(this).attr("name");
        $("label", $container).removeClass("selected");
        $(this).parents("label").addClass("selected");
    });

    // チェックボックスのラベル色付け
    $("body").on("change", "input[type=checkbox]", function(){
        var $container = $(this).closest(".input");
        console.log($container)
        var fieldName = $(this).attr("name");
        $("label", $container).removeClass("selected");

        if ( $(this).prop("checked") ) {
            $(this).parents("label").addClass("selected");
        }

    });

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
