const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const socketio = require('./lib/chart_server')

let cache = {}

function send404(response) {
    response.writeHead(404,{'content-type':'text/plain'})
    response.end('Error 404')
}

function sendFile(response,filepath,fileContents) {
    response.writeHead(200, mime.getType(path.basename(filepath)))
    response.end(fileContents)
}

//提供静态文件服务
function serverStatic(response, cache, abspath) {
    if(cache[abspath]){
        sendFile(response,abspath,cache[abspath])
    }else{
        fs.exists(abspath, function(exist){
            if(exist){
                fs.readFile(abspath,function(err,data){
                    if(err){
                        send404(response)
                    }else{
                        sendFile(response,abspath,data)
                    }
                })
            }else{
                send404(response)
            }
        })
    }
}

function start() {
    const server = http.createServer(requestFn)
    server.listen(8080,function(){
        console.log('server start')
    })

    socketio.listen(server)

    function requestFn(request,response) {
        let filepath = ''

        if(request.url == '/'){
            filepath = 'public/index.html'
        }else{
            filepath = `public/${request.url}`
        }

        serverStatic(response,cache,filepath)
    }
}

start()