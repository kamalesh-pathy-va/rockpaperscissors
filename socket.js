'use client';

import { io } from "socket.io-client";

export const socket = io({
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
});