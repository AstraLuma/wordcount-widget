var Data = {
	/*
		$projects: {
			{{projectname}}: {
				total: {{int}},
				today: {{int}}
			},
			...
		},
		$totals: {
			total: {{int}},
			today: {{int}}
		},
		$settings: {
			{{name}}: {{value}},
			...
		},
		{{timestamp}}: {
			name: {{projectname}},
			added: {{words added}}
		}
	*/
	_changed: [],
	init: function() {
		if (typeof localStorage.$projects === "undefined") {
			localStorage.$projects = JSON.stringify({});
		}
		if (typeof localStorage.$totals === "undefined") {
			localStorage.$totals = JSON.stringify({total: 0, today: 0});
		}
		if (typeof localStorage.$settings === "undefined") {
			localStorage.$settings = JSON.stringify({});
		}
	},
	setting: function(sname, value) {
		var settings = JSON.parse(localStorage.$settings);
		if (typeof value === "undefined") {
			return settings[sname];
		} else {
			settings[sname] = value;
			localStorage.$settings = JSON.stringify(settings);
		}
	},
	_update: function() {
		var projects = JSON.parse(localStorage.$projects);
		var totals = {total:0, today:0};
		var orig_projects = JSON.parse(localStorage.$projects);
		var orig_totals = {total:0, today:0};
		
		// Re-init aggregates
		for (pname in projects) {
			projects[pname] = {total: 0, today: 0};
		}
		
		var yesterday = (Math.round(new Date().getTime() / 1000) - 24*60*60).toString();
		
		// Do the aggregation
		for (key in localStorage) {
			if (key[0] == '$') {
				continue;
			}
			console.log(key);
			var update = JSON.parse(localStorage[key]);
			console.log(update);
			projects[update.name].total += update.added;
			totals.total += update.added;
			if (key >= yesterday) {
				projects[update.name].today += update.added;
				totals.today += update.added;
			}
		}
		
		// Save the results
		localStorage.$projects = JSON.stringify(projects);
		localStorage.$totals = JSON.stringify(totals);
		
		// Callbacks for changes
		for (pname in projects) {
			if (projects[pname] != orig_projects[pname]) {
				Data._do_changed(pname, projects[pname].total, projects[pname].today);
			}
		}
		if (totals != orig_totals) {
			Data._do_changed(null, totals.total, totals.today);
		}
	},
	aggregate: function(cb) {
		var totals = JSON.parse(localStorage.$totals);
		
		cb(totals.total, totals.today);
	},
	changed: function(cb) {
		Data._changed.push(cb);
	},
	_do_changed: function(projectname, total, today) {
		Data._changed.forEach(function(cb) {
			cb(projectname, total, today);
		});
	},
	update: function(projectname, wordcount, cb) {
		var projects = JSON.parse(localStorage.$projects);
		var project = projects[projectname];
		var diff = wordcount - project.total;
		var id = Math.round(new Date().getTime() / 1000);
		localStorage[id] = JSON.stringify({
			name: projectname,
			added: diff
		});
		
		Data._update();
		
		if (cb) {
			cb();
		}
	},
	add: function(projectname, cb) {
		var projects = JSON.parse(localStorage.$projects);
		if (projects[projectname]) {
			// Already exists
			return;
		}
		projects[projectname] = {total: 0, today: 0};
		localStorage.$projects = JSON.stringify(projects);
		
		if (cb) {
			cb();
		}
	},
	del: function(projectname, cb) {
		// Delete reference
		var projects = JSON.parse(localStorage.$projects);
		delete projects[projectname];
		localStorage.$projects = JSON.stringify(projects);
		
		// Delete components
		for (key in localStorage) {
			if (key[0] == '$') {
				continue;
			}
			if (JSON.parse(localStorage[key]).name == projectname) {
				delete localStorage[key];
			}
		}
		
		Data._update(); // Recalculate totals
		
		if (cb) {
			cb();
		}
	},
	rename: function(oldname, newname, cb) {
		// Update reference
		var projects = JSON.parse(localStorage.$projects);
		if (projects[newname]) {
			return;
		}
		projects[newname] = projects[oldname];
		delete projects[oldname];
		localStorage.$projects = JSON.stringify(projects);
		
		// Update components
		for (key in localStorage) {
			if (key[0] == '$') {
				continue;
			}
			var component = JSON.parse(localStorage[key]);
			if (component.name == oldname) {
				component.name = newname;
				localStorage[key] = JSON.stringify(component);
			}
		}
		
		Data._update(); // Recalculate totals
		
		if (cb) {
			cb();
		}
	},
	each: function(cb) {
		var projects = JSON.parse(localStorage.$projects);
		for (pname in projects) {
			var project = projects[pname];
			cb(pname, project.total, project.today);
		}
	},
	get: function(projectname, cb) {
		var projects = JSON.parse(localStorage.$projects);
		var project = projects[projectname];
		cb(project.total, project.today);
	}
};
Data.init();


