    var VendorDiscountsDatasource = function(appModel) { 
        return new kendo.data.DataSource({
        
        transport: {
            read: function(options) {
                $.ajax({
                    
                    url: "/parse/functions/vendorDiscountsGet",
                    dataType: "json",
                    type:"POST",
                    
                    headers: appModel.parse._headers,               
                    data:kendo.stringify({"vendor":appModel.getParsePointer(appModel.parse._vendor, "Vendor") }),
                    success: function(jsonResponse) {
                        
                        options.success(jsonResponse.result);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: "/parse/functions/vendorDiscountSave",
                    dataType: "json",
                    type:"POST",
                    headers:appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(httpResponse) {
                        // options.data.objectId=httpResponse.result.objectId;
                        options.data = httpResponse.result;
                        options.success(options.data);
                    
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(jqXHR.responseJSON.errorThrown)
                    }
                });
            },

            update: function(options) {

                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: "/parse/functions/vendorDiscountSave",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(httpResponse) {
                        
                        // options.success(options.data);
                        options.success(httpResponse.result);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            destroy: function(options) {
                
                $.ajax({
                    url: "/parse/functions/vendorDiscountDelete",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data: kendo.stringify(options.data),
                    
                    success: function(httpResponse) {
                        
                        options.success(httpResponse.result);
                        
                    },
                    
                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {
                
                $(options).removeProp("id").removeProp("createdAt")
                .removeProp("updatedAt").removeProp("dirty");

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
                    editable: true
                },

                "type":{
                    editable: true
                },

                "value":{
                    editable:true
                },

                "applied":{
                    editable:true
                },

                "deleted":{
                    editable:true
                },

                "vendor": {
                    from:"vendor",
                    editable:true
                }
              }
            }
        }
        });

    }