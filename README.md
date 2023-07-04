<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-co


</span>

## Description

This plugin shows a CO air quality accessory that will trigger when then threshold is met - Carbon monoxide ( CO ) NOT carbon dioxide( Co2 )

Example config:
```
{
  "accessories": [
    {
      "accessory": "COSensor",
      "name": "CO Sensor",
      "url": "http://10.1.1.145",
      "threshold": 50,
      "pollingInterval": 60,
      "coLevelPath": "co_level"
    }
  ]
}

```


response must be JSON default path is {"co_level": xx.xx}

