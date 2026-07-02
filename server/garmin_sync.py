from garminconnect import Garmin
from datetime import date
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GarminService:
    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password
        self.client = None

    def connect(self):
        try:
            self.client = Garmin(self.email, self.password)
            self.client.login()
            logger.info("¡Conexión exitosa con Garmin Connect!")
            return True
        except Exception as e:
            logger.error(f"Error al conectar con Garmin: {e}")
            return False

    def _buscar_llave(self, obj, llave):
        if isinstance(obj, dict):
            if llave in obj and obj[llave] is not None:
                return obj[llave]
            for k, v in obj.items():
                resultado = self._buscar_llave(v, llave)
                if resultado is not None:
                    return resultado
        elif isinstance(obj, list):
            for item in obj:
                resultado = self._buscar_llave(item, llave)
                if resultado is not None:
                    return resultado
        return None

    def get_today_metrics(self):
        if not self.client:
            if not self.connect():
                return None

        today_str = date.today().isoformat()

        try:
            # 1. VO2 Max
            vo2_max = 0
            max_hr = 190
            resting_hr = 50

            try:
                for endpoint in [
                    self.client.get_user_profile(),
                    self.client.get_user_summary(today_str),
                    self.client.get_training_status(today_str),
                ]:
                    if not endpoint: continue
                    
                    if not vo2_max:
                        vo2_max = self._buscar_llave(endpoint, "vo2MaxRunning") or vo2_max
                    
                    # Extraer HR Metrics para Zonas Dinámicas
                    m_hr = self._buscar_llave(endpoint, "maxHeartRate")
                    r_hr = self._buscar_llave(endpoint, "restingHeartRate")
                    if m_hr: max_hr = m_hr
                    if r_hr: resting_hr = r_hr

            except Exception as e:
                logger.warning(f"Error Metrics: {e}")

            # 2. Body Battery
            body_battery = 0
            try:
                bb_data = self.client.get_body_battery(today_str)
                if bb_data and isinstance(bb_data, list) and len(bb_data) > 0:
                    values_array = bb_data[0].get("bodyBatteryValuesArray", [])
                    if values_array:
                        body_battery = values_array[-1][1]
            except Exception as e:
                logger.warning(f"Error Body Battery: {e}")

            return {
                "vo2Max": round(vo2_max) if vo2_max else 0,
                "body_battery": body_battery,
                "max_hr": max_hr,
                "resting_hr": resting_hr
            }

        except Exception as e:
            logger.error(f"Error general: {e}")
            return None