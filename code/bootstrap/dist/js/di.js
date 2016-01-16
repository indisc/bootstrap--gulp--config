/**
 * This file contains the dispatcher class to parse and enable jquery class actions
 *
 * @author          Andreas Müller <a.mueller@secu-ring.de>
 * @filesource
 *
 * @copyright       Copyright (c) 2015 secu-ring GmbH (http://www.secu-ring.de)
 */

/**
 * This jquery class provides asynchronous loading for js controller classes,
 * to only load needed javascript files on demand. This loading is triggered
 * by the data-controller attribute of HTML DOM elements. To use the auto loading
 * these js class files have to be implemented as described below.
 *
 * These files must be located at [Document root]/js/[Module]/[Controller].js and they
 * could only contain one jquery class.
 *
 * Example
 *    File:
 *        [document root]/js/Base/Controller.js
 *    Content:
 *
 *        var Base_Controller = Class.create({ ... });
 *
 * @type {*}
 */
var Di = Class.extend({

	/**
	 * This object contains the action calls for
	 * classes which have to be loaded asynchronous.
	 */
	actionStack: {},

	/**
	 * This array contains all js files which already have be loaded,
	 * to prevent redundant server calls.
	 */
	loadedJs: [],

	'diResourceUrl': null,

	'init': function (DiResourceUrl) {

		if ('string' === typeof DiResourceUrl) {

			this.diResourceUrl = DiResourceUrl;
		}

	},

	/**
	 * This method parses all data-controller elements form an given HTML DOM element
	 *
	 * Example
	 *    <h1 data-controller="Foo/Bar/Bat, Foo/Bar/Baz">Test</h1>
	 *
	 *    This setting above invoke the loading for file [document root]/js/Foo/Bar.js
	 *    and the action calls
	 *        Foo_Bar::BatAction(element)
	 *        Foo_Bar::BazAction(element)
	 *
	 * @param element
	 * @throws Exception
	 */
	parse: function (element) {

		/**  get all children with attribute data-controller */
		var controllerElements = element.find('[data-controller]');

		/**  add given element if data-controller attribute is set */
		if (element.prop('data-controller')) {
			controllerElements.push(element);
		}

		$.each(controllerElements, function (key, controllerElement) {

			controllerElement = $(controllerElement);

			/**  get all set controller classes action calls */
			var controllers = controllerElement.attr('data-controller').split(',');


			$.each(controllers, function (index, controller) {

				try {

					var controllerParts = controller.split('/');

					/**  throw exception if invalid declaration is detected */
					if (3 !== controllerParts.length) {
						throw "Invalid controller: " + controller;
					}

					/**  build controller class name */
					var className = controllerParts[0] + '_' + controllerParts[1];

					/**  build action name */
					var action = controllerParts[2] + 'Action';

					/**  prove if controller is already loaded and callable */
					if (undefined === window[className]) {

						/**  add action call to stack, because we have to load the class first */
						this.addActionToStack(className, action, controllerElement);

						/**  load the controller js and set callback function after loading is complete */
						this.loadJs(className, this.callActionStack.bind(this));

					} else {
						/**  controller already loaded, call action */
						this.callAction(className, action, controllerElement);
					}

				} catch (exception) {

					console.log(exception);

				}

			}.bind(this));

		}.bind(this));
	},

	/**
	 * Mootools request wrapper method
	 * @see http://mootools.net/docs/core/Request/Request
	 * @param options
	 * @param file
	 */
	request: function (options, file) {

		options = $.extend({
			method: 'get',

			error: function (hxr) {
				console.log(hxr);
			}

		}, options);

		$.ajax(options);
	},

	/**
	 * Js file loading
	 *
	 * @param className
	 * @param callBack
	 */
	loadJs: function (className, callBack) {

		var classParts = className.split('_');

		/**  build filename */
		var file = classParts[0] + '/' + classParts[1];

		/**  if file already loaded do nothing */
		if (null === this.diResourceUrl || (-1 !== $.inArray(file, this.loadedJs))) {
			return;
		}

		/**  build request options */
		var options = {
			url: '{diResourceUrl}/{file}.js'.substitute({file: file, diResourceUrl: this.diResourceUrl}),
			header: {
				'content-type': 'application/javascript; charset=utf-8;'
			},
			success: function (responseText) {

				if ('' !== responseText) {

					/**  execute the received javascript in window scope */
					window.eval(responseText);

					/**  call callback if set */
					if ('function' === typeof callBack) {
						callBack(className);
					}

				} else {
					console.log("Class {className} is not loadable or no auto loader".substitute({sClassName: className}));
				}

			}.bind(this)
		};

		/**  make request */
		this.request(options, true);

		/**  add file to loaded js files */
		this.loadedJs.push(file);

	},

	/**
	 * This method initialises the js classes
	 * and sets the di attribute if it exists.
	 *
	 * @param className
	 */
	initClass: function (className) {

		/**  only initialize not initialised mootools classes */
		if ('class' === typeof window[className] || 'function' === typeof window[className]) {

			/**  initialize */
			window[className] = new window[className]();

			/**  inject di */
			if (null === window[className]['di']) {
				window[className]['di'] = this;
			}
		}
	},

	/**
	 * This method provides the action calls
	 *
	 * @param className
	 * @param action
	 * @param controllerElement
	 */
	callAction: function (className, action, controllerElement) {


		/**  try to initialize class */
		this.initClass(className);

		/**  call action if defined */
		if (undefined !== window[className][action]) {
			window[className][action](controllerElement);

		} else {
			console.log("Action {action} does not exist in class {className}".substitute({
				'action': action,
				'className': className
			}));
		}

	},

	/**
	 * Add controller action call to action stack
	 * @param controllerName
	 * @param action
	 * @param controllerElement
	 */
	addActionToStack: function (controllerName, action, controllerElement) {

		/**  if controller not set in stack, set it as empty object */
		if (undefined === this.actionStack[controllerName]) {
			this.actionStack[controllerName] = {};
		}

		/**  if no actions for controller are specified add it as empty array */
		if (undefined === this.actionStack[controllerName]['actions']) {
			this.actionStack[controllerName]['actions'] = [];
		}

		/**  add the action to stack by array push */
		this.actionStack[controllerName]['actions'].push({sAction: action, onControllerElement: controllerElement});
	},

	/**
	 * Calls the actions from action stack for a given controller class
	 * @param controllerName
	 */
	callActionStack: function (controllerName) {

		if (undefined !== this.actionStack[controllerName]) {
			this.initClass(controllerName);

			$.each(this.actionStack[controllerName]['actions'], function (key, action) {

				this.callAction(controllerName, action.sAction, action.onControllerElement);

			}.bind(this));
		}

		this.actionStack[controllerName] = null;
	},

	/**
	 * Get loaded class from dom by full classified class name
	 * @param className
	 * @returns {*}
	 */
	get: function (className) {

		/**  try to initialize class */
		this.initClass(className);

		/**  return class if exists */
		if (undefined !== window[className]) {
			return window[className];

		}
	}
});
/**  initialize di only on dom ready */
$('document').ready(function () {

	if ('object' !== typeof Di) {
		Di = new Di(DiResourceUrl);
		Di.parse($('body'));
	}

});