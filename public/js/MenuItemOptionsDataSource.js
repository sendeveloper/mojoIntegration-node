    var MenuItemOptionsDataSource = function (appModel){
        return new kendo.data.DataSource({
            transport: {
                read: function(options) {
                    
                    var _options=this.prepareDataForSave($.extend({},options.data));

                    return $.ajax({           
                        url: "/parse/functions/menuItemOptionsGet",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        data:kendo.stringify(_options),
                        
                        success: function(jsonResponse) {
                            options.success(jsonResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                            options.error(options.data);
                        }
                    });
                },
                create: function(options){

                    var _options=this.prepareDataForSave($.extend({},options.data));

                    return $.ajax({
                        url: "/parse/functions/menuItemOptionsSave",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        data:kendo.stringify(_options),
                        
                        success: function(httpResponse) {
                            options.success(httpResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                            options.error(options.data);
                        }
                    });

                },
                update: function(options){
                    var _options=this.prepareDataForSave($.extend({},options.data));
                    
                    return $.ajax({
                        url: "/parse/functions/menuItemOptionsSave",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        data:kendo.stringify(_options),
                        
                        success: function(httpResponse) {
                            options.success(httpResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                            options.error(options.data);
                        }
                    });

                },
                destroy:function(options){
                    return $.ajax({
                        url: "/parse/functions/menuItemOptionsDelete",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify(options.data),
                        
                        success: function(httpResponse) {                           
                            options.success();
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                            options.error(options.data);
                        }
                    });
                },

                prepareDataForSave: function(options) {
                    
                    $(options).removeProp("createdAt").removeProp("updatedAt");

                    options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                    return options;
                }
            },
            requestStart: function () {
                kendo.ui.progress($('body'), true);
            },
            requestEnd: function () {
                kendo.ui.progress($('body'), false);

            },

            schema:{

                parse: function(data) {
                    
                    for(var i=0;i<data.length;i++) {
                        if(!data[i].options) data[i].options=[];
                    }

                    return data;
                },

                model: {
                    id:"objectId",

                    fields: {
                        "objectId": {
                            nullable:true,
                            editable:true
                        },

                        "name": {
                            from:"name",
                            editable: true,
                            type: "string"
                        },

                        "options" : {
                            from: "options",
                            editable: true
                        },
                        "legacy":{
                            from:"legacy",
                            editable:false
                        }
                    }
                }
            },
            sort: { field: "name", dir: "asc" },
        });       
    }