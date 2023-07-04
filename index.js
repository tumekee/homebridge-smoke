const axios = require('axios');
const packageJson = require('./package.json');

let Service, Characteristic;

/**
 * @param {API} homebridge
 */
module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-co-sensor', 'COSensor', COSensorAccessory);
};

/**
 * @param {function} log
 * @param {Object} config
 * @constructor
 */
function COSensorAccessory(log, config) {
  this.log = log;
  this.name = config.name;
  this.url = config.url;
  this.threshold = config.threshold || 30; // Default threshold value of 30 ppm
  this.pollingInterval = config.pollingInterval || 60; // Default polling interval of 60 seconds
  this.coLevelPath = config.coLevelPath || 'co_level'; // Custom JSON path for CO level

  this.service = new Service.CarbonMonoxideSensor(this.name);

  this.service
    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
    .on('get', this.getCOStatus.bind(this));

  this.service
    .getCharacteristic(Characteristic.CarbonMonoxideLevel)
    .on('get', this.getCOLevel.bind(this));

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
    .setCharacteristic(Characteristic.Model, 'CO_Sensor')
    .setCharacteristic(Characteristic.SerialNumber, packageJson.version);

  // Update CO status and level by interval
  setInterval(() => {
    this.getCOStatus((err, status) => {
      if (err) {
        this.log(`Failed to fetch CO status: ${err}`);
        return;
      }
      this.service
        .getCharacteristic(Characteristic.CarbonMonoxideDetected)
        .updateValue(status);
    });

    this.getCOLevel((err, level) => {
      if (err) {
        this.log(`Failed to fetch CO level: ${err}`);
        return;
      }
      this.service
        .getCharacteristic(Characteristic.CarbonMonoxideLevel)
        .updateValue(level);
    });
  }, this.pollingInterval * 1000);
}

/**
 * @name COSensorAccessory#getCOStatus
 * @function
 */
COSensorAccessory.prototype.getCOStatus = function (callback) {
  axios.get(this.url)
    .then(response => {
      const data = response.data;
      const coLevel = this.getCOValueFromData(data);
      this.log(`CO level: ${coLevel}`);
      const isCODetected = coLevel > this.threshold; // Compare with the threshold
      callback(null, isCODetected);
    })
    .catch(error => {
      this.log(`Failed to fetch CO level: ${error}`);
      callback(error);
    });
};

/**
 * @name COSensorAccessory#getCOLevel
 * @function
 */
COSensorAccessory.prototype.getCOLevel = function (callback) {
  axios.get(this.url)
    .then(response => {
      const data = response.data;
      const coLevel = this.getCOValueFromData(data);
      this.log(`CO level: ${coLevel}`);
      callback(null, coLevel);
    })
    .catch(error => {
      this.log(`Failed to fetch CO level: ${error}`);
      callback(error);
    });
};

/**
 * @name COSensorAccessory#getCOValueFromData
 * @function
 */
COSensorAccessory.prototype.getCOValueFromData = function (data) {
  let coLevel = 0;

  try {
    const pathParts = this.coLevelPath.split('.');
    let value = data;

    for (const part of pathParts) {
      value = value[part];
    }

    coLevel = parseFloat(value);
  } catch (error) {
    this.log(`Failed to extract CO level from data: ${error}`);
  }

  return coLevel;
};

/**
 * @name COSensorAccessory#getServices
 * @function
 */
COSensorAccessory.prototype.getServices = function () {
  return [this.service, this.informationService];
};
