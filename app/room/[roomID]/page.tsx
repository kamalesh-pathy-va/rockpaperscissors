'use client';

import { socket } from '@/socket';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Page = ({ params }: { params: { roomID: string } }) => {
  const router = useRouter();

  // useEffect(() => {
  //   socket.emit('room:join', params.roomID, (resStatus: string) => {
  //     if (resStatus == 'full') {
  //       alert('Room is full, try Play with a stranger')
  //       router.push('/');
  //     }
  //   });
  // }, [params.roomID]);

  const handleJoin = () => {
    socket.emit('room:join', params.roomID, (resStatus: string) => {
      if (resStatus == 'full') {
        alert('Room is full, try Play with a stranger')
        router.push('/');
      }
    });
  }

  const handleBack = () => {
    socket.emit('room:leave', params.roomID, socket.id, () => {
      router.push('/');
    });
  };

  return (
    <div>
      <p>roomID: {params.roomID}</p>
      <p>userID: {socket.id}</p>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleJoin}>Join and start</button>
      <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleBack}>Exit & go back</button>
    </div>
  )
}

export default Page