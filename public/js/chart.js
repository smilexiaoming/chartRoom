$(function () {
    //调用 io() 时没有指定任何 URL，因为它默认将尝试连接到提供当前页面的主机。
    const socketio = io()

    //显示访客名称
    socketio.on('nameResult',function (data) {
        console.log('nameResult',data);
        if(data.success == '0'){
            $('#room').html('昵称：'+data.name)
        }else if(data.error){
            $("#tip").html(data.error).show()
            setTimeout(() => {
                $("#tip").html('').hide()
            },2000)
        }
    })

    //用户加入房间
    let roomid = ''
    socketio.on('joinResult',function (data) {
        roomid = data.room;
        $('#roomid').html('房间号：'+data.room)
    })

    //接受消息
    socketio.on('message',function (data) {
        console.log('message',data)
        $('#message').append(`<div class="message-item">${data.text}</div>`)
    })

    //所有房间
    socketio.on('allRoom',function (data) {
        console.log("allRoom",data)
        let html = ''
        data.allRooms.forEach(item => {
            html += `<li class="room-item">${item}</li>`
        })
        html = `房间列表：<ul>${html}</ul>`
        $('#allRooms').html(html)
    })

    $('#send-btn').on('click',(e) => {
        e.preventDefault()
        let value = $("#send-message").val()
        //修改名称
        if(value.indexOf('/name ') === 0){
            let name = value.substr(6)
            socketio.emit('editName',name)
        }else if(value.indexOf('/room ') === 0){
            let room = value.substr(6)
            socketio.emit('clientChangeRoom',room)
        }else{
            $('#message').append(`<div class="message-item">${data.text}</div>`)
            //发送消息
            socketio.emit('clientMessage',{
                room:roomid,
                text:value
            })
        }

        $("#send-message").val('')
    })
})