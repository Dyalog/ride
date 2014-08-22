jQuery(function ($) {
	$('#form0').submit(function () {
		$.ajax({
			type: 'POST',
			url: '/session',
			data: $('#in0').val(),
			dataType: 'text'
		});
		$('#in0').val('');
		return false;
	});
	setInterval(function () {
		$.ajax({
			type: 'GET',
			url: '/session',
			success: function (data) {
				$('#out0').text($('#out0').text() + data);
			}
		});
	}, 1000);
});
