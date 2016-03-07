module.exports = {
	options: {
		// define a string to put between each file in the concatenated output
		separator: '\n'
	},
	node: {
		src: [
			//'lib/loglevel/loglevel.min.js',
			'src/events.js',
			'src/cow2.utils.js',
			'src/cow2.record.js',
			'src/cow2.postgres.js', //this one differs from the browser version
			'src/cow2.syncstore.js',
			'src/cow2.peer.js',
			'src/cow2.socketserver.js',
			'src/cow2.user.js',
			'src/cow2.group.js',
			'src/cow2.item.js',
			'src/cow2.project.js',
			'src/cow2.websocket.node.js',
			'src/cow2.messenger.js',
			'src/cow2.core.js'
		],
		// the location of the resulting JS file
		dest: 'dist/<%= pkg.name %>.node.js'
	},
	nodb: {
		src: [
			//'lib/loglevel/loglevel.min.js',
			'src/events.js',
			'src/cow2.utils.js',
			'src/cow2.record.js',
			'src/cow2.nodb.js', //this one differs from the db version
			'src/cow2.syncstore.js',
			'src/cow2.peer.js',
			'src/cow2.socketserver.js',
			'src/cow2.user.js',
			'src/cow2.group.js',
			'src/cow2.item.js',
			'src/cow2.project.js',
			'src/cow2.websocket.node.js',
			'src/cow2.messenger.js',
			'src/cow2.core.js'
		],
		// the location of the resulting JS file
		dest: 'dist/<%= pkg.name %>.nodb.js'
	},
	dist: {
		// the files to concatenate
		src: [
			'src/events.js',
			'src/cow2.utils.js',
			'src/cow2.record.js',
			'src/cow2.indexeddb.js',
			'src/cow2.syncstore.js',
			'src/cow2.peer.js',
			'src/cow2.socketserver.js',
			'src/cow2.user.js',
			'src/cow2.group.js',
			'src/cow2.item.js',
			'src/cow2.project.js',
			'src/cow2.websocket.js',
			'src/cow2.messenger.js',
			'src/cow2.core.js'
		],
		// the location of the resulting JS file
		dest: 'dist/<%= pkg.name %>.js'
	}
};
