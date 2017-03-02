var templatesLoader = (function($,host){

    var rec_loadExtTemplates = function(arr, acc) {
        var cur = $(arr).eq(0)[0];
        $.get(cur.path, function (result) { // On Success (done)
            
            if(!(cur.hasOwnProperty("noWrap") && cur.noWrap==true))
                result = "<script id=\"" + cur.tag + "\" type=\"text/x-kendo-template\">".concat(result).concat("</script>");
            

            acc += result;
            
            arr = $(arr).slice(1);
            if(arr.length) {
                rec_loadExtTemplates(arr, acc);
            } else { // we're done
                $("body").append(acc);
                $(host).trigger("TEMPLATES_LOADED");
                
            }
        })
        // Uncomment for debug:
        
        .done(function() {
            //alert("SUCCESS");
        })
        .fail(function(err) {
            alert("AN ERROR OCCURED: \"" + cur.path + "\" returned with status of \"" + err.statusText + "\"");
        });
    };
    

    return {
        loadExtTemplates: function (templatesArray) {
            rec_loadExtTemplates(templatesArray, "");
        }
    };    
        
})(jQuery, document);