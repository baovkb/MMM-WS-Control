Module.register("MMM-WS-Control", {
	config:null,
	visableModules: [],
	deviceData: [],
	conn: null,
	page: 0,
	animationTime: 0,

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
			this.getAnimationTime();
		}
		
		if (notification == "EXT_PAGES-NUMBER_IS" || notification == "MMM-Screen-Control") {
			if (notification == "EXT_PAGES-NUMBER_IS") {
				this.page = payload.Actual;
			}
			
			setTimeout(() => {
				this.getModuleByPage();
				this.sendResponse("refresh");
			}, this.animationTime);
			
		}

		else if (notification === "DOM_OBJECTS_CREATED") {
			this.connectWS();
			this.sendNotification("EXT_PAGES-NUMBER");
		}
	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if(notification === "message_from_helper"){
			this.config.message = payload;
		}	
	},
	
	getAnimationTime: function() {
		MM.getModules().forEach(module => {
			if (module.name == "EXT-Pages") {
				this.animationTime = this.animationTime < module.config.animationTime ? module.config.animationTime : this.animationTime;
			} else if (module.name == "MMM-Screen-Control") {
				this.animationTime = this.animationTime < module.config.speed ? module.config.speed : this.animationTime;
			}
		});
		console.log(this.animationTime);
	},

	getHeader: function() {
		return `<span class=MMM-WS-Control--header>Thiết bị</span>`;
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
					dataArr = data["data"];
					Array.from(dataArr).forEach((m) => {
						if (m.identifier !== undefined && m.hidden !== undefined) {
							if (m.hidden === false) {
								this.sendNotification("MMM-Screen-Control", {
									type: "DISPLAY_MODULE",
									identifier: m.identifier,
								});
							} else {
								this.sendNotification("MMM-Screen-Control", {
									type: "HIDE_MODULE",
									identifier: m.identifier,
								});
							}
						}
					});
					
					this.getModuleByPage();
					this.sendResponse("accept");
				} else if (data["action"] == "update") {
					this.getModuleByPage();
					this.sendResponse("accept");
				} else if (data["action"] == "accept") {
					this.deviceData = data["data"]["devices"];
					this.updateDom();
				}
			}
		}
	},

	getModuleByPage: function() {
		this.visableModules = [];
		let classStr = "";

		MM.getModules().forEach(module => {
			if (module.name === "EXT-Pages") {
				extPageObj = module.config.pages[this.page];
				extPageFixed = module.config.fixed;
				classStr = extPageObj.join(' ') + ' ' + extPageFixed.join(' ');
				classStr = classStr.trim();
				return;
			}
		});

		MM.getModules().forEach(module => {
			let classList = module.data.classes.split(' ');
			classList.forEach(cls => {
				if (classStr.includes(cls)) {
				let name = this.modifyName(module.data.name);				
				this.visableModules.push({
					"name": name,
					"hidden": module.hidden,
					"identifier": module.identifier,
				});
				return;
			}
			})
			
		});
	},

	modifyName: function(name) {
		name = name.replace("MMM", '');
		name = name.replace('-', ' ');
		name = name.trim();

		return name;
	},

	sendResponse: function(action, requestType="", data=[]) {
		if (action == "join" || action == "accept" || action == "refresh") {
			js = this.payload(action, "", this.visableModules);

		} else if (action == "request") {
			js = this.payload(action, requestType, data)
		} else return;
		
		//send data to server
		this.conn.send(js);
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
