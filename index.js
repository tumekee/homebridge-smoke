const axios = require('axios');
const packageJson = require('./package.json');

let Service, Characteristic;

/**
 * @param {API} homebridge
 */
module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-smoke', 'COSmokeSensor', COSmokeSensorAccessory);
};

/**
 * @param {function} log
 * @param {Object} config
 * @constructor
 */
function COSmokeSensorAccessory(log, config) {
  this.log = log;
  this.name = config.name;
  this.url = config.url;
  this.thresholds = config.thresholds || { co: 30, smoke: 1 }; // Default thresholds of 30 ppm for CO and 1 for smoke
  this.pollingInterval = config.pollingInterval || 60; // Default polling interval of 60 seconds
  this.coLevelPath = config.coLevelPath || 'mq7_value'; // Custom JSON path for CO level
  this.smokeDetectedPath = config.smokeDetectedPath || 'mq2_value'; // Custom JSON path for smoke detected

  this.coService = new Service.CarbonMonoxideSensor(this.name + ' CO');
  this.smokeService = new Service.SmokeSensor(this.name + ' Smoke');

  this.coService
    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
    .on('get', this.getCOStatus.bind(this));

  this.coService
    .getCharacteristic(Characteristic.CarbonMonoxideLevel)
    .on('get', this.getCOLevel.bind(this));

  this.smokeService
    .getCharacteristic(Characteristic.SmokeDetected)
    .on('get', this.getSmokeStatus.bind(this));

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
    .setCharacteristic(Characteristic.Model, 'CO_Smoke_Sensor')
    .setCharacteristic(Characteristic.SerialNumber, packageJson.version);

  // Update CO and smoke status and level by interval
  setInterval(() => {
    this.getData((err, data) => {
      if (err) {
        this.log(`Failed to fetch sensor data: ${err}`);
        return;
      }
      const coLevel = this.getValueFromData(data, this.coLevelPath);
      const smokeDetected = this.getValueFromData(data, this.smokeDetectedPath) > this.thresholds.smoke;
      this.log(`Sensor Data - CO Level: ${coLevel}, Smoke Detected: ${smokeDetected}`);
      this.coService
        .getCharacteristic(Characteristic.CarbonMonoxideDetected)
        .updateValue(coLevel > this.thresholds.co);
      this.coService
        .getCharacteristic(Characteristic.CarbonMonoxideLevel)
        .updateValue(coLevel);
      this.smokeService
        .getCharacteristic(Characteristic.SmokeDetected)
        .updateValue(smokeDetected);
    });
  }, this.pollingInterval * 1000);
}

/**
 * @name COSmokeSensorAccessory#getData
 * @function
 */
COSmokeSensorAccessory.prototype.getData = function (callback) {
  axios.get(this.url)
    .then(response => {
      const data = response.data;
      callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
};

/**
 * @name COSmokeSensorAccessory#getValueFromData
 * @function
 */
COSmokeSensorAccessory.prototype.getValueFromData = function (data, path) {
  try {
    const pathParts = path.split('.');
    let value = data;

    for (const part of pathParts) {
      value = value[part];
    }

    return value;
  } catch (error) {
    this.log(`Failed to extract value from data: ${error}`);
    return null;
  }
};

/**
 * @name COSmokeSensorAccessory#getCOStatus
 * @function
 */
COSmokeSensorAccessory.prototype.getCOStatus = function (callback) {
  this.getData((err, data) => {
    if (err) {
      this.log(`Failed to fetch sensor data: ${err}`);
      callback(err);
      return;
    }
    const coLevel = this.getValueFromData(data, this.coLevelPath);
    callback(null, coLevel > this.thresholds.co);
  });
};

/**
 * @name COSmokeSensorAccessory#getCOLevel
 * @function
 */
COSmokeSensorAccessory.prototype.getCOLevel = function (callback) {
  this.getData((err, data) => {
    if (err) {
      this.log(`Failed to fetch sensor data: ${err}`);
      callback(err);
      return;
    }
    const coLevel = this.getValueFromData(data, this.coLevelPath);
    callback(null, coLevel);
  });
};

/**
 * @name COSmokeSensorAccessory#getSmokeStatus
 * @function
 */
COSmokeSensorAccessory.prototype.getSmokeStatus = function (callback) {
  this.getData((err, data) => {
    if (err) {
      this.log(`Failed to fetch sensor data: ${err}`);
      callback(err);
      return;
    }
    const smokeDetected = this.getValueFromData(data, this.smokeDetectedPath) > this.thresholds.smoke;
    callback(null, smokeDetected);
  });
};

/**
 * @name COSmokeSensorAccessory#getServices
 * @function
 */
COSmokeSensorAccessory.prototype.getServices = function () {
  return [this.coService, this.smokeService, this.informationService];
};
