describe('messenger', function () {
	it('should lzw encode/decode something', function () {
		var input = 'Een string';
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded).toEqual(input);
	});

	it('should lzw encode/decode large strings', function (done) {
		d3.text('base/test/data/a_lot.txt', function(input) {
			var encoded = lzw_encode(input);
			var decoded = lzw_decode(encoded);

			expect(decoded).toEqual(input);
			done();
		});
	});

	function randomString(length)
	{
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < length; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	it('should lzw encode/decode large heterogeneous strings of 4000 characters', function () {
		var input=randomString(4000);
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded === input).toBeTruthy();
	});

	it('should lzw encode/decode large heterogeneous strings of 40000 characters', function () {
		var input=randomString(40000);
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded === input).toBeTruthy();
	});

	it('should lzw encode/decode large heterogeneous strings of 100000 characters', function () {
		var input=randomString(100000);
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded === input).toBeTruthy();
	});

	it('should lzw encode/decode large heterogeneous strings of 200000 characters', function () {
		var input=randomString(200000);
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded === input).toBeTruthy();
	});


	it('should lzw encode/decode large heterogeneous strings of 400000 characters', function () {
		var input=randomString(400000);
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded === input).toBeTruthy();
	});


	it('should lzw encode/decode binary stuff', function (done) {
		d3.text('base/test/data/binarystuff.txt', function(input) {
			var encoded = lzw_encode(input);
			var decoded = lzw_decode(encoded);

			expect(decoded === input).toBeTruthy();
			done();
		});
	});

});
