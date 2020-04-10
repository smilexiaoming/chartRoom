const socketio = require('socket.io')

let io,
    guestNumber = 1,
    nickNames = {},
    nameUsed = [],
    currentRoom = {},
    allRooms = [];

exports.listen = function (server) {
    io = socketio(server)

    io.on('connection', function (socket) {
        console.log('a user connection')

        //用户刚进来时，分配一个名词
        guestNumber = assignName(socket, guestNumber, nickNames)
        //将进入用户加入房间
        joinRoom(socket, 'roomid')
        //允许用户修改自己的昵称
        handleEditNickName(socket,nickNames,nameUsed)
        //发送消息给其他人
        handleSendMessage(socket)
        //创建其他房间
        handleCreateOtherRoom(socket)
        //用户离开房间
        handleClientLeave(socket)
    })
}

function assignName(socket, guestNumber, nickNames) {
    let randomName = 'guest' + guestNumber;
    nickNames[socket.id] = randomName;
    socket.emit('nameResult', {
        success: '0',
        name: randomName
    })

    nameUsed.push(randomName)
    return guestNumber + 1
}

function joinRoom(socket, room) {
    //加入房间
    socket.join(room)
    //记录用户当前房间
    currentRoom[socket.id] = room;
    //告知用户加入房间
    socket.emit('joinResult', { room })
    //通知其他在房间的人
    socket.to(room).emit('message', {
        text: nickNames[socket.id] + ' has join room ' + room
    })

    //记录房间
    allRooms.indexOf(room) === -1 && allRooms.push(room)
    //告知所有房间
    io.emit('allRoom', { allRooms })

    //如果房间还有其他人，将其他人显示在消息框
    //获取有多少客户端连接
    io.clients((error, clients) => {
        if (error) throw error;
        let userInRoom = clients
        //过滤掉不是同一个房间的客户端
        userInRoom = userInRoom.filter(client => currentRoom[client] == room);
        // console.log('userInRoom',clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
        if (userInRoom.length > 1) {
            let usersInRoomText = `users in ${room}：`;
            userInRoom.forEach((userSocketId, i) => {
                if (userSocketId != socket.id) {
                    if (i > 0) {
                        usersInRoomText += '，'
                    }
                    usersInRoomText += nickNames[userSocketId]
                }
            });

            usersInRoomText += '。'
            socket.emit('message', {
                text: usersInRoomText
            })
        }
    });
}

function handleEditNickName(socket,nickNames,nameUsed) {
    socket.on('editName',function(name){
        //不允许guest开头
        if(name.indexOf('guest') !== -1){
            socket.emit('nameResult',{
                success: -1,
                error:'name can not begin with "guest"'
            })
        }else{
            //是否有重名
            if(nameUsed.indexOf(name) === -1){
                let preName = nickNames[socket.id]
                let preNameIndex = nameUsed.indexOf(name)
                nameUsed.splice(preNameIndex,1,name)
                nickNames[socket.id] = name
                socket.emit('nameResult',{
                    success: '0',
                    name:name
                })
                socket.to(currentRoom[socket.id]).emit('message',{
                    text: `"${preName}" has changed name "${name}"`
                })
            }else{
                socket.emit('nameResult',{
                    success: -1,
                    error: 'the nane is already'
                })
            }
        }
    })
}

function handleSendMessage(socket) {
    socket.on('clientMessage',function (message) {
        console.log('node clientMessage',message)
        socket.to(message.room).emit('message',{
            text: nickNames[socket.id] + '：' + message.text
        })
    })
}

function handleCreateOtherRoom(socket) {
    socket.on('clientChangeRoom',function (room) {
        socket.leave(currentRoom[socket.id])
        joinRoom(socket,room)
    })
}

function handleClientLeave(socket) {
    socket.on('disconnect',function (reson) {
        console.log('disconnect',reson)
        socket.to(currentRoom[socket.id]).emit('message',{
            text: nickNames[socket.id] + ' had leave'
        })
        let index = nameUsed.indexOf(nickNames[socket.id]);
        delete currentRoom[socket.id]
        delete nickNames[socket.id]
        nameUsed.splice(index,1)
    })
}