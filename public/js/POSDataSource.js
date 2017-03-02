    // POS Orders
    var POSOrdersDataSource = function(appModel) { 
        return new kendo.data.DataSource({
            // offlineStorage: "kdsOrders-offline",
            transport: {
                read: function(options) {  
                
                    $.ajax({
                        url: '/parse/functions/posGetOrders',
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,        
                        data:  kendo.stringify(options.data),                   
                        
                        success: function(jsonResponse) {
                            options.success(jsonResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    });
                },
                update:function(options){
                    $.ajax({
                        url: "/parse/functions/orderStateModify",
                        dataType: "json",
                        type:"POST",
                        headers: kdsModel.parse._headers,

                        data:kendo.stringify({
                            truckId: options.data.truckId,
                            orderId: options.data.objectId,
                            orderState: options.data.state
                        }),
                    
                        success: function(jsonResponse) {
                            options.success(jsonResponse.result);

                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    
                    });
                },
                //delete code is identical to update (for now)
                destroy:function(options){
                    $.ajax({
                        url: "/parse/functions/orderStateModify",
                        dataType: "json",
                        type:"POST",
                        headers: kdsModel.parse._headers,

                        data:kendo.stringify({
                            truckId: options.data.truckId,
                            orderId: options.data.objectId,
                            orderState: options.data.state
                        }),
                    
                        success: function(jsonResponse) {
                            options.success(jsonResponse.result);

                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    
                    });     
                }
            },
            schema:{
                model:{
                    id:"objectId"
                }
            }
        })
    }