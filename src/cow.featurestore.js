$.Cow.FeatureStore.prototype = {
    /**
        In progress
    */

    featureItems: function(options) {
        var self = this;
		switch(arguments.length) {
        case 0:
            return this._getFeatureItems();
        case 1:
            if (!$.isArray(options.data)) {
                return this._addFeatureItem(options);
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _addFeatureItem: function(options){
		var newitem = {"options": options.data};
		
		//Check if existing
		var existing = false;
		var ix;
		var source = options.source;
		$.each(this.itemList, function(i, obj){
		    if (obj.options.key == options.data.key){
		        ix = i;
		        existing = true;
		    }
		});
		if (!existing)
		    this.itemList.push(newitem);
		else
		    this.itemList.splice(ix,1,newitem);
		
		if (source == 'db'){
		    
		}
		else if (source == 'user'){
		    self.core.localdbase().featuresdb(options.data);
		    self.core.trigger('storeChanged');
		    var message = JSON.stringify(newitem);//TODO, bit weird heh...?
		    self.core.websocket().sendData(message, "newFeature");
		}
		else if (source == 'ws'){
		    self.core.localdbase().featuresdb(options.data);
		    self.core.trigger('storeChanged');
		}
		else {
		    throw 'unknown source given: ' + source
		}
		
		return newitem;
    },
    _getFeatureItems: function(){
        var items = [];
        $.each(this.itemList, function(id, item) {
            items.push(item);
        });        
        return items;
    },
    getFeatureItemById: function(uid){
        var item;
        $.each(this.itemList, function(i, obj){
            if (obj.options.key == uid){
                item = obj.options;
            }
        });
        return item;
    },
    
	/**
	##cow.removeItem(iid)
	###**Description**: removes the specific item from the list of items
	*/
	removeFeatureItem: function(iid) {
		var delItem;
		$.each(this.featureItems(), function(i, item){
			if (item.options.key == iid){
				var d = new Date();
				var timestamp = d.getTime();
				if (item.options.status != 'deleted')
					item.options.status = 'deleted';
				else
					item.options.status = '';
				item.options.updated = timestamp;
				//self.core.localdbase().update(item.options);
				self.core.localdbase().featuresdb(item.options);
				//send to world
				var message = JSON.stringify(item.options);
				self.core.websocket().sendData(message, "updateFeature");
			}
		});
		self.core.trigger('storeChanged');
	},

	removeAllFeatureItems: function(){
	    this.itemList = [];
	},
	//request - incoming request from world
	//find features corresponding to request and send
	requestFeatures: function(fidlist){
		var pushlist = [];
		$.each(this.featureItems(), function(i, item){
				var local_feature = item.options;
				$.each(fidlist, function(j,rem_val){
						if (rem_val == local_feature.key)
							pushlist.push(local_feature);
				});
		});
		return pushlist;
	},
	
	/**
	syncFids - compares incoming fidlist with fidlist from current stack based on timestamp and status
					generates 2 lists: requestlist and pushlist
	**/
	syncFids: function(payload,uid){
	    var fidlist = payload.fids;
		var syncMessage = {};
		var copyof_rem_list = [];
		syncMessage.requestlist = [];
		syncMessage.pushlist = [];
		//Prepare copy of remote fids as un-ticklist, but only for non-deleted items
		if (fidlist){
			$.each(fidlist, function(i,val){
				if (val.status != 'deleted')
					copyof_rem_list.push(val.key);	
			});
			$.each(this.featureItems(), function(i,loc_val){
					var local_item = loc_val.options;
					var found = -1;
					$.each(fidlist, function(j,rem_val){
							//in both lists
							if (rem_val.key == local_item.key){
								found = 1;
								//local is newer
								if (rem_val.updated < local_item.updated)
									syncMessage.pushlist.push(local_item);
								//remote is newer
								else if (rem_val.updated > local_item.updated)
									syncMessage.requestlist.push(rem_val.key);
								//remove from copyremotelist
								var tmppos = $.inArray(local_item.key,copyof_rem_list);
								if (tmppos >= 0)
									copyof_rem_list.splice(tmppos,1);
							}
					});
					//local but not remote and not deleted
					if (found == -1 && local_item.status != 'deleted'){
						syncMessage.pushlist.push(local_item);
					}
			});
		}
		//Add remainder of copyof_rem_list to requestlist
		$.each(copyof_rem_list, function(i,val){
			syncMessage.requestlist.push(val);	
		});
		var data = syncMessage; //TODO, remove artefacts of merging websocket code
		var message = {};
        //First the requestlist
        message.requestlist = data.requestlist;
        message.pushlist = []; //empty
        message.storename = payload.storename;
        self.core.websocket().sendData(message,'syncPeer',uid);
        //Now the pushlist bit by bit
        message.requestlist = []; //empty
        var i = 0;
        $.each(data.pushlist, function(id, item){
                message.pushlist.push(item);
                i++;
                if (i >= 1) { //max 1 feat every time
                    i = 0;
                    self.core.websocket().sendData(message,'syncPeer',uid);
                    message.pushlist = []; //empty
                }
        });
        //sent the remainder of the list
        if (i > 0)
            self.core.websocket().sendData(message,'syncPeer',uid);
	}
};
