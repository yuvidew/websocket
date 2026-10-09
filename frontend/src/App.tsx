
import { useEffect, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'

const App = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    // Connect to websocket server
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connected to websosket server");
      setStatus("Connected");
    } 

    // Reciver messages from websocket
    ws.onmessage = (event) => {
      console.log(`Reviced: ${event.data}`)
      setMessages((prev) => [...prev, event.data]);
    }

    // Check the websocket
    ws.onerror = (error) => {
      console.log(`Websocket error: ${error}`);
      setStatus("Error");
    }

    // Desconnect to websocket
    ws.onclose = () => {
      console.log(`Websocket disconnected`);
      setStatus("Disconnected");
    }

    socketRef.current = ws;

    // Cleanup when component unmounts
    return () => {
      ws.close();
    };

  }, []);

  const onSend = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN && message.trim()) {
      socketRef.current.send(message);
      setMessage("")
    }else{
      console.log("Websoket is not conntected")
    }
  }

  return (
    <main className='h-screen flex items-center justify-center'>
      <Card>
        <CardHeader>
          <CardTitle>
            State: {status}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={onSend}>
            Send
          </Button>
        </CardContent>
        <CardFooter>
          <ul>
            {messages.map((item, index) => (
              <li key = {index}>{item}</li>
            ))}
          </ul>
        </CardFooter>
      </Card>
    </main>
  )
}

export default App