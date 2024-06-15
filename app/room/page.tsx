'use client';

import { socket } from '@/socket';
import { useEffect } from 'react'
import { useRouter } from 'next/navigation';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    socket.emit('room:get', (data: string) => {
      router.push(`/room/${data}`);
      // console.log("use effect called twice");
    });
  }, [router]);

  return (
    <div>Searching for players...</div>
  )
}

export default Page