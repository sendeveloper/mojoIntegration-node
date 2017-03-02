  var externalTaxCodesDataSource = function(appModel) {
        return new kendo.data.DataSource({

            transport: {
                read:function(options){
              
                $.ajax({
                    url: "/parse/functions/getExternalTaxCodes",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify({
                        vendorId: appModel.userInfo.vendorID
                    }),
                    
                    success: function(response) {
                        options.success(response.result);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(jqXHR.responseJSON);
                    }

                });                
                }
            },

            requestStart: function () {
                kendo.ui.progress($('body'), true);
            },
            requestEnd: function () {
                kendo.ui.progress($('body'), false);

            },
            model: {
                id: "objectId",      //model identifier

                fields: {
                           "objectId": {
                                    nullable:true,
                                    editable:false
                           },

                            "name": {
                                    from:"name",
                                    editable:false,
                                    type:'string'
                                    
                            }
                        }

            }
        });
    }