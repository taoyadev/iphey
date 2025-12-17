import dotenv from 'dotenv';

if (typeof process !== 'undefined' && process.release?.name === 'node') {
  dotenv.config();
}
