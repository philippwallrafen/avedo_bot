import websocket


def on_message(ws, message):
    print("Received:", message)


def on_open(ws):
    ws.send("Hello WebSocket!")


ws = websocket.WebSocketApp(
    "wss://echo.websocket.events/", on_message=on_message, on_open=on_open
)
ws.run_forever()
