'use client';

import { socket } from '@/socket';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const Page = ({ params }: { params: { roomID: string } }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomid, setRoomid] = useState(params.roomID);
  const [userid, setUserid] = useState(socket.id);
  const [messageList, setMessageList] = useState<string[]>([]);
  const username = searchParams.get('username');

  // useEffect(() => {
  //   socket.emit('room:join', params.roomID, (resStatus: string) => {
  //     if (resStatus == 'full') {
  //       alert('Room is full, try Play with a stranger')
  //       router.push('/');
  //     }
  //   });
  // }, [params.roomID]);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setUserid(socket.id);
    };
      
    function onDisconnect() {
      handleJoin();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const handleJoin = () => {
    socket.emit('room:join', params.roomID, username, (resStatus: string) => {
      if (resStatus == 'full') {
        alert('Room is full, try Play with a stranger')
        // router.push('/');
      } else if (resStatus == 'ingame') {
        alert('Already in game');
      }
    });
  }

  const handleBack = () => {
    socket.emit('room:leave', params.roomID, socket.id, () => {
      router.push('/');
    });
  };

  const sendMSG = (msg:string) => {
    socket.emit('send:sampleMsg', msg, roomid);
    setMessageList([...messageList, "You: " + msg]);
  }

  useEffect(() => {
    socket.on('get:sampleRes', (resp, name) => {
      setMessageList([...messageList, name + ": " + resp]);
    });
  }, [messageList]);

  return (
    <div>
      <p>roomID: {roomid}</p>
      <p>userID: {userid}</p>
      <p>username: {username}</p>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleJoin}>Join and start</button>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleBack}>Exit & go back</button>
      <div className='flex mt-4 w-1/3 mx-auto justify-between'>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={() => sendMSG('rock')}>Rock</button>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={() => sendMSG('paper')}>Paper</button>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={() => sendMSG('sissors')}>Sissors</button>
      </div>
      <div>
        {
          messageList.map((item, index) => <div key={index}>{item}</div>)
        }
      </div>
    </div>
  )
}

export default Page