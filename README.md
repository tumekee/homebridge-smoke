<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-smoke


</span>

## Description

This plugin shows 
-Carbon monoxide ( CO ) NOT carbon dioxide( Co2 ) levels and has a detection alarm

-Smoke detection


Example config:
```
{
            "accessory": "COSmokeSensor",
            "name": "CO and Smoke Sensor",
            "url": "http://10.1.1.145/json",
            "thresholds": {
                "co": 90,
                "smoke": 70
            },
            "pollingInterval": 5,
            "coLevelPath": "mq7_value",
            "smokeDetectedPath": "mq2_value"
        }

```


response must be JSON 

