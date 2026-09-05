import requests
import random
import time
from datetime import datetime


API_URL = "http://127.0.0.1:8000/glucose"


def generate_glucose():
    """
    Generate a simulated glucose reading.

    Most readings are normal.
    Occasionally generate low or high readings
    so that the alert system can be demonstrated.
    """

    chance = random.random()

    # 10% chance of LOW glucose
    if chance < 0.10:
        return random.randint(50, 69)

    # 10% chance of HIGH glucose
    elif chance < 0.20:
        return random.randint(181, 220)

    # 80% chance of NORMAL glucose
    else:
        return random.randint(80, 150)


def send_glucose(glucose):
    """
    Send glucose reading to FastAPI backend.
    """

    data = {
        "glucose": glucose
    }

    try:
        response = requests.post(
            API_URL,
            json=data,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()

            print(
                f"{datetime.now().strftime('%H:%M:%S')} "
                f"→ Glucose: {glucose} mg/dL "
                f"→ Status: {result.get('status')} "
                f"→ Server: {response.status_code}"
            )

        else:
            print(
                f"{datetime.now().strftime('%H:%M:%S')} "
                f"→ Glucose: {glucose} mg/dL "
                f"→ Server Error: {response.status_code}"
            )

    except requests.exceptions.ConnectionError:
        print(
            f"{datetime.now().strftime('%H:%M:%S')} "
            "→ ERROR: Could not connect to FastAPI server."
        )

    except requests.exceptions.Timeout:
        print(
            f"{datetime.now().strftime('%H:%M:%S')} "
            "→ ERROR: FastAPI server timed out."
        )

    except requests.exceptions.RequestException as error:
        print(
            f"{datetime.now().strftime('%H:%M:%S')} "
            f"→ ERROR: {error}"
        )


def main():
    print("=" * 55)
    print("       IoT GLUCOSE SENSOR SIMULATOR")
    print("=" * 55)
    print(f"API: {API_URL}")
    print("Sending glucose readings every 5 seconds...")
    print("Press Ctrl+C to stop the simulator.")
    print("=" * 55)

    while True:
        glucose = generate_glucose()

        send_glucose(glucose)

        time.sleep(5)


if __name__ == "__main__":
    main()