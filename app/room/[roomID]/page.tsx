'use client';

import { socket } from '@/socket';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Page = ({ params }: { params: { roomID: string } }) => {
  const router = useRouter();
  const [roomid, setRoomid] = useState(params.roomID);
  const [userid, setUserid] = useState(socket.id);
  const [count, setCount] = useState(0);
  const [messageList, setMessageList] = useState<string[]>([]);

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
    socket.emit('room:join', params.roomID, (resStatus: string) => {
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

  const sendMSG = () => {
    socket.emit('send:sampleMsg', count);
    setCount(prev => prev += 1);
  }

  useEffect(() => {
    socket.on('get:sampleRes', resp => {
      setMessageList([...messageList, resp])
    });
  }, [messageList]);

  return (
    <div>
      <p>roomID: {roomid}</p>
      <p>userID: {userid}</p>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleJoin}>Join and start</button>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleBack}>Exit & go back</button>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={sendMSG}>Send sample Message: {count}</button>
      <div>
        {
          messageList?.map((item, index) => <div key={index}>{item}</div>)
        }
      </div>
    </div>
  )
}

export default Page