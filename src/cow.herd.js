$.Cow.Herd.prototype = {
    members: function(peerid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getMembers();
                break;
            case 1:
                return this._addMember(peerid);
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getMembers: function(){
        return this.memberList;
    },
    _addMember: function(peerid){
        var existing = false;
        for (var i=0;i<this.memberList.length;i++){
            if (this.memberList[i] == peerid) {
                existing = true; //Already a member
                return peerid;
            }
        }
        if (!existing)
            this.memberList.push(peerid); //Adding to the list
        return peerid;
    },
    removeMember: function(peerid){
        for (var i=0;i<this.memberList.length;i++){
            if (this.memberList[i] == peerid) {
                this.memberList.splice(i,1); //Remove from list
                return;
            }
        }
    },
    removeAllMembers: function(){
        this.memberList = [];
    },
    bind: function(types, data, fn) {
        var self = this;

        // A map of event/handle pairs, wrap each of them
        if(arguments.length===1) {
            var wrapped = {};
            $.each(types, function(type, fn) {
                wrapped[type] = function() {
                    return fn.apply(self, arguments);
                };
            });
            this.events.bind.apply(this.events, [wrapped]);
        }
        else {
            var args = [types];
            // Only callback given, but no data (types, fn), hence
            // `data` is the function
            if(arguments.length===2) {
                fn = data;
            }
            else {
                if (!$.isFunction(fn)) {
                    throw('bind: you might have a typo in the function name');
                }
                // Callback and data given (types, data, fn), hence include
                // the data in the argument list
                args.push(data);
            }

            args.push(function() {
                return fn.apply(self, arguments);
            });

            this.events.bind.apply(this.events, args);
        }

       
        return this;
    },
    trigger: function() {
        // There is no point in using trigger() insted of triggerHandler(), as
        // we don't fire native events
        this.events.triggerHandler.apply(this.events, arguments);
        return this;
    },
    // Basically a trigger that returns the return value of the last listener
    _triggerReturn: function() {
        return this.events.triggerHandler.apply(this.events, arguments);
    }
    
};


