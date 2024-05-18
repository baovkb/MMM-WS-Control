var recipe = {
  transcriptionHooks: {
      "BULB_TURN_ON": {
        pattern: "^[Bb]ật [Đđ]èn$",
        command: "BULB_TURN_ON"
      },
      "BULB_TURN_OFF": {
        pattern: "^[Tt]ắt [Đđ]èn$",
        command: "BULB_TURN_OFF"
      },
  },
  commands: {
    "BULB_TURN_ON": {
      moduleExec:{
      module: "MMM-GoogleAssistant",
      exec: (module, param, from)=>{
		  console.log("turn on bulb");
		  module.sendNotification("MMM-WS-Control", {type: "DEVICES_REQUEST", data: [{"name":"bulb 1","device_id":"bulb_00","active":true}]});
		  }
      }
    }, 
    "BULB_TURN_OFF": {
      moduleExec:{
      module: "MMM-GoogleAssistant",
      exec: (module, param, from)=>{
		  console.log("turn off bulb");
		  module.sendNotification("MMM-WS-Control", {type: "DEVICES_REQUEST", data: [{"name":"bulb 1","device_id":"bulb_00","active":false}]});
		  }
      }
    }, 
  },
  plugins: {
    // Describe your plugin callback functions here.
    //
  },
}

exports.recipe = recipe // Don't remove this line.
