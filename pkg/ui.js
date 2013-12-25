$(function() {
	function updateTotals(total, today) {
		$('#words-total').text(total);
		$('#words-today').text(today);
		var goal = Data.setting('goal');
		$('#words-today').removeClass("below-goal at-goal above-goal");
		if (today < goal) {
			$('#words-today').addClass('below-goal');
		} else if (today < goal * 1.5) {
			$('#words-today').addClass('at-goal');
		} else {
			$('#words-today').addClass('above-goal');
		}
	}
	
	function enterKey(evt) {
		if (evt.keyCode == 13) {
			evt.preventDefault();
			$(evt.target).blur();
		}
	}	
	
	Data.changed(function(projectname, total, today) {
		if (projectname) {
			$('#projects tr').each(function(i, ele) {
				ele = $(ele);
				if (ele.attr('data-name') == projectname) {
					ele.find('td:first-child').text(total);
				}
			});
		} else {
			updateTotal(total, today);
		}
	});
	
	function addRow(pname, total) {
		$('#projects').append(
			$('<tr></tr>').attr('data-name', pname).append(
				$('<th contenteditable></th>').text(pname).blur(function(evt) {
					var newname = $(evt.target).text();
					$(evt.target).parents('tr').attr('data-name', newname);
					Data.rename(pname, newname);
				}).keypress(enterKey),
				$('<td contenteditable></td>').text(total).blur(function(evt) {
					Data.update(pname, parseInt($(evt.target).text()));
				}).keypress(enterKey),
				$('<td></td>').append(
					$('<button title="Delete">&times;</button>').click(function(evt) {
						if (confirm("Would you like to delete "+pname+"?")) {
							$(evt.target).parents('tr').remove();
							Data.del(pname);
						}
					})
				)
			)
		);
		if (typeof widget != 'undefined') {
			window.resizeTo($('#content').width(), $('#content').height());
		}
	}
	
	$('#add-project').click(function() {
		var projectname = $('#project-name').val();
		if (projectname) {
			addRow(projectname, 0);
			Data.add(projectname);
		}
	});
	
	// Initialize
	Data.each(function(projectname, total, today) {
		addRow(projectname, total);
	});
	
	Data.aggregate(updateTotals);
	
	$('#words-goal').val(Data.setting('goal') || 0);
	$('#words-goal').blur(function() {
		var goal = parseInt($('#words-goal').val());
		Data.setting('goal', goal);
		Data.aggregate(updateTotals);
	});
	
	$('#words-goal').keypress(enterKey);
	
	setInterval(function() {
		Data.aggregate(updateTotals);
	}, 10*60*1000);
});

