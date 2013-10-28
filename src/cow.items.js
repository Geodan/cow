$.Cow.ItemStore.prototype = {
    /**
        In progress
    */
    /**
        items() returns all items
        items('string') returns all items of type 'string'
        items('string',{data}) creates a new item with type 'string' and payload data
        
    */
    items: function(name, value, source) {
        var self = this;
		switch(arguments.length) {
        case 0:
            return this._getItems();
        case 1:
            if(typeof name == "string") {
                return this._getItems(name);
            }
            break;
        case 2:
            throw("Not enough arguments for new item. Given: " + name + " " + value);
            break;
        case 3:
            return this._addItem(name,value,source);
            break;
        default:
            throw('wrong argument number');
        }
    },
    _addItem: function(name,value,source){
        var options = {};
        options.type = name;
        options.data = value.data;
        
		var newitem =new $.Cow.Item(this.core, options.data );
		
		//Check if existing
		var existing = false;
		var ix;
		
		$.each(this.itemList, function(i, obj){
		    if (obj._id == newitem._id){//TODO: change key to _id
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
		    self.core.itemsdb().updateRecord_UI(newitem.flatten());
		    //self.core.localdbase().itemsdb(newitem);
		    self.core.trigger('storeChanged');
		    var message = JSON.stringify(newitem);//TODO, bit weird heh...?
		    self.core.websocket().sendData(message, "newItem");
		}
		else if (source == 'ws'){
		    self.core.itemsdb().updateRecord_UI(newitem.flatten());
		    //self.core.localdbase().itemsdb(newitem);
		    self.core.trigger('storeChanged');
		}
		else {
		    throw 'unknown source given: ' + source
		}
		
		return newitem;
    },
    _getItems: function(){
        var items = [];
        $.each(this.itemList, function(id, item) {
            items.push(item);
        });        
        return items;
    },
    getItemById: function(uid){
        var item;
        $.each(this.itemList, function(i, obj){
            if (obj._id == uid){
                item = obj;
            }
        });
        return item;
    },
    
	/**
	##cow.removeItem(iid)
	###**Description**: removes the specific item from the list of items
	*/
	removeItem: function(iid) {
		var delItem;
		$.each(this.items(), function(i, item){
			if (item._id == iid){
				var d = new Date();
				var timestamp = d.getTime();
				if (item.status() != 'deleted')
					item.status('deleted');
				else
					item.status('active');//undelete
				item.timestamp(timestamp);
				self.core.itemsdb().updateRecord_UI(item.flatten());
				//self.core.localdbase().update(item.options);
				//self.core.localdbase().itemsdb(item);
				//send to world
				var message = JSON.stringify(item.flatten());
				self.core.websocket().sendData(message, "updateItem");
			}
		});
		self.core.trigger('storeChanged');
	},

	removeAllItems: function(){
	    this.itemList = [];
	},
	loadItemsFromDb: function(d){
        var self = this;
        $.each(d.rows, function(i,d){
            self.items('feature',{data:d.doc},'db');
        });
        self.core.trigger('storeChanged');
    },
	//request - incoming request from world
	//find items corresponding to request and send
	requestItems: function(fidlist){
		var pushlist = [];
		$.each(this.items(), function(i, item){
				var local_item = item;
				$.each(fidlist, function(j,rem_val){
						if (rem_val == local_item.id())
							pushlist.push(local_item.flatten());
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
					copyof_rem_list.push(val._id);	
			});
			$.each(this.items(), function(i,loc_val){
					var local_item = loc_val;
					var found = -1;
					$.each(fidlist, function(j,rem_val){
							//in both lists
							if (rem_val._id == local_item._id){
								found = 1;
								//local is newer
								if (rem_val.timestamp < local_item.timestamp())
									syncMessage.pushlist.push(local_item.flatten());
								//remote is newer
								else if (rem_val.timestamp > local_item.timestamp())
									syncMessage.requestlist.push(rem_val._id);
								//remove from copyremotelist
								var tmppos = $.inArray(local_item._id,copyof_rem_list);
								if (tmppos >= 0)
									copyof_rem_list.splice(tmppos,1);
							}
					});
					//local but not remote and not deleted
					if (found == -1 && local_item.status() != 'deleted'){
						syncMessage.pushlist.push(local_item.flatten());
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
