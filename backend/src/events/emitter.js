// Application-wide EventEmitter. Controllers only announce what happened;
// listeners (events/listeners.js) decide who to notify. This keeps controllers decoupled from Socket.IO.
//
// Events:
//   scholarship:created        -> notify every student who is eligible
//   application:statusChanged  -> notify the student whose application moved
//   application:applied        -> notify admins that a student applied
const { EventEmitter } = require('events');

module.exports = new EventEmitter();
