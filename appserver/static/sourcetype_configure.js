require.config({
    paths: {
        "sourcetypeModel" : '../app/sourcetype_monitor/components/models/sourcetypeModel'
    }
});

require([
    'underscore',
    'backbone',
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/searchmanager',
    '../app/sourcetype_monitor/components/views/sourcetypeView',
    "sourcetypeModel",
    'splunkjs/mvc/simplexml/ready!'
], function(_, Backbone, $, mvc, TableView, SearchManager, ModalView, ModalModel) {

    var tokens = mvc.Components.get("submitted");

	var eventBus = _.extend({}, Backbone.Events);
	var lookupTable = mvc.Components.get("lookupTable");
	var lookupSearch = mvc.Components.get("lookupSearch");
	var removeRow = mvc.Components.get("removeRow");
	var addRow = mvc.Components.get("addRow");
	var updateRow = mvc.Components.get("updateRow");
	var model = ModalModel;

	$(document).find('.dashboard-body').append('<button id="addNewRow" class="btn btn-primary">Add New</button>');

	$(document).on('click', '#addNewRow', function(e) {

		e.preventDefault();

		model.set({
			_key: "",
            comments: "",
            contact: "",
            host: "",
            index: "",
            lateSecs: "",
            sourcetype: "",
		});

		var modal = new ModalView({ model : model,
			eventBus : eventBus,
			mode : 'New',
			tokens : tokens });

		modal.show();

	});

	lookupTable.on("click", function(e) {
        e.preventDefault();
		var target = $(e.data)[0]["click.value2"];

		var event = $(e.data)[0];

		model.set({
			_key: event['row.key'],
			comments: event['row.comments'],
			contact: event['row.contact'],
			host: event['row.host'],
			index: event['row.index'],
			lateSecs: event['row.lateSecs'],
			sourcetype: event['row.sourcetype'],
		});

		if(target === 'Edit') {

			tokens.set('key_update_tok',$(e.data)[0]['row.key']);
			var modal = new ModalView({ model : model,
				eventBus : eventBus,
				mode : 'Edit',
				tokens : tokens });
			modal.show();
		}

		if(target === 'Clone') {

			var modal = new ModalView({ model : model,
				eventBus : eventBus,
				mode : 'New',
				tokens : tokens });
			modal.show();
		}

		if(target === 'Remove') {
			console.log('REMOVE');
			tokens.set('key_remove_tok', model.get("_key"));
			tokens.set('comments_remove_tok', model.get("comments"));
			tokens.set('contact_remove_tok', model.get("contact"));
			tokens.set('host_remove_tok', model.get("host"));
			tokens.set('index_remove_tok', model.get("index"));
			tokens.set('sourcetype_remove_tok', model.get("sourcetype"));
			tokens.set('lateSecs_remove_tok', model.get("lateSecs"));

			eventBus.trigger("remove:row");

			//removeRow.startSearch();
		}

    });

	lookupSearch.on("search:done", function(props) {
		console.log('DONE');
	});

	eventBus.on("add:row", function(e) {
		addRow.startSearch();
	});

	eventBus.on("update:row", function(e) {
		updateRow.startSearch();
	});

	eventBus.on("remove:row", function(e) {
		removeRow.startSearch();
	});

	addRow.on('search:failed', function(properties) {
		console.error("FAILED:", properties);
	});

	addRow.on("search:done", function(props) {
		lookupSearch.startSearch();
	});

	updateRow.on("search:done", function(props) {
		lookupSearch.startSearch();
	});

	removeRow.on("search:done", function(props) {
		lookupSearch.startSearch();
	});


});
//# sourceURL=sourcetype_configure.js