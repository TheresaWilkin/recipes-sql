var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var knex = require('knex') ({
	client: 'pg',
		connection: {
			database: 'recipify'
		},
});

app.use(bodyParser.json());

app.post('/recipes', function(req, res) {
	knex('recipes')
	.returning('id')
	.insert({
			name: req.body.name,
			description: req.body.description,
		})
	.then(function(recipe_id) {
		var step_order = 0;
		var stepObjects = req.body.steps.map(step => {
			step_order++;
			return {
				recipe_id: recipe_id[0],
				step_order: step_order,
				name: step
			};
		});

		var tagObjects = req.body.tags.map(tag => {
			return {
				tag: tag
			};
		});

		var stepsPromise= new Promise(function(resolve, reject) {
			knex('steps').insert(stepObjects, 'id').then(data => {
				console.log('steps promise');
				resolve(data);
			});
		});

		var tagsPromise = new Promise(function(resolve, reject) {
			tagObjects.forEach(tag => {
				knex('tags').select('tag').where(tag).then(function(data) {
					if (data.toString() === '') {
						knex('tags').returning('id').insert(tag).then();
					};
				});
			})
		});

		Promise.all([stepsPromise, tagsPromise])
			.then(function() {
				console.log('starting then');
				tagObjects.forEach(tag => {
					knex('tags').select('id').where(tag)
						.then(function(data) {
							knex('recipes_tags').insert({tag_id: data[0].id, recipe_id: recipe_id[0]}).then();
							}).catch(reason=> {console.log(reason);});
				});
				res.status(200).json({});
			})
			.catch(reason => {
				console.log(reason);
			});
	});
});

app.get('/recipes', function(req, res) {
	knex.select('id', 'name', 'description').from('recipes')
	.then(function(recipes) {
	    res.status(200).json(recipes);
	});
});


app.listen(8080, function() {
	console.log('Listening on port 8080');
});