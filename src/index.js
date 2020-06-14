const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//setting up port
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

//let count = 0

    //server (eimt) -> client (recieve) - countUpdated
    //client (eimt) -> server (recieve) - increment

//listening to an event
//it takes 2 args 1st: name of event to occur nd 2nd functn to start when the event occurs
io.on('connection', (socket/**socket is an object nd it contains info about new connection */) => {
    console.log('New WebSocket connection')

    // socket.emit('countUpdated', count) //server emit which is recieved by the client with help of chat.js 

    // socket.on('increment', () => {
    //     count++
    //     //socket.emit('countUpdated', count) //this funcn will emit data to a particular connection
    //     io.emit('countUpdated', count) //this will emit changes to each nd every connections
    // })

    // socket.emit('message', generateMessage('Welcome!'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined!')) //emit the message to everybody except the particular socket(connection)

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        
        if (error) {
            return callback(error)
        }

        socket.join(user.room) //socket.join allow us tojoin a particular chat room nd pass the name of chatroom we want to join
  
        //io.to.emit -> it emits an event to everybody in a specific room
        //socket.broadcast.to.emit -> emits an event to everyone except for the specific client to a specific chatroom

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) 
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    //runs when a connection got disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
