# ~/website/scrape_monitor/simulation.py

import random
import time
from datetime import datetime, timedelta


class CallCenterSimulator:
    def __init__(self):
        # Initialkonfiguration
        self.current_time = datetime.now()
        self.forecast = 45  # Prognostizierte Anrufe pro 30min
        self.agents_planned = 16  # Geplante Agenten
        self.aht = 600  # Average Handling Time in Sekunden

        # Simulationstatus
        self.waiting_customers = []
        self.active_calls = []
        self.handled_calls = 0
        self.abandoned_calls = 0

        # Initialisiere aktive Anrufe mit halber Agentenkapazität
        initial_active_calls = max(1, self.agents_planned // 2)  # Mind. 1 Anruf

        for _ in range(initial_active_calls):
            # Simuliere bereits laufende Anrufe mit zufälliger Restdauer
            call_duration = random.gauss(self.aht, self.aht * 2)
            end_time = self.current_time + timedelta(seconds=call_duration)
            self.active_calls.append(end_time)

        # Statistiken
        self.peak_wait = 0
        self.total_wait_time = 0

    def _update_agents(self):
        # Simuliere Agentenverfügbarkeit mit Zufallsabwesenheiten
        available_agents = self.agents_planned

        # 10% Chance dass ein Agent kurz abwesend ist
        if random.random() < 0.1 and available_agents > 1:
            available_agents -= 1

        return max(available_agents, 1)  # Mindestens 1 Agent immer da

    def _generate_calls(self):
        # Generiere neue Anrufe basierend auf 30min-Forecast
        # Pro 2-Minuten-Intervall: (Forecast/30) * 2 Minuten + Abweichung
        base_calls = (self.forecast / 30) * 2  # Korrekte Basis für 2 Minuten
        actual_calls = random.randint(
            int(base_calls * 0.7), int(base_calls * 1.3)  # -30%  # +30%
        )

        # Füge Anrufe mit zufälligem Zeitpunkt in den nächsten 2 Minuten hinzu
        for _ in range(actual_calls):
            entry_time = self.current_time + timedelta(seconds=random.randint(0, 120))
            call_duration = random.gauss(
                self.aht,  # Mittlere Bearbeitungszeit
                self.aht * 0.2,  # 20% Standardabweichung
            )
            self.waiting_customers.append((entry_time, max(call_duration, 30)))

    def _handle_calls(self, available_agents):
        # Bearbeite Anrufe und aktualisiere Warteschlange
        # Bearbeite bis zu available_agents Anrufe gleichzeitig
        while len(self.active_calls) < available_agents and self.waiting_customers:
            entry_time, duration = self.waiting_customers[0]
            if entry_time > self.current_time:
                break  # Anruf noch nicht eingetroffen
            self.waiting_customers.pop(0)
            wait_time = (self.current_time - entry_time).total_seconds()

            self.total_wait_time += wait_time
            self.peak_wait = max(self.peak_wait, wait_time)

            end_time = self.current_time + timedelta(seconds=duration)
            self.active_calls.append(end_time)

        # Überprüfe beendete Anrufe
        self.active_calls = [
            end_time for end_time in self.active_calls if end_time > self.current_time
        ]
        completed_calls = available_agents - len(self.active_calls)
        self.handled_calls += completed_calls

    def _update_forecast(self):
        # Passe Prognose mit leichter Zufallsabweichung an
        self.forecast = random.randint(max(1, self.forecast - 3), self.forecast + 3)

    def tick(self, interval=120):
        # Führe einen Simulationsschritt aus (2-Minuten-Intervall)
        self.current_time += timedelta(seconds=interval)
        self._generate_calls()
        available_agents = self._update_agents()
        self._handle_calls(available_agents)
        self._update_forecast()

        # Berechne aktuelle Kennzahlen mit neuer Zeitformatierung
        current_wait_seconds = len(self.waiting_customers) * (
            self.aht / available_agents
        )
        avg_wait_seconds = self.total_wait_time / (self.handled_calls + 1)

        return {
            "timestamp": self.current_time.strftime("%H:%M:%S"),
            "waiting_customers": len(self.waiting_customers),
            "active_calls": len(self.active_calls),
            "current_wait_seconds": round(current_wait_seconds, 1),
            "agents_available": available_agents,
            "forecast_next_30min": self.forecast,
            "handled_today": self.handled_calls,
            "avg_wait_seconds": round(avg_wait_seconds, 1),
            "peak_wait_seconds": round(self.peak_wait, 1),
        }


# Hilfsfunktion für die Zeitformatierung
def format_wait_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes:02d}:{seconds:02d}"


# Beispiel-Nutzung mit korrigierter Ausgabe
if __name__ == "__main__":
    sim = CallCenterSimulator()
    INITIAL_FORECAST = 45  # Korrekte Basis für Prognosefehler-Berechnung

    # Simuliere 1 Stunde in 2-Minuten-Schritten
    for _ in range(150):
        stats = sim.tick()
        formatted_wait = format_wait_time(stats["current_wait_seconds"])

        print(
            f"[{stats['timestamp']}] "
            f"Wartende: {stats['waiting_customers']} | "
            f"Aktive Gespräche: {stats['active_calls']}/{stats['agents_available']} | "
            f"Vorauss. Wartezeit: {formatted_wait}"
        )
        time.sleep(0.1)  # Kürzere Pause

    print("\nZusammenfassung:")
    print(f"Bearbeitete Anrufe: {stats['handled_today']}")
    print(f"Durchschn. Wartezeit: {format_wait_time(stats['avg_wait_seconds'])}")
    print(f"Maximale Wartezeit: {format_wait_time(stats['peak_wait_seconds'])}")
    print(
        f"Prognosefehler: {abs(INITIAL_FORECAST - stats['forecast_next_30min'])} Anrufe"
    )
