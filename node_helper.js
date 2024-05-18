var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	socketNotificationReceived(notification, payload) {
		// if config message from module
		if (notification === "CONFIG") {
			// save payload config info
			this.config=payload;
		}
	},

});
