describe('messenger', function () {
	it('should encode/decode something', function () {
		var input = 'Een string';
		var encoded = lzw_encode(input);
		var decoded = lzw_decode(encoded);

		expect(decoded).toEqual(input);
	});

	it('should encode/decode something', function (done) {
		d3.text('base/test/data/a_lot.txt', function(input) {
			var encoded = lzw_encode(input);
			var decoded = lzw_decode(encoded);

			expect(decoded).toEqual(input);
			done();
		});
	});
});
