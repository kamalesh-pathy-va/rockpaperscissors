'use client';

import { socket } from '@/socket';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';

const Page = ({ params }: { params: { roomID: string } }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomid, setRoomid] = useState(params.roomID);
  const [userid, setUserid] = useState(socket.id);
  const [opponentChoice, setOpponentChoice] = useState<string>();
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [userChoice, setUserChoice] = useState<string>();
  const username = searchParams.get('username');
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [tie, setTie] = useState(0);


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
    setUserChoice(msg);
    setOpponentChoice('Waiting...');
  }

  useEffect(() => {
    socket.on('get:sampleRes', (resp, name) => {
      setOpponentName(name);
      setOpponentChoice(resp);
    });
  }, []);

  useEffect(() => {
    const updateScores = () => {
      if (userChoice == 'rock' && opponentChoice != 'Waiting...') {
        if (opponentChoice == 'paper') {
          setOpponentScore(prev => prev + 1);
        } else if (opponentChoice == 'sissors') {
          setUserScore(prev => prev + 1);
        } else {
          setTie(prev => prev + 1);
        }
      } else if (userChoice == 'paper' && opponentChoice != 'Waiting...') {
        if (opponentChoice == 'sissors') {
          setOpponentScore(prev => prev + 1);
        } else if (opponentChoice == 'rock') {
          setUserScore(prev => prev + 1);
        } else {
          setTie(prev => prev + 1);
        }
      } else if (userChoice == 'sissors' && opponentChoice != 'Waiting...') {
        if (opponentChoice == 'rock') {
          setOpponentScore(prev => prev + 1);
        } else if (opponentChoice == 'paper') {
          setUserScore(prev => prev + 1);
        } else {
          setTie(prev => prev + 1);
        }
      }
    }
    updateScores();
  }, [opponentChoice])

  return (
    <div>
      <p className='text-xs'>roomID: {roomid} | userID: {userid}</p>
      <p className='text-lg'>Your name: {username}</p>
      <div className='w-full flex justify-center gap-4 mt-4'>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleJoin}>Join and start</button>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={handleBack}>Exit & go back</button>
      </div>
      <div className='flex justify-center mt-4 gap-2'>
        <span>You: {userScore}</span>
        <span>|</span>
        <span>Opponent: {opponentScore}</span>
        <span>|</span>
        <span>Tie: {tie}</span>
      </div>
      <div className='flex md:w-3/4 w-5/6 mx-auto flex-col sm:flex-row gap-12 md:gap-4 items-center mt-6'>
        <div className='w-full md:w-1/2 flex flex-col items-center border'>
          <div className='p-4 w-full border-b text-center'>You</div>
          <span className='text-5xl p-8'>{userChoice}</span>
        </div>
        <div className='w-full md:w-1/2 flex flex-col items-center border'>
          <div className='p-4 w-full border-b text-center'>{opponentName}</div>
          <span className='text-5xl p-8'>{opponentChoice}</span>
        </div>
      </div>
      <div className='flex mt-8 w-3/4 md:w-1/5 mx-auto justify-between'>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={() => sendMSG('rock')}>Rock</button>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={() => sendMSG('paper')}>Paper</button>
        <button className="px-4 py-2 bg-neutral-600 rounded-md hover:bg-neutral-500" onClick={() => sendMSG('sissors')}>Sissors</button>
      </div>
    </div>
  )
}

export default Page