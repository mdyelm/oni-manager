$.views.converters("jsonParser", function( val, propName,index ){
    console.log(propName)
    console.log( JSON.parse(val)[index] );
    return JSON.parse(val)[index][propName];
});
