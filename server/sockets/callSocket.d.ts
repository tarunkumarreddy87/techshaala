declare module './callSocket' {
  import { Server } from 'socket.io';
  
  export default function callSocket(io: Server): void;
}