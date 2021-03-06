class ThingValue {
    constructor(value) {
        this.value = value;
        this.listeners = [];
    }

    addListener(listener) {
        this.listeners.push(listener);
        listener(this.value)
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        this.listeners.forEach(listener => listener(this.value));
    }
}

class ThingConnection {
    constructor() {
        this.values = {
            'outside-lights': new ThingValue(),
            'gate': new ThingValue(),
            'garage-door': new ThingValue(),
            'outside-temperature': new ThingValue(),
            'outside-humidity': new ThingValue(),
            'outside-pressure': new ThingValue()
        }

        setTimeout(() => this._startMock(), 1000);
    }

    _startMock() {
        this.values['outside-lights'].setValue(false);
        this.values['gate'].setValue(false);
        this.values['garage-door'].setValue(false);
        setInterval(()=> {
            this.values['outside-temperature'].setValue(Math.floor(Math.random() * 40) - 5);
            this.values['outside-humidity'].setValue(Math.floor(Math.random() * 100));
            this.values['outside-pressure'].setValue(Math.floor(Math.random() * 100) + 950);
        }, 5000);
    }

    on(event, listener) {
        this.values[event].addListener(listener);
    }

    perform(action) {
        if (action === 'toggle-outside-lights') {
            let value = this.values['outside-lights'].getValue();
            this.values['outside-lights'].setValue(!value);
        } else if (action === 'turn-on-outside-lights') {
            if (this.values['outside-lights'].getValue() === false) {
                this.values['outside-lights'].setValue(true);
            }
        } else if (action === 'turn-off-outside-lights') {
            if (this.values['outside-lights'].getValue() === true) {
                this.values['outside-lights'].setValue(false);
            }
        } else if (action === 'open-gate') {
            if (this.values['gate'].getValue() == false) {
                this.values['gate'].setValue(true);
            }
        } else if (action === 'close-gate') {
            if (this.values['gate'].getValue() === true) {
                this.values['gate'].setValue(false);
            }
        } else if (action === 'toggle-gate') {
            let value = this.values['gate'].getValue();
            this.values['gate'].setValue(!value);
        } else if (action === 'open-garage-door') {
            if (this.values['garage-door'].getValue() === false) {
                this.values['garage-door'].setValue(true);
            }
        } else if (action === 'close-garage-door') {
            if (this.values['garage-door'].getValue() === true) {
                this.values['garage-door'].setValue(false);
            }
        } else if (action === 'toggle-garage-door') {
            let value = this.values['garage-door'].getValue();
            this.values['garage-door'].setValue(!value);
        }
    }

    update(id, newValue) {
        this.values[id].setValue(newValue);
    }
}

thingConnection = new ThingConnection();

//outside lights
WoT.produce({
    title: "outside-light",
    titles: {
        "en": "outside-light"
    },
    description: "Lights in garden",
    descriptions: {
        "en": "Lights in garden",
    },
    support: "git://github.com/eclipse/thingweb.node-wot.git",
    "@context": ["https://www.w3.org/2019/wot/td/v1", { "iot": "http://example.org/iot" }],
    "@type": ["Light", "OnOffSwitch"],
    properties: {
        on: {
            "@type": "OnOffProperty",
            type: "boolean",
            description: "Determines if lights are turned on",
            descriptions: {
                "en": "Determines if lights are turned on"
            },
            observable: true
        },
    }
})
    .then((thing) => {
        thingConnection.on('outside-lights', (lightState) => {
            thing.writeProperty("on", lightState, {fromBackend: true});
        });
        thing.setPropertyWriteHandler("on", (state, options) => {
            return new Promise((resolve, reject) => {
                if (!options || !options.fromBackend) {
                    if (state) {
                        thingConnection.perform('turn-on-outside-lights');
                    } else {
                        thingConnection.perform('turn-off-outside-lights');
                    }
                }
                resolve(state);
            });
        })
        thing.expose().then(() => { console.info(thing.getThingDescription().title + " ready"); });
    })
    .catch((e) => {
        console.log(e);
    });

//gate
WoT.produce({
    title: "gate",
    titles: {
        "en": "gate"
    },
    description: "Front yard gate",
    descriptions: {
        "en": "Front yard gate",
    },
    support: "git://github.com/eclipse/thingweb.node-wot.git",
    "@context": ["https://www.w3.org/2019/wot/td/v1", { "iot": "http://example.org/iot" }],
    "@type": ["DoorSensor"],
    properties: {
        state: {
            "@type": "OpenProperty",
            type: "boolean",
            title: "Gate state",
            description: "Determines if gate is open",
            descriptions: {
                "en": "Determines if gate is open"
            },
            observable: true,
            readOnly: true
        },
    },
    actions: {
        toggle: {
            description: "Toggle gate state",
            description: {
                "en": "Toggle gate state",
            }
        }
    }
})
    .then((thing) => {
        thingConnection.on('gate', (gateState) => {
            thing.writeProperty("state", gateState);
        });
        thing.setActionHandler("toggle", (params, options) => {
            return thing.readProperty("state").then((state) => {
                thingConnection.perform("toggle-gate");
            });
        });

        thing.expose().then(() => { console.info(thing.getThingDescription().title + " ready"); });
    })
    .catch((e) => {
        console.log(e);
    });

