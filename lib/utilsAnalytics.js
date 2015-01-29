
function normalize(opts) {
    var _ = require('lodash');
    var requireDir = require('require-dir');
    var all = requireDir(__dirname + '/../' + opts.dataDir + '/' );

    if (_.isEmpty(all)) {
        throw new Error("Folder empty, hast to contain json files retrieved with Meetup Fetcher");
    } else {
        var cs = {}, csLists = {};
        _.forEach(all, function(v,k){
            cs[k] = v[k];
            csLists[k] = { 	
                "events"	: _.map(_.keys(cs[k].events.list), function(current) {
                                    return cs[k].events.list[current];
                                }),
                "members"	: _.map(_.keys(cs[k].members.list), function(current) {
                                    return cs[k].members.list[current];
                                })
                };
        });   

        return csLists;
    }
    
}

module.exports = normalize;