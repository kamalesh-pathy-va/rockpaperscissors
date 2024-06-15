'use client';

import { socket } from '@/socket';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  const [username, setUsername] = useState('');
  const [info, setInfo] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const handlePlayWithStranger = () => {
    setInfo('Searching for players...');

    socket.emit('room:get', (data: string) => {
      router.push(`/room/${data}`);
    });
    // router.push('/room/');
  };
  
  return (
    <main className="m-4 flex flex-col items-center justify-center gap-4 min-h-[80vh]">
      <h1 className="text-xl md:text-2xl font-bold">Welcome to Rock Paper Scissors</h1>
      <div className='flex flex-col'>
        <label htmlFor="name" className='text-lg'>Enter your name</label>
        <input type="text" className='outline-none border border-neutral-600 p-2 rounded-md focus:border-blue-300 focus:bg-blue-950/80 transition' id='name' onChange={e => setUsername(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handlePlayWithStranger}>Play with a stranger</button>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500">Play with a friend</button>
      </div>

      <p>{info}</p>
    </main>
  );
}
