jQuery(function ($) {
	var cm = window.cm = CodeMirror(document.getElementById('session'), {
		lineNumbers: true,
		firstLineNumber: 0,
		lineNumberFormatter: function (i) { return '[' + i + ']'; },
		autofocus: true,
		value: '      ',
		extraKeys: {
			'Enter': function () {
				var i = cm.getCursor().line;
				var s = cm.getLine(i);
				cm.replaceRange('', {line: i, ch: 0}, {line: i, ch: s.length});
				$.ajax({
					type: 'POST',
					url: '/session',
					data: s.replace(/^ {6}/, ''),
					dataType: 'text'
				});
			}
		}
	});
	cm.setCursor(0, 6);

	var updateHeight = function () { cm.setSize(null, $(window).height() - 2); };
	updateHeight();
	$(window).resize(updateHeight);

	setInterval(function () {
		$.ajax({
			type: 'GET',
			url: '/session',
			success: function (data) {
				if (data) {
					cm.replaceRange(data, {line: cm.lineCount(), ch: 0});
					cm.replaceRange('      ', {line: cm.lineCount(), ch: 0});
					cm.setCursor(cm.lineCount() - 1, 6);
				}
			}
		});
	}, 100);
});
