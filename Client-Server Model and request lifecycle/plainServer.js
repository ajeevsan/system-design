const http = require('http')
const PORT = 3000

//! create server
const server = http.createServer((req, res) => {
    console.log(`Incoming request ${req.method} ${req.url}`)

    //!simple routing
    if(req.url ==='/' && req.method === 'GET'){
        res.writeHead(200, {'content-type': 'text/plain'})
        res.end('Hello from the server')
    } else if(req.url ==='/users' && req.method==='GET'){
        const users = [{id: 1, name: 'Alice'}, { id: 2, name: 'Bob'}]
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify(users))
    } else {
        res.writeHead(400, {'content-type': 'text/plain'})
        res.end('Not Found')
    }
})


//! server listning to port 3000
server.listen(PORT, () => {
    console.log(`Server is listning to port ${PORT}`)
})