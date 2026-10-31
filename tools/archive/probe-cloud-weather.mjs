// Pure initial weather-state lookup, no changed coefficients or ecology steps.
import {createThermalWeather} from '../../src/ecology/thermal-weather.js';
import {createWeatherState} from '../../src/ecology/weather.js';
for(let k=0,found=0;k<3000&&found<3;k++){const seed='CLOUD-ART-'+k,t=createThermalWeather(seed),w=createWeatherState(seed);if(t.anomaly<-.20&&w.factor>1.8){console.log(JSON.stringify({seed,anomaly:t.anomaly,weatherFactor:w.factor,dayOneRain:.58*w.factor}));found++}}