//garage door
WoT.produce({
    title: "garage-door",
    titles: {
        "en": "garage-door"
    },
    description: "Door to garage",
    descriptions: {
        "en": "Door to garage",
    },
    support: "git://github.com/eclipse/thingweb.node-wot.git",
    "@context": ["https://www.w3.org/2019/wot/td/v1", { "iot": "http://example.org/iot" }],
    "@type": ["DoorSensor"],
    properties: {
        state: {
            "@type": "OpenProperty",
            type: "boolean",
            title: "Door state",
            description: "Determines if garage door is open",
            descriptions: {
                "en": "Determines if garage door is open"
            },
            observable: true
        },
    },
    actions: {
        toggle: {
            description: "Toggle garage door",
            description: {
                "en": "Toggle garage door"
            }
        }
    }
})
    .then((thing) => {
        thingConnection.on('garage-door', (gateState) => {
            thing.writeProperty("state", gateState);
        });
        thing.setPropertyWriteHandler('state', (state) => {
            return new Promise((resolve, reject) => {
                resolve(state);
            });
        });
        thing.setActionHandler("toggle", (params, options) => {
            return thing.readProperty("state").then((state) => {
                thingConnection.perform('toggle-garage-door');
            });
        });


        thing.expose().then(() => { console.info(thing.getThingDescription().title + " ready"); });
    })
    .catch((e) => {
        console.log(e);
    });

//outside temperature
WoT.produce({
    title: "outside-temperature",
    titles: {
        "en": "outside-temperature"
    },
    description: "Temperature outside",
    descriptions: {
        "en": "Temperature outside",
    },
    support: "git://github.com/eclipse/thingweb.node-wot.git",
    "@context": ["https://www.w3.org/2019/wot/td/v1", { "iot": "http://example.org/iot" }],
    "@type": ["TemperatureSensor"],
    properties: {
        val: {
            "@type": "TemperatureProperty",
            type: "integer",
            description: "Contains temperature value",
            descriptions: {
                "en": "Contains temperature value"
            },
            observable: true,
            readOnly: true
        },
    }
})
    .then((thing) => {
        thingConnection.on('outside-temperature', (measurement) => {
            thing.writeProperty('val', measurement);
        });
        thing.expose().then(() => { console.info(thing.getThingDescription().title + " ready"); });
    })
    .catch((e) => {
        console.log(e);
    });

//outside humidity
WoT.produce({
    title: "outside-humidity",
    titles: {
        "en": "outside-humidity"
    },
    description: "Humidity outside",
    descriptions: {
        "en": "Humidity outside",
    },
    support: "git://github.com/eclipse/thingweb.node-wot.git",
    "@context": ["https://www.w3.org/2019/wot/td/v1", { "iot": "http://example.org/iot" }],
    "@type": ["MultiLevelSensor"],
    properties: {
        val: {
            "@type": "LevelProperty",
            title: "Humidity",
            unit: "Percent",
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Contains humidity value",
            descriptions: {
                "en": "Contains humidity value"
            },
            observable: true,
            readOnly: true
        },
    }
})
    .then((thing) => {
        thingConnection.on('outside-humidity', (measurement) => {
            thing.writeProperty('val', measurement);
        });
        thing.expose().then(() => { console.info(thing.getThingDescription().title + " ready"); });
    })
    .catch((e) => {
        console.log(e);
    });

//outside pressure
WoT.produce({
    title: "outside-pressure",
    titles: {
        "en": "outside-pressure"
    },
    description: "Pressure outside",
    descriptions: {
        "en": "Pressure outside",
    },
    support: "git://github.com/eclipse/thingweb.node-wot.git",
    "@context": ["https://www.w3.org/2019/wot/td/v1", { "iot": "http://example.org/iot" }],
    "@type": ["MultiLevelSensor"],
    properties: {
        val: {
            "@type": "LevelProperty",
            title: "Pressure",
            unit: "hPa",
            type: "integer",
            minimum: 800,
            maximum: 1200,
            description: "Contains pressure value",
            descriptions: {
                "en": "Contains pressure value"
            },
            observable: true,
            readOnly: true
        },
    }
})
    .then((thing) => {
        thingConnection.on('outside-pressure', (measurement) => {
            thing.writeProperty('val', measurement);
        });

        thing.expose().then(() => { console.info(thing.getThingDescription().title + " ready"); });
    })
    .catch((e) => {
        console.log(e);
    });
