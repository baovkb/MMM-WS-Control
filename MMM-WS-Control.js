Module.register("MMM-WS-Control", {
	config:null,
	page_modules: [],
	deviceData: [],
	conn: null,
	page: 0,
	totalPage: 0,

	defaults: {
		
	},

	init: function(){
		Log.log(this.name + " is in init!");
	},

	start: function(){
		Log.log(this.name + " is starting!");
	},

	getScripts: function() {
		return	[];
	}, 

	getStyles: function() {
		return 	[this.file("assets/style.css")];
	},

	notificationReceived: function(notification, payload, sender) {
		if(notification==="ALL_MODULES_STARTED"){
			this.sendSocketNotification("CONFIG",this.config);
		} else if (notification == "DOM_OBJECTS_CREATED") {
			this.connectWS();
		}
		
		if (notification === "MMM-WS-Control") {
			if (payload.type === "PAGE_CHANGED") {
				this.page = payload.page;
				this.totalPage = payload.total_page;
				this.page_modules = payload.page_modules;
				
				this.sendResponse("refresh");
			} else if (payload.type === "MODULES_UPDATED") {
				if (this.page === payload.page) {
					this.totalPage = payload.total_page;
					this.page_modules = payload.page_modules;
				
					this.sendResponse("accept");
				}
			} else if (payload.type === "DEVICES_REQUEST") {
				if (payload.data !== undefined) {
					this.sendResponse("request", "update devices", payload.data);
				}
				
			}
		}
	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if(notification === "message_from_helper"){
			this.config.message = payload;
		}	
	},

	getHeader: function() {
		return `<span class=MMM-WS-Control--header>Danh sách thiết bị</span>`;
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.classList += "MMM-WS-Control rectangle";

		if (this.conn !== null && this.conn.readyState === WebSocket.OPEN) {
			html = "";
			if (this.deviceData.length === 0) {
				wrapper.classList += " no-item";
				html = `<span>Không có dữ liệu thiết bị</span>`;
			} else {
				html = this.deviceData.map((item, index) => {
					return `
						<div class="device-item ${item.active ? "devices-item--active" : ""}" id="${item.device_id}">
							<div class="devices-item-icon">
								${item.device_id.includes("bulb") ? '<i class="fa-regular fa-lightbulb"></i>' : '<i class="fa-solid fa-fan"></i>'}
							</div>
							<span class="devices-item-header">${item.name}</span>
						</div>
					`
				})
			}
		} else {
			wrapper.classList += " no-item";
			html = `
				<span>Mất kết nối</span>
				<span>${this.config.gateway}<span>
				`;
		}

		wrapper.innerHTML = html;

		return wrapper;
	},

	connectWS: function() {
		this.conn = new WebSocket(this.config.gateway);

		this.conn.onopen = () => {
			this.sendResponse("join");
        };

        this.conn.onclose = () => {
            setTimeout(() => {
                this.connectWS();
            }, 2000);
        }

		this.conn.onmessage = (message) => {	
			data = JSON.parse(message.data);
					
			if (data["sender"] == "server") {

				console.log("MMM-WS-Control receives a msg from server");
				console.log(data);

				if (data["action"] == "request") {			
					this.sendNotification("MMM-Screen-Control", {
						type: "CHANGE_MODULES",
						data: data["data"],
					});
					
				} else if (data["action"] == "update") {
					this.sendResponse("accept");
				} else if (data["action"] == "accept") {
					this.deviceData = data["data"]["devices"];
					this.updateDom();
				}
			}
		}
	},

	sendResponse: function(action, requestType="", data={}) {
		if (action == "join" || action == "accept" || action == "refresh") {
			js = this.payload(action, "", {
				page: this.page,
				total_page: this.totalPage,
				modules: this.page_modules,
			});

		} else if (action == "request") {
			js = this.payload(action, requestType, data)
		} else return;
		
		//send data to server
		try {
			this.conn.send(js);
		} catch(e) {
		}
		
	},

	payload: function(action, requestType, data) {
		json = {
			"sender": "mm",
			"data": data,
			"action": action,
		};
	
		if (action == "request") {
			json["requestType"] = requestType;
		}
	
		return JSON.stringify(json);
	},

})
